import createLoadable from "./createLoadable";
import createObject from "./createObject";
import isPromiseLike from "./isPromiseLike";

export default function createState(value, options = {}) {
  const { mutable = false } = options;
  const props = {
    state: "hasValue",
    value: options.defaultValue,
    lock: undefined,
    error: undefined,
    loadable: undefined,
  };
  let initializing = true;

  function cleanLoadable() {
    if (props.loadable && props.loadable.resolve) {
      props.loadable.resolve();
    }
    delete props.loadable;
  }

  function checkMutable() {
    if (initializing) return;
    if (!mutable) throw new Error("Cannot mutate immutable state");
  }

  function update(value, reducer) {
    // update(reducer);
    if (typeof value === "function") {
      return update(value(props.value));
    }

    // update(promise, reducer)
    if (isPromiseLike(value)) {
      const promise = value;
      startUpdating(promise);
      value.then(
        (result) => {
          endUpdating(promise, reducer ? reducer(props.value, result) : result);
        },
        (error) => {
          endUpdating(promise, props.value, error);
        }
      );
    } else {
      // update(value, reducer)
      props.lock = undefined;
      props.error = undefined;
      props.value = reducer ? reducer(props.value, value) : value;
      props.state = "hasValue";
      delete props.loadable;
    }
  }

  function startUpdating(lock = {}) {
    const isLoading = props.state === "loading";
    props.state = "loading";
    props.lock = lock;
    if (!isLoading) {
      cleanLoadable();
    }
    return props.lock;
  }

  function endUpdating(lock, value, error) {
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
        if (!mutable) {
          return createState((update) => update(...arguments), {
            ...options,
            defaultValue: props.value,
          });
        }
        return update(value, reducer);
      },
      startUpdating() {
        checkMutable();
        return startUpdating(...arguments);
      },
      cancelUpdating(lock) {
        checkMutable();
        if (props.lock !== lock || props.state !== "loading") return false;
        props.lock = undefined;
        props.state = "hasValue";
        cleanLoadable();
        return true;
      },
      endUpdating() {
        checkMutable();
        return endUpdating(...arguments);
      },
    }
  );

  if (typeof value === "function") {
    value(function () {
      if (!initializing) {
        throw new Error("State is already initialized");
      }
      return update(...arguments);
    });
  } else {
    update(value);
  }
  initializing = false;

  return state;
}
