import createObject from "./createObject";
import createEmitter from "./createEmitter";
import createStateAccessors from "./createStateAccessors";
import is from "./is";
import createTask, { doneTask, foreverTask } from "./createTask";
import isEqual from "./isEqual";
import isPromiseLike from "./isPromiseLike";
import createEffectContext from "./createEffectContext";
import { matchAny, noop, unset } from "./types";
import watch from "./watch";

export default function createStore(defaultState, options = {}) {
  const initialState = { ...defaultState };
  const {
    init,
    plugins = [],
    onChange: onChangeListener,
    onDispatch: onDispatchListener,
    onError: onErrorListener,
    storeHook,
  } = options;

  const emitter = createEmitter();
  const taskMap = new WeakMap();
  const hookContext = { onChange, getSelectorArgs, getState };
  let syncStates;
  let asyncStates;
  let loading = true;
  let currentTransaction;
  let currentVersion = {};
  let lastSnapshot;
  // let currentState;
  let loadPromise;

  function onChange() {
    if (arguments.length > 1) {
      // onChange(selector, listener)
      const [selector, listener] = arguments;
      let prevValue = unset;
      return onChange((args) => {
        const nextValue = selector(args.state);
        if (prevValue === unset) {
          prevValue = nextValue;
          return;
        }
        if (isEqual(nextValue, prevValue)) return;
        prevValue = nextValue;
        listener({ ...args, store, value: nextValue, state: args.state });
      });
    }
    return emitter.on("change", arguments[0]);
  }

  function onDispatch() {
    if (arguments.length > 1) {
      const [action, listener] = arguments;
      const actions = Array.isArray(action) ? action : [action];
      const matchers = actions.map((action) => {
        if (typeof action === "string") {
          if (action === "*") return matchAny;
          return (args) =>
            typeof args.action === "function"
              ? args.action.name === action
              : args.action.$name === action;
        }
        return (args) => args.action === action;
      });
      return onDispatch((args) => {
        if (!matchers.some((matcher) => matcher(args))) return;
        return listener(args);
      });
    }
    return emitter.on("dispatch", arguments[0]);
  }

  function initState(
    { $async: defaultAsyncState = {}, ...defaultSyncState } = {},
    notify
  ) {
    syncStates = createStateAccessors(defaultSyncState, true);
    asyncStates = createStateAccessors(defaultAsyncState, false);
    syncStates.rawValueAccessor.$async = asyncStates.rawValueAccessorFn;
    syncStates.valueAccessor.$async = asyncStates.valueAccessorFn;
    syncStates.loadableAccessor.$async = asyncStates.loadableAccessorFn;
    notify && notifyChange({ init: true });
  }

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
      const isTask = is(result).task;
      if (isTask && onErrorListener) {
        result.onError((error) => onErrorListener({ error, store }));
      }
      emitter.emit("dispatch", { store, action: action, payload });
      return isTask ? result : doneTask;
    } finally {
      if (dispatchContext.hasChange) {
        // reset hasChange flag, it might be changed by async updating latest
        dispatchContext.hasChange = false;
        notifyChange();
      }
    }
  }

  function notifyChange(customArgs) {
    // change store version
    currentVersion = {};
    emitter.emit("change", {
      store,
      state: syncStates.rawValueAccessor,
      ...customArgs,
    });
  }

  function createSnapshot() {
    if (lastSnapshot && lastSnapshot.version === currentVersion) {
      return lastSnapshot;
    }

    const states = [syncStates.clone(), asyncStates.clone()];
    const version = currentVersion;

    return (lastSnapshot = {
      get version() {
        return version;
      },
      get state() {
        return states[0].rawValueAccessor;
      },
      revert() {
        [syncStates, asyncStates] = [states[0].clone(), states[1].clone()];
        notifyChange();
      },
    });
  }

  function createTransaction(fn) {
    if (typeof fn === "function") {
      const t = createTransaction();
      try {
        const result = fn(t);
        if (isPromiseLike(result)) {
          return result.then(
            (asyncResult) => {
              t.commit();
              return asyncResult;
            },
            (error) => {
              t.rollback();
              throw error;
            }
          );
        }
        t.commit();
        return result;
      } catch (error) {
        t.rollback();
        throw error;
      }
    }
    let parentRolledBack = false;
    let status = "active";
    const states = [syncStates.clone(), asyncStates.clone()];
    const transaction = createTask(noop);
    transaction.parent = currentTransaction;
    transaction.onCancel(() => {
      status = "rolledBack";
      if (parentRolledBack) return;
      [syncStates, asyncStates] = states;
      notifyChange();
    });

    if (transaction.parent) {
      transaction.parent.onCancel(() => {
        parentRolledBack = true;
        transaction.cancel();
      });
    }
    currentTransaction = transaction;

    function done() {
      return status !== "active";
    }

    return {
      get done() {
        return done();
      },
      get state() {
        return states[0].rawValueAccessor;
      },
      get rolledBack() {
        return status === "rolledBack";
      },
      get committed() {
        return status === "committed";
      },
      commit() {
        if (done()) return;
        status = "committed";
        transaction.callback();
        return true;
      },
      rollback() {
        if (done()) return;
        transaction.cancel();
        return true;
      },
    };
  }

  function dispatchEffect(effect, payload, { parentTask }) {
    const lastTask = taskMap.get(effect);
    const transaction = currentTransaction;
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
            if (transaction !== currentTransaction) {
              return foreverTask;
            }
            const previousTransaction = currentTransaction;
            currentTransaction = transaction;
            try {
              return dispatch(action, payload, currentTask);
            } finally {
              currentTransaction = previousTransaction;
            }
          },
        })
      );

      const unwatch = watch(result, callback);

      if (!unwatch) {
        callback(result);
      }
    });
  }

  function applyMutation(originalMutation, payload, dispatchContext) {
    if (!originalMutation.$name) {
      // generate temp name for mutation
      originalMutation.$name = "@@mutation_" + Math.random().toString(16);
    }

    const { $payload, $async, $name, ...mutation } = originalMutation;
    if ($payload) {
      payload = $payload(payload, syncStates.rawValueAccessor);
    }

    // async reducer
    if ($async) {
      const modifiedAsyncStates =
        typeof $async !== "function"
          ? $async
          : $async(
              asyncStates.loadableAccessorFn,
              payload,
              syncStates.rawValueAccessor
            );
      if (Array.isArray(modifiedAsyncStates)) {
        // using key and value pair to update multiple async states
        modifiedAsyncStates.forEach(({ key, value }) => {
          if (typeof value === "undefined" || value === null) {
            asyncStates.unset(key);
          } else {
            asyncStates.set(key, value);
          }
          dispatchContext.hasChange = true;
        });
      } else {
        // using value map to update multiple async states { prop1: value1, prop2: value2 }
        Object.entries(modifiedAsyncStates).forEach(([prop, value]) => {
          // remove async state
          if (typeof value === "undefined" || value === null) {
            asyncStates.unset(prop);
          } else {
            asyncStates.set(prop, value);
          }
          dispatchContext.hasChange = true;
        });
      }
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
    const transaction = currentTransaction;
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
        if (
          cancelled() ||
          dispatchContext.cancelled() ||
          transaction !== currentTransaction
        )
          return;

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

  function addActions(actions) {
    Object.entries(actions).forEach(([key, action]) => {
      store[key] = (...args) => dispatch(action, ...args);
    });
    return store;
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
    if (loading) throw loadPromise;
    return storeHook(hookContext, store, selector);
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
      get loading() {
        return loading;
      },
      onChange,
      onDispatch,
      dispatch(action, payload) {
        return dispatch(action, payload);
      },
      select: storeHook ? select : noop,
      actions: addActions,
      transaction: createTransaction,
      snapshot: createSnapshot,
    }
  );

  (Array.isArray(plugins) ? plugins : [plugins]).forEach((plugin) => {
    Object.assign(initialState, plugin(store));
  });

  initState(initialState, false);
  onChangeListener && onChange(...[].concat(onChangeListener));
  onDispatchListener && onDispatch(...[].concat(onDispatchListener));

  if (init) {
    loadPromise = new Promise((resolve) => {
      let stateInitialized = false;
      const initTask = dispatch(
        init,
        // passing state initializer to init action
        () => (state) => {
          if (stateInitialized) {
            throw new Error("State is already initialized");
          }
          stateInitialized = true;
          initState(
            {
              //...currentState,
              ...initialState,
              ...state,
            },
            true
          );
        }
      );
      initTask.onDone(() => {
        loading = false;
        resolve();
      });
    });
  } else {
    loading = false;
    notifyChange({ init: true });
  }

  if (process.env.NODE_ENV !== "production") {
    if (options.name) {
      require("./DEV").registerStore(options.name, store);
    }
  }

  return store;
}
