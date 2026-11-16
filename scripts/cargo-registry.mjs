import { setTimeout as sleep } from "node:timers/promises";

const transientStatus = new Set([429, 500, 502, 503, 504]);
const transportCodes = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET",
]);
const transientError = (error) =>
  ["TimeoutError", "AbortError"].includes(error?.name) ||
  transportCodes.has(error?.cause?.code ?? error?.code);

function retryDelay(header, attempt, wallNow) {
  if (header !== null && header !== undefined) {
    const value = header.trim();
    if (/^\d+$/.test(value)) return Number(value) * 1000;
    // Accept an HTTP date, not numeric/relative strings accepted by Date.parse.
    if (
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(
        value,
      )
    ) {
      const date = Date.parse(value);
      if (Number.isFinite(date)) return Math.max(0, date - wallNow());
    }
  }
  return 5000 * 2 ** (attempt - 1);
}

/** Retry only idempotent registry reads; an unavailable registry never means absent. */
export async function registryVersion(
  name,
  version,
  request = fetch,
  options = {},
) {
  const now = options.now ?? (() => performance.now());
  const wallNow = options.wallNow ?? Date.now;
  const wait = options.sleep ?? sleep;
  const report = options.report ?? ((message) => console.warn(message));
  const started = now(),
    deadline = started + 60000;
  let failure;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const remaining = deadline - now();
    if (remaining <= 0) break;
    let response, decoded, delay;
    try {
      response = await request(
        `https://crates.io/api/v1/crates/${name}/${version}`,
        {
          headers: {
            "User-Agent":
              "lapis-terminal-release (https://github.com/lapismd/lapis-terminal)",
          },
          signal: AbortSignal.timeout(
            Math.max(1, Math.ceil(Math.min(10000, remaining))),
          ),
        },
      );
      if (response.ok) decoded = await response.json();
    } catch (error) {
      if (!transientError(error)) throw error;
      response = undefined;
      failure = new Error(
        `Registry lookup failed for ${name}: transient ${error.name}`,
        { cause: error },
      );
      delay = retryDelay(null, attempt, wallNow);
    }
    if (response) {
      if (transientStatus.has(response.status)) {
        failure = new Error(
          `Registry lookup failed for ${name}: HTTP ${response.status}`,
        );
        delay = retryDelay(
          response.headers?.get("Retry-After"),
          attempt,
          wallNow,
        );
        await response.body?.cancel();
      } else {
        if (now() >= deadline) break;
        if (response.status === 404) return null;
        if (!response.ok)
          throw Error(
            `Registry lookup failed for ${name}: HTTP ${response.status}`,
          );
        const data = decoded?.version;
        if (now() >= deadline) break;
        if (
          data?.num !== version ||
          data?.crate !== name ||
          data.yanked !== false
        )
          throw Error(`Unexpected or yanked registry version: ${name}`);
        return data;
      }
    }
    const left = deadline - now();
    if (attempt === 4 || !Number.isFinite(delay) || delay >= left) break;
    // A zero/past Retry-After still receives bounded backoff to avoid hot loops.
    delay = Math.max(1000, delay);
    if (delay >= left) break;
    report(
      `Cargo registry ${name}@${version}: ${failure.message}; attempt ${attempt}/4; elapsed ${Math.ceil(now() - started)}ms/60000ms; retry in ${delay}ms.`,
    );
    await wait(delay);
  }
  throw new Error(
    `${failure?.message ?? `Registry lookup deadline elapsed for ${name}`}; retry budget exhausted (at most 4 attempts/60000ms); registry availability is unconfirmed`,
    { cause: failure },
  );
}
