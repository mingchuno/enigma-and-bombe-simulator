import test from "node:test";
import assert from "node:assert/strict";
import { BombeSearchSession } from "../src/engine/bombe-session.ts";
import { DEFAULT_CONFIG } from "../src/engine/enigma.ts";

const options = {
  config: DEFAULT_CONFIG,
  ciphertext: "ILBDAAMTAZ",
  crib: "HELLOWORLD",
  offset: 0,
  allOrders: false,
  maxPairs: 0,
};

function setup() {
  let now = 0;
  const workers = [];
  const session = new BombeSearchSession(
    () => {
      const worker = {
        onmessage: null,
        onerror: null,
        onmessageerror: null,
        terminated: false,
        postMessage(request) {
          this.request = request;
        },
        terminate() {
          this.terminated = true;
        },
      };
      workers.push(worker);
      return worker;
    },
    () => now,
  );
  const progress = (reason = "running") => ({
    type: "progress",
    update: {
      tested: 128,
      total: 17576,
      unresolved: 0,
      candidates: [],
      current: "I–II–III / AEX",
      reason,
    },
  });
  return {
    session,
    workers,
    progress,
    advance: (value) => {
      now = value;
    },
  };
}

test("stopping preserves partial results and freezes elapsed time; late events are ignored", () => {
  const { session, workers, progress, advance } = setup();
  session.start(options);
  const worker = workers[0];
  const lateMessage = worker.onmessage;
  const lateError = worker.onerror;
  worker.onmessage({ data: progress() });
  advance(1500);
  session.stop();
  const stopped = session.getSnapshot();
  assert.equal(stopped.status, "stopped");
  assert.equal(stopped.elapsed, 1.5);
  assert.equal(stopped.progress.tested, 128);
  assert.equal(worker.terminated, true);
  lateMessage({ data: progress("complete") });
  lateError({});
  assert.equal(session.getSnapshot(), stopped);
});

test("reset and restart retire the previous run before accepting new progress", () => {
  const { session, workers, progress } = setup();
  session.start(options);
  const stale = workers[0].onmessage;
  session.reset();
  assert.equal(session.getSnapshot().status, "idle");
  assert.equal(session.getSnapshot().elapsed, 0);
  assert.equal(workers[0].terminated, true);
  session.start({ ...options, allOrders: true });
  assert.equal(session.getSnapshot().progress.total, 1054560);
  stale({ data: progress("complete") });
  assert.equal(session.getSnapshot().status, "running");
  assert.equal(session.getSnapshot().progress.tested, 0);
  const secondStale = workers[1].onmessage;
  session.start(options);
  assert.equal(workers[1].terminated, true);
  secondStale({ data: progress("limit") });
  assert.equal(session.getSnapshot().status, "running");
  session.dispose();
});

for (const reason of ["complete", "limit"]) {
  test(`${reason} retains results and closes the run`, () => {
    const { session, workers, progress, advance } = setup();
    session.start(options);
    advance(2400);
    workers[0].onmessage({ data: progress(reason) });
    const final = session.getSnapshot();
    assert.equal(final.status, "done");
    assert.equal(final.progress.reason, reason);
    assert.equal(final.elapsed, 2.4);
    assert.equal(workers[0].terminated, true);
    session.stop();
    assert.equal(session.getSnapshot(), final);
  });
}

for (const failure of ["search", "worker", "decode"]) {
  test(`${failure} error closes the run and records final elapsed time`, () => {
    const { session, workers, advance } = setup();
    session.start(options);
    advance(700);
    if (failure === "search")
      workers[0].onmessage({
        data: { type: "error", message: "Invalid crib" },
      });
    else if (failure === "worker") workers[0].onerror({});
    else workers[0].onmessageerror({});
    assert.equal(session.getSnapshot().status, "error");
    assert.ok(session.getSnapshot().error);
    assert.equal(session.getSnapshot().elapsed, 0.7);
    assert.equal(workers[0].terminated, true);
  });
}

test("worker construction and dispatch failures leave no active run", () => {
  const unavailable = new BombeSearchSession(() => {
    throw new Error("Unavailable");
  });
  unavailable.start(options);
  assert.equal(unavailable.getSnapshot().status, "error");
  assert.equal(unavailable.getSnapshot().error, "Unavailable");
  let terminated = false;
  const broken = new BombeSearchSession(() => ({
    postMessage() {
      throw new Error("Dispatch failed");
    },
    terminate() {
      terminated = true;
    },
  }));
  broken.start(options);
  assert.equal(broken.getSnapshot().error, "Dispatch failed");
  assert.equal(terminated, true);
});

test("dispose retires callbacks and subscriptions can be removed", () => {
  const { session, workers, progress } = setup();
  let notifications = 0;
  const unsubscribe = session.subscribe(() => notifications++);
  session.start(options);
  assert.ok(notifications > 0);
  unsubscribe();
  const before = notifications;
  const stale = workers[0].onmessage;
  session.dispose();
  const snapshot = session.getSnapshot();
  stale({ data: progress() });
  assert.equal(workers[0].terminated, true);
  assert.equal(session.getSnapshot(), snapshot);
  assert.equal(notifications, before);
});
