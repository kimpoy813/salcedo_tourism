import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const origin = "https://guide.test";
const worker = readFileSync(new URL("../public/app/sw.js", import.meta.url), "utf8");

function offlineWorker() {
  type FetchEvent = {
    request: { url: string; method: string; mode: string };
    respondWith(response: Promise<Response>): void;
  };
  let onFetch: (event: FetchEvent) => void;
  const match = vi.fn(async (key: unknown) => {
    if (key === "/app/trips") return new Response("Trip notebook");
    if (key === "/app/offline") return new Response("Offline guide");
    return undefined;
  });
  runInNewContext(worker, {
    URL,
    Response,
    fetch: async () => {
      throw new Error("Offline");
    },
    caches: { open: async () => ({ match }) },
    self: {
      location: { origin },
      addEventListener(type: string, fn: typeof onFetch) {
        if (type === "fetch") onFetch = fn;
      },
    },
  });
  return (href: string, method = "GET", mode = "navigate") => {
    let result: Promise<Response> | undefined;
    onFetch({
      request: { url: new URL(href, origin).href, method, mode },
      respondWith(response) {
        result = response;
      },
    });
    return result;
  };
}

describe("public guide offline routing", () => {
  it("does not intercept private resources, external origins, mutations, or router payloads", () => {
    const request = offlineWorker();
    expect(request("/api/admin/dashboard")).toBeUndefined();
    expect(request("/admin/login")).toBeUndefined();
    expect(request("/api/itineraries/retrieve", "POST")).toBeUndefined();
    expect(request("/app/trips", "POST")).toBeUndefined();
    expect(request("https://other.test/app/")).toBeUndefined();
    expect(request("/app/discover?_rsc=1", "GET", "cors")).toBeUndefined();
  });
  it("opens local drafts from a bookmarked planner tab while offline", async () => {
    const response = await offlineWorker()("/app/trips?tab=saved");
    expect(await response?.text()).toBe("Trip notebook");
  });
  it("offers the recovery page for a destination that has not been cached", async () => {
    const response = await offlineWorker()("/app/places/another-destination");
    expect(await response?.text()).toBe("Offline guide");
  });
});
