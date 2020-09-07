const states = {
  processing: "processing",
  completed: "completed",
  failed: "failed",
};

export default function createAsyncQueue(promise) {
  const props = {
    state: states.completed,
    error: undefined,
  };
  const queue = {
    get state() {
      return props.state;
    },
    get error() {
      return props.error;
    },
    get completed() {
      if (props.state === states.processing) {
        throw props.promise;
      }
      if (props.state === states.failed) {
        throw props.error;
      }
      return true;
    },
    add(item) {
      const promises = Array.isArray(item) ? item : [item];
      if (props.promise) {
        return createAsyncQueue(Promise.all([props.promise].concat(promises)));
      }
      return createAsyncQueue(promises);
    },
  };

  if (promise) {
    const promises = Array.isArray(promise) ? promise : [promise];
    props.promise = promises.length === 1 ? promises[0] : Promise.all(promises);
    props.promise.then(
      () => {
        props.state = states.completed;
      },
      (error) => {
        props.state = states.failed;
        props.error = error;
      }
    );
    props.state = states.processing;
  }

  return queue;
}
