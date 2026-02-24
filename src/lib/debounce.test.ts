import { describe, expect, it, vi } from "vitest";
import { debounce } from "@/lib/debounce";

describe("debounce", () => {
  it("executa apenas a última chamada após o tempo", () => {
    vi.useFakeTimers();

    const calls: number[] = [];
    const debounced = debounce((value: number) => {
      calls.push(value);
    }, 200);

    debounced.call(1);
    debounced.call(2);
    debounced.call(3);

    vi.advanceTimersByTime(199);
    expect(calls).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(calls).toEqual([3]);

    vi.useRealTimers();
  });

  it("cancel impede execução pendente", () => {
    vi.useFakeTimers();

    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced.call();
    debounced.cancel();

    vi.advanceTimersByTime(100);
    expect(spy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
