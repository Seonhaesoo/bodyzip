/* 메타(쓰레드·인스타) API·웹훅 호출 공용 — 일시 오류면 기다렸다가 알아서 다시 시도한다.
 * 다시 시도: 네트워크 끊김, HTTP 5xx·429, 응답의 error.is_transient === true,
 *   오류 코드 1·2(메타 서버 쪽 일시 문제) · 4·17·32·341·613(호출 한도) · 9007(미디어 처리 중, 하위 코드 2207027).
 * 바로 포기: 토큰 만료(190)·권한(10·200)·잘못된 값(100)처럼 기다려도 안 풀리는 오류.
 * 대기는 20초 → 60초 → 120초, 최대 4번 시도. 테스트는 META_RETRY_WAITS=0,0,0 환경변수나 opts.waits·sleep·fetch 로 바꿔 끼운다.
 * 사주첩(SAZU/tools)과 바디집(MOMJA/tools)에 같은 파일이 있다 — 고치면 둘 다 고칠 것. */

export const RETRY_WAITS = (process.env.META_RETRY_WAITS || '20,60,120').split(',').map(Number);
const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 613, 9007]);
const sleepSec = (s) => new Promise((r) => setTimeout(r, s * 1000));

/* HTTP 코드와 응답 JSON 으로 일시 오류인지 가린다 */
export function isTransient(status, body) {
  if (status >= 500 || status === 429) return true;
  const e = body && body.error;
  if (!e || typeof e !== 'object') return false;
  if (e.is_transient === true) return true;
  return TRANSIENT_CODES.has(Number(e.code)) || Number(e.error_subcode) === 2207027;
}

/* fn() 을 부르고 retryable(결과)가 참이면 기다렸다 다시 부른다. 예외(네트워크)는 늘 다시 시도.
 * 끝까지 안 되면 마지막 결과를 돌려주고, 마지막이 예외였으면 그 예외를 던진다. */
export async function withRetry(fn, { retryable = () => false, why = () => '', label = '', waits = RETRY_WAITS, sleep = sleepSec } = {}) {
  for (let i = 0; ; i++) {
    let res, err = null;
    try { res = await fn(); } catch (e) { err = e; }
    const again = err ? true : retryable(res);
    if (!again || i >= waits.length) {
      if (err) throw err;
      return res;
    }
    const reason = err ? '네트워크 오류 ' + (err.message || err) : why(res);
    console.warn(`${label ? label + ' — ' : ''}일시 오류, ${waits[i]}초 뒤 다시 시도 (${i + 1}/${waits.length}): ${String(reason).slice(0, 180)}`);
    await sleep(waits[i]);
  }
}

async function graph(method, url, params, opts = {}) {
  const f = opts.fetch || globalThis.fetch;
  const qs = new URLSearchParams(params);
  const x = await withRetry(async () => {
    const r = method === 'GET' ? await f(url + (url.includes('?') ? '&' : '?') + qs) : await f(url, { method: 'POST', body: qs });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { error: { message: 'JSON이 아닌 응답(HTTP ' + r.status + '): ' + text.slice(0, 120) } }; }
    return { status: r.status, body };
  }, { ...opts, retryable: (y) => isTransient(y.status, y.body), why: (y) => (y.body.error && y.body.error.message) || 'HTTP ' + y.status });
  return x.body;
}

/* 메타 그래프 API — 응답 JSON 을 그대로 돌려준다(성공 { id … } / 실패 { error … }). access_token 은 params 에 넣는다 */
export const metaPost = (url, params, opts) => graph('POST', url, params, opts);
export const metaGet = (url, params, opts) => graph('GET', url, params, opts);

/* 웹훅(Make 등) JSON POST — 네트워크 끊김·5xx·429면 다시 시도. { status, ok, text } */
export function hookPost(url, json, opts = {}) {
  const f = opts.fetch || globalThis.fetch;
  return withRetry(async () => {
    const r = await f(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
    return { status: r.status, ok: r.ok, text: (await r.text()).slice(0, 200) };
  }, { ...opts, retryable: (y) => y.status >= 500 || y.status === 429, why: (y) => 'HTTP ' + y.status + ' ' + y.text });
}
