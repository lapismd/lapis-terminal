import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import { registryVersion } from "./cargo-release.mjs";

const name = "lapis-terminal-engine",
  version = "0.1.2";
const found = () =>
  new Response(
    JSON.stringify({ version: { crate: name, num: version, yanked: false } }),
  );
function clock() {
  let time = 0;
  const waits = [],
    reports = [];
  return {
    waits,
    reports,
    advance: (ms) => {
      time += ms;
    },
    options: {
      now: () => time,
      wallNow: () => Date.UTC(2026, 10, 16) + time,
      sleep: async (ms) => {
        waits.push(ms);
        time += ms;
      },
      report: (value) => reports.push(value),
    },
  };
}

test("registry planning recovers the observed HTTP 429 only after Retry-After", async () => {
  const c = clock();
  let calls = 0;
  const result = await registryVersion(
    name,
    version,
    async (url, init) => {
      assert.equal(url, `https://crates.io/api/v1/crates/${name}/${version}`);
      assert(init.signal instanceof AbortSignal);
      calls++;
      return calls === 1
        ? new Response("rate limited", {
            status: 429,
            headers: { "Retry-After": "12" },
          })
        : found();
    },
    c.options,
  );
  assert.equal(result.num, version);
  assert.equal(calls, 2);
  assert.deepEqual(c.waits, [12000]);
  assert.equal(c.reports.length, 1);
});

test("HTTP Retry-After dates, invalid dates and zero use finite delays", async () => {
  for (const [header, expected] of [
    ["Mon, 16 Nov 2026 00:00:09 GMT", 9000],
    ["0", 1000],
    ["Sun, 15 Nov 2026 23:59:00 GMT", 1000],
    ["invalid", 5000],
    ["1.5", 5000],
    ["-1", 5000],
  ]) {
    const c = clock();
    let calls = 0;
    await registryVersion(
      name,
      version,
      async () =>
        ++calls === 1
          ? new Response(null, {
              status: 503,
              headers: { "Retry-After": header },
            })
          : found(),
      c.options,
    );
    assert.deepEqual(c.waits, [expected], header);
  }
});

test("429 and selected service errors stop after four failed reads", async () => {
  for (const status of [429, 500, 502, 503, 504]) {
    const c = clock();
    let calls = 0;
    await assert.rejects(
      registryVersion(
        name,
        version,
        async () => {
          calls++;
          return new Response(null, { status });
        },
        c.options,
      ),
      /budget exhausted/,
    );
    assert.equal(calls, 4);
    assert.deepEqual(c.waits, [5000, 10000, 20000]);
  }
});

test("cooldowns beyond the deadline never cause an early retry", async () => {
  for (const header of [
    "60",
    "999999999999999999999999",
    "Tue, 17 Nov 2026 00:00:00 GMT",
  ]) {
    const c = clock();
    let calls = 0;
    await assert.rejects(
      registryVersion(
        name,
        version,
        async () => {
          calls++;
          return new Response(null, {
            status: 429,
            headers: { "Retry-After": header },
          });
        },
        c.options,
      ),
      /availability is unconfirmed/,
    );
    assert.equal(calls, 1);
    assert.deepEqual(c.waits, []);
  }
});

test("one absolute deadline includes request time and delayed waking", async () => {
  const c = clock();
  let calls = 0;
  await assert.rejects(
    registryVersion(
      name,
      version,
      async () => {
        calls++;
        c.advance(30000);
        return new Response(null, { status: 503 });
      },
      c.options,
    ),
    /budget exhausted/,
  );
  assert.equal(calls, 2);
  assert.deepEqual(c.waits, [5000]);
  const late = clock();
  calls = 0;
  await assert.rejects(
    registryVersion(
      name,
      version,
      async () => {
        calls++;
        return new Response(null, { status: 429 });
      },
      { ...late.options, sleep: async () => late.advance(60000) },
    ),
    /budget exhausted/,
  );
  assert.equal(calls, 1);
});

test("recognized transport errors retry; programmer and permission errors do not", async () => {
  for (const error of [
    new DOMException("timed out", "TimeoutError"),
    new DOMException("request aborted", "AbortError"),
    new TypeError("fetch failed", { cause: { code: "ECONNRESET" } }),
  ]) {
    const c = clock();
    let calls = 0;
    await registryVersion(
      name,
      version,
      async () => {
        if (++calls === 1) throw error;
        return found();
      },
      c.options,
    );
    assert.equal(calls, 2);
    assert.deepEqual(c.waits, [5000]);
  }
  for (const error of [new TypeError("invalid URL"), new Error("bug")]) {
    const c = clock();
    await assert.rejects(
      registryVersion(
        name,
        version,
        async () => {
          throw error;
        },
        c.options,
      ),
      (actual) => actual === error,
    );
    assert.deepEqual(c.waits, []);
  }
});

test("absence, permanent errors, invalid identity, yanks and malformed data never retry", async () => {
  for (const status of [400, 401, 403, 405, 422, 501]) {
    const c = clock();
    let calls = 0;
    await assert.rejects(
      registryVersion(
        name,
        version,
        async () => {
          calls++;
          return new Response(null, { status });
        },
        c.options,
      ),
      new RegExp(`HTTP ${status}`),
    );
    assert.equal(calls, 1);
    assert.deepEqual(c.waits, []);
  }
  const c = clock();
  assert.equal(
    await registryVersion(
      name,
      version,
      async () => new Response(null, { status: 404 }),
      c.options,
    ),
    null,
  );
  for (const payload of [
    "invalid json",
    "{}",
    JSON.stringify({
      version: { crate: "other", num: version, yanked: false },
    }),
    JSON.stringify({ version: { crate: name, num: version, yanked: true } }),
  ]) {
    let calls = 0;
    await assert.rejects(
      registryVersion(
        name,
        version,
        async () => {
          calls++;
          return new Response(payload);
        },
        c.options,
      ),
    );
    assert.equal(calls, 1);
  }
  assert.deepEqual(c.waits, []);
});

test("a recognized transport failure while reading the response body retries the GET", async () => {
  const c = clock();
  let calls = 0;
  const value = await registryVersion(
    name,
    version,
    async () => {
      if (++calls > 1) return found();
      return {
        ok: true,
        status: 200,
        json: async () => {
          throw new TypeError("terminated", {
            cause: { code: "UND_ERR_SOCKET" },
          });
        },
      };
    },
    c.options,
  );
  assert.equal(value.num, version);
  assert.equal(calls, 2);
  assert.deepEqual(c.waits, [5000]);
});

test("deadline expiration cannot turn a late 404 or success into registry evidence", async () => {
  for (const status of [200, 404]) {
    const c = clock();
    await assert.rejects(
      registryVersion(
        name,
        version,
        async () => {
          c.advance(60000);
          return status === 200 ? found() : new Response(null, { status });
        },
        c.options,
      ),
      /deadline elapsed/,
    );
  }
});

test("real HTTP 429 response is consumed before a successful idempotent GET retry", async (t) => {
  let calls = 0;
  const server = createServer((req, res) => {
    calls++;
    assert.equal(req.method, "GET");
    assert.equal(req.url, `/api/v1/crates/${name}/${version}`);
    assert.match(req.headers["user-agent"], /lapis-terminal-release/);
    if (calls === 1) {
      res.writeHead(429, { "Retry-After": "1" });
      res.end("limited");
    } else
      res.end(
        JSON.stringify({
          version: { crate: name, num: version, yanked: false },
        }),
      );
  });
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  const result = await registryVersion(
    name,
    version,
    (url, init) => fetch(origin + new URL(url).pathname, init),
    { report: () => {} },
  );
  assert.equal(result.num, version);
  assert.equal(calls, 2);
});
