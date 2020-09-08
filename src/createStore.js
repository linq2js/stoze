import createObject from "./createObject";
import createEmitter from "./createEmitter";
import createStateAccessors from "./createStateAccessors";
import is from "./is";
import createTask from "./createTask";
import isEqual from "./isEqual";
import isPromiseLike from "./isPromiseLike";
import createEffectContext from "./createEffectContext";
import { noop } from "./types";
import storeHook from "./useStore";
import watch from "./watch";

export const doneTask = createTask((callback) => callback(undefined));

export default function createStore(
  { $async: defaultAsyncState = {}, ...defaultState } = {},
  { init } = {}
) {
  const emitter = createEmitter();
  const onDispatch = emitter.get("dispatch").on;
  const onChange = emitter.get("change").on;
  const syncStates = createStateAccessors(defaultState, true);
  const asyncStates = createStateAccessors(defaultAsyncState, false);
  const taskMap = new WeakMap();
  const hookContext = { onChange, getSelectorArgs, getState };
  let currentState = defaultState;

  syncStates.rawValueAccessor.$async = asyncStates.rawValueAccessor;
  syncStates.valueAccessor.$async = asyncStates.valueAccessor;
  syncStates.loadableAccessor.$async = asyncStates.loadableAccessor;

  function dispatch(action, payload, parentTask) {
    // remove if it is not task
    if (!is(parentTask).task) {
      parentTask = undefined;
    }

    if (typeof payload === "function") {
      payload = payload(syncStates.rawValueAccessor);
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
    const nextState = { ...syncStates.rawValueAccessor };
    if (!isEqual(currentState, nextState)) {
      currentState = nextState;
    }
    emitter.emit("change", { store, state: syncStates.rawValueAccessor });
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
          state: syncStates.rawValueAccessor,
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

  function applyMutation(
    { $payload, $async, $name, ...mutation },
    payload,
    dispatchContext
  ) {
    if ($payload) {
      payload = $payload(payload, syncStates.rawValueAccessor);
    }

    // async reducer
    if ($async) {
      const modifiedAsyncStates =
        typeof $async === "object"
          ? $async
          : $async(
              asyncStates.loadableAccessor,
              payload,
              syncStates.rawValueAccessor
            );
      Object.entries(modifiedAsyncStates).forEach(([prop, value]) => {
        if (typeof value === "undefined") {
          asyncStates.unset(prop);
        } else if (isPromiseLike(value)) {
          asyncStates.set(prop, value);
        } else if (Array.isArray(value)) {
          asyncStates.set(prop, (update) => update(...value));
        } else {
          throw new Error(
            "Invalid async state value. It must be promise object"
          );
        }
        dispatchContext.hasChange = true;
      });
    }

    const entries = Object.entries(mutation).map(([key, reducer]) => {
      const stateObject = syncStates.stateObjects[key];
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
                ? reducerOrValue(
                    currentValue,
                    result,
                    syncStates.rawValueAccessor
                  )
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
          ? reducerOrValue(currentValue, payload, syncStates.rawValueAccessor)
          : reducerOrValue;
      if (nextValue !== currentValue) {
        dispatchContext.hasChange = true;
      }
      stateObject.update(nextValue);
    });
  }

  function getSelectorArgs() {
    return [syncStates.valueAccessor, syncStates.loadableAccessor];
  }

  function getState() {
    return syncStates.valueAccessor;
  }

  function select(selector) {
    return storeHook(hookContext, selector);
  }

  const store = createObject(
    { store: true },
    {
      get state() {
        return syncStates.rawValueAccessor;
      },
      get loadable() {
        return syncStates.loadableAccessor;
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
