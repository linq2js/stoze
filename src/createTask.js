import createObject from "./createObject";
import createEmitter from "./createEmitter";
import isPromiseLike from "./isPromiseLike";
import { noop } from "./types";

export const doneTask = createTask((callback) => callback(undefined));

export const foreverTask = Object.assign(createTask(noop), {
  cancel: noop,
});

export default function createTask(fn) {
  const emitter = createEmitter();
  const onSuccess = emitter.get("success").on;
  const onError = emitter.get("error").on;
  const onDone = emitter.get("done").on;
  const onCancel = emitter.get("cancel").on;
  const onDispose = emitter.get("dispose").on;
  const props = {
    cancelled: false,
    disposed: false,
  };
  const task = {
    cancel,
    cancelled,
    dispose,
    onSuccess,
    onError,
    onDone,
    onCancel,
    onDispose,
    subTask,
    result,
    error,
    cancellable,
    callback,
    done,
    then() {
      return callPromise("then", arguments);
    },
    catch() {
      return callPromise("catch", arguments);
    },
    finally() {
      return callPromise("finally", arguments);
    },
  };

  function cancellable(input) {
    if (!isPromiseLike(input)) {
      throw new Error(
        "Invalid cancellable input. Input must be promise object but got " +
          typeof input
      );
    }
    const props = {
      cancelled: false,
    };
    return Object.assign(
      new Promise((resolve, reject) => {
        input.then(
          (result) => !cancelled() && !props.cancelled && resolve(result),
          (error) => !cancelled() && !props.cancelled && reject(error)
        );
      }),
      {
        cancel() {
          if (props.cancelled) return;
          props.cancelled = true;
        },
        cancelled() {
          return props.cancelled;
        },
      }
    );
  }

  function subTask(subFunc, subOptions) {
    return createTask((subCallback, subApi) => {
      onCancel(subApi.cancel);
      onDispose(subApi.dispose);

      subFunc((...args) => {
        if (cancelled()) return;
        return subCallback(...args);
      }, subApi);
    }, subOptions);
  }

  function result() {
    return props.result;
  }

  function error() {
    return props.error;
  }

  function done() {
    return props.done;
  }

  function cancel() {
    if (props.cancelled || props.done) return;
    // props.reject("cancelled");
    props.cancelled = true;
    emitter.emitOnce("cancel");
    dispose();
  }

  function dispose() {
    if (props.disposed || props.done) return;
    props.disposed = true;
    emitter.emitOnce("dispose");
    emitter.clear();
  }

  function cancelled() {
    return props.cancelled;
  }

  function callPromise(methodName, args) {
    if (!props.promise) {
      props.promise = new Promise((resolve, reject) => {
        onSuccess(resolve);
        onError(reject);
      });
    }
    const method = props.promise[methodName];
    return method.apply(props.promise, args);
  }

  function callback(result, error) {
    props.done = true;
    if (error) {
      props.error = error;
      emitter.emitOnce("error", error);
    } else {
      props.result = result;
      emitter.emitOnce("success", result);
    }
    emitter.emitOnce("done", result, error);
  }

  try {
    fn(callback, task);
  } catch (e) {
    callback(undefined, e);
  }

  return createObject({ task: true }, task);
}
