export default function createAsyncQueue(promise) {
  const props = {
    state: "succeeded",
    error: undefined,
  };
  const queue = {
    get state() {
      return props.state;
    },
    get error() {
      verifyStatus();
      return props.error;
    },
    get processing() {
      verifyStatus();
      return props.state === "processing";
    },
    get failed() {
      verifyStatus();
      return props.state === "failed";
    },
    get succeeded() {
      verifyStatus();
      return props.state === "succeeded";
    },
    get done() {
      verifyStatus();
      return props.state !== "processing";
    },
    add(item) {
      const promises = Array.isArray(item) ? item : [item];
      if (props.promise) {
        return createAsyncQueue(Promise.all([props.promise].concat(promises)));
      }
      return createAsyncQueue(promises);
    },
  };

  function verifyStatus() {
    if (props.state === "processing") {
      throw props.promise;
    }
    if (props.state === "failed") {
      throw props.error;
    }
  }

  if (promise) {
    const promises = Array.isArray(promise) ? promise : [promise];
    props.promise = promises.length === 1 ? promises[0] : Promise.all(promises);
    props.promise.then(
      () => {
        props.state = "succeeded";
      },
      (error) => {
        props.state = "failed";
        props.error = error;
      }
    );
  }

  return queue;
}
