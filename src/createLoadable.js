const resolvedPromise = Promise.resolve();

export default function createLoadable(state, value, error, promise) {
  const loadable = {
    state,
    value,
    error,
    get promise() {
      if (!promise) {
        if (state === "loading") {
          promise = new Promise((resolve, reject) => {
            loadable.resolve = resolve;
            loadable.reject = reject;
          });
        } else if (state === "hasError") {
          promise = Promise.reject(loadable.error);
        } else {
          promise = resolvedPromise;
        }
      }
      return promise;
    },
  };
  loadable[state] = true;

  return loadable;
}
