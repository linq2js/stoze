import createLoadable from "./createLoadable";
import createObject from "./createObject";
import isPromiseLike from "./isPromiseLike";

export default function createState(defaultValue) {
  const props = {
    state: "hasValue",
    value: undefined,
    lock: undefined,
    error: undefined,
    loadable: undefined,
  };

  function cleanLoadable() {
    if (props.loadable && props.loadable.resolve) {
      props.loadable.resolve();
    }
    delete props.loadable;
  }

  const state = createObject(
    { state: true },
    {
      get rawValue() {
        return props.value;
      },
      get value() {
        if (props.state === "loading") throw this.loadable.promise;
        if (props.state === "hasError") throw this.error;
        return props.value;
      },
      set value(value) {
        props.lock = undefined;
        props.error = undefined;
        props.value = value;
        props.state = "hasValue";
        delete props.loadable;
      },
      get state() {
        return props.state;
      },
      get error() {
        return props.error;
      },
      get loadable() {
        if (!props.loadable) {
          props.loadable = createLoadable(
            props.state,
            props.value,
            props.error
          );
        }
        return props.loadable;
      },
      update(value, reducer) {
        if (arguments.length > 1) {
          if (isPromiseLike(value)) {
            const promise = value;
            state.startUpdating(promise);
            value.then(
              (result) =>
                state.endUpdating(
                  promise,
                  reducer ? reducer(props.value, result) : result
                ),
              (error) => state.endUpdating(promise, props.value, error)
            );
          } else {
            state.value = reducer(props.value, value);
          }
        } else {
          state.value = value;
        }
      },
      startUpdating(lock = {}) {
        const isLoading = props.state === "loading";
        props.state = "loading";
        props.lock = lock;
        if (!isLoading) {
          cleanLoadable();
        }
        return props.lock;
      },
      cancelUpdating(lock) {
        if (props.lock !== lock || props.state !== "loading") return false;
        props.lock = undefined;
        props.state = "hasValue";
        cleanLoadable();
        return true;
      },
      endUpdating(lock, value, error) {
        // invalid lock
        if (lock !== props.lock) return false;
        delete props.lock;
        delete props.error;
        cleanLoadable();
        if (error) {
          props.error = error;
          props.state = "hasError";
        } else {
          props.state = "hasValue";
          // nothing to change
          if (props.value === value) return false;
          props.value = value;
        }
        return true;
      },
    }
  );

  state.value = defaultValue;

  return state;
}
