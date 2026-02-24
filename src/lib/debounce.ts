export type DebouncedFn<TArgs extends unknown[]> = {
  call: (...args: TArgs) => void;
  cancel: () => void;
};

export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  ms: number,
): DebouncedFn<TArgs> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    call(...args: TArgs) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        timeoutId = null;
        fn(...args);
      }, ms);
    },
    cancel() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
