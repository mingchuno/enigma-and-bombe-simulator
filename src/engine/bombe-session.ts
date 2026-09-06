import type { SearchOptions, SearchUpdate } from "./bombe.ts";
import { searchSize } from "./bombe.ts";

export type SearchResponse =
  | { type: "progress"; update: SearchUpdate }
  | { type: "error"; message: string };

type SearchWorker = Pick<
  Worker,
  "postMessage" | "terminate" | "onmessage" | "onerror" | "onmessageerror"
>;

export interface SearchSnapshot {
  status: "idle" | "running" | "stopped" | "done" | "error";
  progress: SearchUpdate;
  error: string;
  elapsed: number;
}

function initialSnapshot(allOrders = false): SearchSnapshot {
  return {
    status: "idle",
    progress: {
      tested: 0,
      total: searchSize(allOrders),
      unresolved: 0,
      candidates: [],
      current: "",
      reason: "running",
    },
    error: "",
    elapsed: 0,
  };
}

/** Owns one search at a time, including progress, timing and worker retirement. */
export class BombeSearchSession {
  private snapshot = initialSnapshot();
  private worker: SearchWorker | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private startedAt = 0;
  private listeners = new Set<() => void>();
  private createWorker: () => SearchWorker;
  private now: () => number;

  constructor(createWorker: () => SearchWorker, now = () => performance.now()) {
    this.createWorker = createWorker;
    this.now = now;
  }

  getSnapshot = (): SearchSnapshot => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  start(options: SearchOptions) {
    this.retire();
    this.startedAt = this.now();
    this.publish({ ...initialSnapshot(options.allOrders), status: "running" });
    try {
      const worker = this.createWorker();
      this.worker = worker;
      worker.onmessage = (event: MessageEvent<SearchResponse>) => {
        if (this.worker !== worker) return;
        const response = event.data;
        if (response.type === "error") {
          this.finish("error", response.message);
          return;
        }
        this.snapshot = { ...this.snapshot, progress: response.update };
        if (response.update.reason === "running") {
          this.publish({ ...this.snapshot, elapsed: this.elapsed() });
        } else {
          this.finish("done");
        }
      };
      worker.onerror = () => {
        if (this.worker === worker)
          this.finish(
            "error",
            "The search worker failed. Try running the search again.",
          );
      };
      worker.onmessageerror = () => {
        if (this.worker === worker)
          this.finish(
            "error",
            "The search response could not be read. Try running the search again.",
          );
      };
      this.timer = setInterval(() => {
        if (this.worker === worker)
          this.publish({ ...this.snapshot, elapsed: this.elapsed() });
      }, 100);
      worker.postMessage(options);
    } catch (error) {
      this.finish(
        "error",
        error instanceof Error ? error.message : "Search failed.",
      );
    }
  }

  stop() {
    if (this.snapshot.status === "running") this.finish("stopped");
  }

  reset() {
    this.retire();
    this.publish(initialSnapshot());
  }

  dispose() {
    this.retire();
  }

  private elapsed() {
    return (this.now() - this.startedAt) / 1000;
  }

  private finish(status: "done" | "stopped" | "error", error = "") {
    const elapsed = this.elapsed();
    this.retire();
    this.publish({ ...this.snapshot, status, error, elapsed });
  }

  private retire() {
    const worker = this.worker;
    this.worker = null;
    clearInterval(this.timer);
    this.timer = undefined;
    if (!worker) return;
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    worker.terminate();
  }

  private publish(snapshot: SearchSnapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}
