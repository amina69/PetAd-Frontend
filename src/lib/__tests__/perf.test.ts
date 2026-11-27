import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetPerfForTests,
  clearPerfMeasures,
  getPerfMeasures,
  measureAsync,
  measureSync,
  PERF_MEASURES,
  recordMeasure,
  recordNotificationFirstRender,
  startPerfMeasure,
  subscribePerf,
} from "../perf";
import * as analyticsModule from "../analytics";

describe("perf module", () => {
  beforeEach(() => {
    __resetPerfForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    __resetPerfForTests();
  });

  describe("consistent naming and constants", () => {
    it("defines consistent flow measure names", () => {
      expect(PERF_MEASURES.ADOPTION_SUBMIT).toBe("adoption:submit");
      expect(PERF_MEASURES.DOCUMENT_UPLOAD).toBe("document:upload");
      expect(PERF_MEASURES.NOTIFICATION_FIRST_RENDER).toBe("notification:first-render");
    });
  });

  describe("startPerfMeasure and recordMeasure", () => {
    it("creates marks and measures in performance timeline with consistent names", () => {
      const markSpy = vi.spyOn(performance, "mark");
      const measureSpy = vi.spyOn(performance, "measure");

      const endMeasure = startPerfMeasure(PERF_MEASURES.ADOPTION_SUBMIT);

      expect(markSpy).toHaveBeenCalledWith("adoption:submit:start");

      const duration = endMeasure({ customProp: "val" });

      expect(markSpy).toHaveBeenCalledWith("adoption:submit:end");
      expect(measureSpy).toHaveBeenCalledWith(
        "adoption:submit",
        "adoption:submit:start",
        "adoption:submit:end",
      );

      // Verify measures exist in Performance timeline entries
      const entries = performance.getEntriesByName("adoption:submit");
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[entries.length - 1].name).toBe("adoption:submit");
      expect(entries[entries.length - 1].entryType).toBe("measure");
      expect(typeof duration).toBe("number");
    });

    it("records measures for document upload consistently", () => {
      const markSpy = vi.spyOn(performance, "mark");
      const measureSpy = vi.spyOn(performance, "measure");

      const end = startPerfMeasure(PERF_MEASURES.DOCUMENT_UPLOAD);
      expect(markSpy).toHaveBeenCalledWith("document:upload:start");

      end();
      expect(markSpy).toHaveBeenCalledWith("document:upload:end");
      expect(measureSpy).toHaveBeenCalledWith(
        "document:upload",
        "document:upload:start",
        "document:upload:end",
      );

      const entries = performance.getEntriesByName("document:upload");
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe("analytics sink integration (consent-gated)", () => {
    it("sends custom timings via trackTiming when recording measures", () => {
      const trackTimingSpy = vi.spyOn(analyticsModule, "trackTiming");

      recordMeasure("test:flow", undefined, undefined, { role: "admin" });

      expect(trackTimingSpy).toHaveBeenCalledWith(
        "test:flow",
        expect.any(Number),
        { role: "admin" },
      );
    });
  });

  describe("dev overlay data and subscriptions", () => {
    it("stores measures accessible by getPerfMeasures", () => {
      expect(getPerfMeasures()).toHaveLength(0);

      const end1 = startPerfMeasure(PERF_MEASURES.ADOPTION_SUBMIT);
      end1();

      const end2 = startPerfMeasure(PERF_MEASURES.DOCUMENT_UPLOAD);
      end2();

      const measures = getPerfMeasures();
      expect(measures.length).toBe(2);
      expect(measures.some((m) => m.name === PERF_MEASURES.ADOPTION_SUBMIT)).toBe(true);
      expect(measures.some((m) => m.name === PERF_MEASURES.DOCUMENT_UPLOAD)).toBe(true);
    });

    it("notifies subscribers when new measures are recorded", () => {
      const listener = vi.fn();
      const unsubscribe = subscribePerf(listener);

      const end = startPerfMeasure(PERF_MEASURES.ADOPTION_SUBMIT);
      end();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          name: PERF_MEASURES.ADOPTION_SUBMIT,
          duration: expect.any(Number),
        }),
      );

      unsubscribe();
      const end2 = startPerfMeasure(PERF_MEASURES.DOCUMENT_UPLOAD);
      end2();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("clears recorded measures via clearPerfMeasures", () => {
      const end = startPerfMeasure(PERF_MEASURES.ADOPTION_SUBMIT);
      end();
      expect(getPerfMeasures().length).toBe(1);

      clearPerfMeasures();
      expect(getPerfMeasures().length).toBe(0);
      expect(performance.getEntriesByName(PERF_MEASURES.ADOPTION_SUBMIT).length).toBe(0);
    });
  });

  describe("recordNotificationFirstRender", () => {
    it("only measures the first notification render once", () => {
      const measureSpy = vi.spyOn(performance, "measure");

      recordNotificationFirstRender();
      expect(measureSpy).toHaveBeenCalledWith(
        PERF_MEASURES.NOTIFICATION_FIRST_RENDER,
        "notification:first-render:start",
        "notification:first-render:end",
      );

      const countAfterFirst = measureSpy.mock.calls.length;

      // Second call should be a no-op and not re-measure
      recordNotificationFirstRender();
      expect(measureSpy.mock.calls.length).toBe(countAfterFirst);
    });
  });

  describe("measureAsync and measureSync helpers", () => {
    it("measures async functions", async () => {
      const result = await measureAsync("custom:async", async () => {
        return "async result";
      });

      expect(result).toBe("async result");
      const measures = getPerfMeasures();
      expect(measures.some((m) => m.name === "custom:async")).toBe(true);
    });

    it("measures sync functions", () => {
      const result = measureSync("custom:sync", () => 42);

      expect(result).toBe(42);
      const measures = getPerfMeasures();
      expect(measures.some((m) => m.name === "custom:sync")).toBe(true);
    });
  });
});
