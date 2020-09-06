import createLoadable from "./createLoadable";
import createObject from "./createObject";
import createEmitter from "./createEmitter";
import createState from "./createState";
import is from "./is";
import createTask from "./createTask";
import isEqual from "./isEqual";
import isPromiseLike from "./isPromiseLike";
import createEffectContext from "./createEffectContext";
import { noop } from "./types";
import storeHook from "./useStore";
import watch from "./watch";

export const doneTask = createTask((callback) => callback(undefined));

export default function createStore(defaultState = {}, { init } = {}) {
  const emitter = createEmitter();
  const onDispatch = emitter.get("dispatch").on;
  const onChange = emitter.get("change").on;
  const stateProps = Object.keys(defaultState);
  const stateObjects = {};
  const rawValueAccessor = {};
  const valueAccessor = {};
  const loadableAccessor = {};
  const taskMap = new WeakMap();
  const hookContext = { onChange, getSelectorArgs, getState };
  let currentState = defaultState;

  stateProps.forEach((prop) => {
    const value = defaultState[prop];
    // is selector
    if (typeof value === "function") {
      const selector = value;
      function valueWrapper() {
        return selector(valueAccessor);
      }
      function rawValueWrapper() {
        return selector(rawValueAccessor);
      }
      let loadable;
      function loadableWrapper() {
        let args;
        try {
          args = {
            value: valueWrapper(),
            state: "hasValue",
          };
        } catch (e) {
          if (isPromiseLike(e)) {
            args = {
              state: "loading",
            };
          } else {
            args = {
              state: "hasError",
              error: e,
            };
          }
        }
        if (
          !loadable ||
          loadable.state !== args.state ||
          loadable.value !== args.value ||
          loadable.error !== args.error
        ) {
          loadable = createLoadable(args.state, args.value, args.error);
        }
      }

      Object.defineProperty(rawValueAccessor, prop, {
        get: rawValueWrapper,
      });
      Object.defineProperty(valueAccessor, prop, {
        get: valueWrapper,
      });
      Object.defineProperty(loadableAccessor, prop, {
        get: loadableWrapper,
      });
      return;
    }

    const stateObject = createState(value);
    stateObjects[prop] = stateObject;
    Object.defineProperty(rawValueAccessor, prop, {
      get() {
        return stateObject.rawValue;
      },
    });
    Object.defineProperty(valueAccessor, prop, {
      get() {
        return stateObject.value;
      },
    });
    Object.defineProperty(loadableAccessor, prop, {
      get() {
        return stateObject.loadable;
      },
    });
  });

  function dispatch(action, payload, parentTask) {
    // remove if it is not task
    if (!is(parentTask).task) {
      parentTask = undefined;
    }

    if (typeof payload === "function") {
      payload = payload(rawValueAccessor);
    }

    const dispatchContext = {
      cancelled: parentTask ? parentTask.cancelled : noop,
      parentTask,
    };

    try {
      let result;
      if (typeof action === "function") {
        result = dispatchEffect(action, payload, dispatchContext);
      } else if (typeof action === "object") {
        result = applyMutation(action, payload, dispatchContext);
      } else {
        throw new Error(
          "Invalid dispatching input. Expect object or function but retrieved " +
            typeof action
        );
      }
      emitter.emit("dispatch", { store, action: action, payload });
      return is(result).task ? result : doneTask;
    } finally {
      if (dispatchContext.hasChange) {
        // reset hasChange flag, it might be changed by async updating latest
        dispatchContext.hasChange = false;
        notifyChange();
      }
    }
  }

  function notifyChange() {
    const nextState = { ...rawValueAccessor };
    if (!isEqual(currentState, nextState)) {
      currentState = nextState;
    }
    emitter.emit("change", { store, state: rawValueAccessor });
  }

  function dispatchEffect(effect, payload, { parentTask }) {
    const lastTask = taskMap.get(effect);
    return createTask((callback, currentTask) => {
      if (parentTask) {
        currentTask.onDispose(parentTask.onCancel(currentTask.cancel));
      }

      taskMap.set(effect, currentTask);

      const result = effect(
        payload,
        createEffectContext(currentTask, {
          state: rawValueAccessor,
          lastTask,
          onDispatch,
          dispatch(action, payload) {
            return dispatch(action, payload, currentTask);
          },
        })
      );

      const unwatch = watch(result, callback);

      if (!unwatch) {
        callback(result);
      }
    });
  }

  function applyMutation({ $, $name, ...mutation }, payload, dispatchContext) {
    if ($) payload = $(payload, rawValueAccessor);
    const entries = Object.entries(mutation).map(([key, reducer]) => {
      const stateObject = stateObjects[key];
      if (!stateObject) {
        throw new Error("Invalid mutation. State does not exist: " + key);
      }
      return [stateObject, reducer, key];
    });
    if (isPromiseLike(payload)) {
      return performAsyncMutation(entries, payload, dispatchContext);
    }
    return performSyncMutation(entries, payload, dispatchContext);
  }

  function performAsyncMutation(mutation, payload, dispatchContext) {
    const lock = {};
    return createTask((callback, { cancelled, onCancel }) => {
      // start updating
      mutation.forEach(([stateObject]) => {
        stateObject.startUpdating(lock);
      });

      onCancel(() => {
        let cancelSuccess = false;
        mutation.forEach(([stateObject]) => {
          if (stateObject.cancelUpdating(lock)) {
            cancelSuccess = true;
          }
        });
        cancelSuccess && notifyChange();
      });

      function update(result, error) {
        if (cancelled() || dispatchContext.cancelled()) return;

        mutation.forEach(([stateObject, reducerOrValue]) => {
          let changed;

          if (error) {
            changed = stateObject.endUpdating(lock, undefined, error);
          } else {
            const currentValue = stateObject.rawValue;
            const nextValue =
              typeof reducerOrValue === "function"
                ? reducerOrValue(currentValue, result, rawValueAccessor)
                : reducerOrValue;
            changed = stateObject.endUpdating(lock, nextValue);
          }

          if (changed) {
            dispatchContext.hasChange = changed;
          }
        });

        // skip error throwing
        // callback(result, error);
        callback();
      }
      dispatchContext.hasChange = true;
      payload
        .then(
          (result) => {
            update(result, undefined);
          },
          (error) => {
            update(undefined, error);
          }
        )
        .finally(() => {
          if (dispatchContext.hasChange) {
            notifyChange();
          }
        });
    });
  }

  function performSyncMutation(mutation, payload, dispatchContext) {
    mutation.forEach(([stateObject, reducerOrValue]) => {
      const currentValue = stateObject.rawValue;
      const nextValue =
        typeof reducerOrValue === "function"
          ? reducerOrValue(currentValue, payload, rawValueAccessor)
          : reducerOrValue;
      if (nextValue !== currentValue) {
        dispatchContext.hasChange = true;
      }
      stateObject.value = nextValue;
    });
  }

  function getSelectorArgs() {
    return [valueAccessor, loadableAccessor];
  }

  function getState() {
    return valueAccessor;
  }

  function select(selector) {
    return storeHook(hookContext, selector);
  }

  const store = createObject(
    { store: true },
    {
      get state() {
        return rawValueAccessor;
      },
      get loadable() {
        return loadableAccessor;
      },
      onChange,
      onDispatch,
      dispatch(action, payload) {
        return dispatch(action, payload);
      },
      select,
    }
  );

  init && dispatch(init);

  return store;
}
