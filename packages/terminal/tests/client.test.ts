import { test } from "node:test";
import assert from "node:assert/strict";
import { createTerminalClient } from "../src/client.js";
import { FixtureTransport, fixtureFrame } from "../src/testing/index.js";
import type { Attachment, TerminalMessage } from "../src/protocol.js";
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
async function setup() {
  const transport = new FixtureTransport();
  const errors: unknown[] = [];
  const client = createTerminalClient(transport, {
    onError: (e) => errors.push(e),
  });
  return {
    transport,
    errors,
    client,
    session: await client.open({ targetId: "demo", requestId: "one" }),
  };
}
test("early channel bootstrap, resize, detach and reattach preserve output", async () => {
  const { session, transport } = await setup();
  await session.attach();
  assert.match(session.snapshot.grid!.text(), /你好/);
  await session.resize(120, 30);
  assert.equal(session.snapshot.grid!.viewport.columns, 120);
  await session.input("retained");
  await session.detach();
  assert.equal(transport.closed.length, 0);
  await session.attach();
  assert.match(session.snapshot.grid!.text(), /retained/);
  await session.close();
  assert.deepEqual(transport.closed, ["one"]);
});
test("late attach response detaches only its own subscription", async () => {
  const { session, transport } = await setup();
  const attach = transport.attach.bind(transport);
  let resolve!: (value: Attachment) => void;
  let old!: Attachment;
  transport.attach = async (id, receive) => {
    old = await attach(id, receive);
    return new Promise((r) => (resolve = r));
  };
  const first = session.attach();
  await tick();
  await session.detach();
  transport.attach = attach;
  await session.attach();
  resolve(old);
  await first;
  await session.input("current");
  assert.match(session.snapshot.grid!.text(), /current/);
});
test("stale channel callbacks and errors do not affect a replacement view", async () => {
  const { session, transport, errors } = await setup();
  const attach = transport.attach.bind(transport);
  let oldReceive!: (m: TerminalMessage) => void;
  transport.attach = (id, receive) => {
    oldReceive = receive;
    return attach(id, receive);
  };
  await session.attach();
  const old = oldReceive;
  await session.detach();
  await session.attach();
  old({ type: "exit" });
  old({ type: "title", payload: "obsolete" });
  assert.equal(session.snapshot.info.exited, false);
  assert.notEqual(session.snapshot.info.title, "obsolete");
  let reject!: (e: Error) => void;
  transport.input = () => new Promise((_, no) => (reject = no));
  const input = session.input("late").catch(() => {});
  await session.detach();
  reject(new Error("late error"));
  await input;
  assert.equal(errors.length, 0);
});
test("old viewports still release frame credit without replacing the current grid", async () => {
  const { session, transport } = await setup();
  const attach = transport.attach.bind(transport);
  let receive!: (m: TerminalMessage) => void;
  let subscription = "";
  transport.attach = async (id, callback) => {
    receive = callback;
    const value = await attach(id, callback);
    subscription = value.subscriptionId;
    return value;
  };
  await session.attach();
  const oldViewport = session.snapshot.grid!.viewport;
  await session.resize(100, 20);
  const acks: number[] = [];
  transport.ack = async (_id, _sub, seq) => {
    acks.push(seq);
  };
  receive({
    type: "frame",
    payload: fixtureFrame(["obsolete"], oldViewport, subscription, 77),
  });
  await tick();
  assert.deepEqual(acks, [77]);
  assert.doesNotMatch(session.snapshot.grid!.text(), /obsolete/);
});
test("new mount resize is not lost behind an old in-flight resize", async () => {
  const { session, transport } = await setup();
  await session.attach();
  const resize = transport.resize.bind(transport);
  let release!: () => void;
  let first = true;
  transport.resize = async (...args) => {
    if (first) {
      first = false;
      await new Promise<void>((r) => (release = r));
    }
    return resize(...args);
  };
  const before = session.resize(100, 25);
  await tick();
  await session.detach();
  await session.attach();
  const after = session.resize(130, 35);
  release();
  await Promise.all([before, after]);
  assert.equal(session.snapshot.grid!.viewport.columns, 130);
});

test("frame-driven layout checks do not create a resize/readiness loop", async () => {
  const { session, transport, errors } = await setup();
  const ready = transport.ready.bind(transport);
  let readyCalls = 0;
  transport.ready = async (...args) => {
    if (++readyCalls > 5) throw new Error("resize feedback loop");
    return ready(...args);
  };
  const unsubscribe = session.subscribe(() => {
    void session.resize(120, 30).catch(() => {});
  });
  await session.attach();
  await tick();
  await tick();
  assert.equal(readyCalls, 1);
  assert.equal(errors.length, 0);
  unsubscribe();
});

test("discovery errors use the same typed notification path exactly once", async () => {
  const { transport, client, errors } = await setup();
  transport.targets = async () => {
    throw { code: "denied", message: "Target access revoked" };
  };
  await assert.rejects(client.targets(), {
    code: "denied",
    message: "Target access revoked",
  });
  assert.equal(errors.length, 1);
});
