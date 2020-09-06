import watch from "./watch";

export default function createEffectContext(
  currentTask,
  { state, lastTask, onDispatch, dispatch }
) {
  const { cancelled, subTask } = currentTask;

  return {
    ...currentTask,
    state,
    last() {
      return lastTask;
    },
    repeat: createRepeatMethod(subTask, cancelled, dispatch),
    delay: createDelayMethod(subTask, dispatch),
    latest: createLatestMethod(lastTask),
    dispatch: createDispatchMethod(dispatch, cancelled),
    when: createWhenMethod(subTask, onDispatch),
    on: createOnMethod(subTask, onDispatch, dispatch),
    race: createAsyncMethod(true, subTask, dispatch),
    all: createAsyncMethod(false, subTask, dispatch),
    pipe: createPipeMethod(subTask, cancelled, dispatch),
  };
}

function createPipeMethod(taskFactory, parentCancelled, dispatch) {
  return function (fnList, payload, doneCallback) {
    fnList = fnList.slice(0);
    return taskFactory((callback, { onDone, onDispose, cancelled }) => {
      doneCallback && onDone(doneCallback);

      function next(payload) {
        if (parentCancelled() || cancelled()) return;
        const fn = fnList.shift();
        if (!fn) {
          callback(payload);
        } else {
          try {
            onDispose(
              watch(dispatch(fn, payload), (result, error) =>
                error ? callback(undefined, error) : next(result)
              )
            );
          } catch (e) {
            callback(undefined, e);
          }
        }
      }

      next(payload);
    });
  };
}

function createDelayMethod(taskFactory, dispatch) {
  return function (ms, actionOrValue, payload) {
    const hasAction = arguments.length > 1;
    return taskFactory((callback) => {
      setTimeout(() => {
        if (hasAction) {
          if (
            typeof actionOrValue === "function" ||
            typeof actionOrValue === "object"
          ) {
            watch(dispatch(actionOrValue, payload), callback);
          } else {
            callback(actionOrValue);
          }
        } else {
          callback();
        }
      }, ms);
    });
  };
}

function createLatestMethod(lastTask) {
  return function () {
    lastTask && lastTask.cancel();
  };
}

function createRepeatMethod(taskFactory, parentCancelled, dispatch) {
  return function (fn, condition, payload) {
    return taskFactory((callback, { onDispose, cancelled }) => {
      function next(payload) {
        if (
          parentCancelled() ||
          cancelled() ||
          (condition && !condition(payload))
        )
          return;
        try {
          onDispose(
            watch(dispatch(fn, payload), (result, error) =>
              error ? callback(undefined, error) : next(result)
            )
          );
        } catch (e) {
          callback(undefined, e);
        }
      }
      next(payload);
    });
  };
}

function createDispatchMethod(dispatch, cancelled) {
  return function (action, payload) {
    return dispatch(action, payload, { cancelled });
  };
}

function createWhenMethod(taskFactory, onDispatch) {
  return function (targetAction) {
    const targetActions = Array.isArray(targetAction)
      ? targetAction
      : [targetAction];
    return taskFactory((taskCallback, { onDispose }) => {
      const unsubscribe = onDispatch((args) => {
        if (!targetActions.includes(args.action)) return;
        taskCallback(args);
      });
      onDispose(unsubscribe);
    });
  };
}

function createOnMethod(taskFactory, onDispatch, dispatch) {
  return function (targetAction, dispatchAction, payload) {
    const hasPayload = arguments.length > 2;
    const targetActions = Array.isArray(targetAction)
      ? targetAction
      : [targetAction];
    return taskFactory((taskCallback, { onDispose }) => {
      const unsubscribe = onDispatch((args) => {
        if (!targetActions.includes(args.action)) return;
        dispatch(dispatchAction, hasPayload ? payload : args);
      });
      onDispose(unsubscribe);
    });
  };
}

function createAsyncMethod(race, taskFactory, dispatch) {
  return function (tasks, action, payload) {
    const hasPayload = arguments.length > 2;
    return taskFactory((taskCallback, { onDispose }) => {
      const entries = Object.entries(tasks);
      const maxDone = race ? 1 : entries.length;
      const results = Array.isArray(tasks) ? [] : {};
      const cancels = [];
      const disposes = [];
      let doneCount = 0;

      function handleSuccess(key, result) {
        results[key] = result;
        doneCount++;
        if (doneCount === maxDone) {
          try {
            taskCallback(results);
            action && dispatch(action, hasPayload ? payload : results);
          } finally {
            if (race) {
              // cancel all
              cancels.forEach((x) => x());
            } else {
              // dispose all
              disposes.forEach((x) => x());
            }
          }
        }
      }

      function handleError(key, error) {
        taskCallback(undefined, error);
      }

      entries.forEach(([key, target]) => {
        if (typeof target === "function") {
          target = target();
        }
        const unwatch = watch(target, (result, error) =>
          error ? handleError(key, error) : handleSuccess(key, result)
        );

        if (unwatch) {
          target.dispose && disposes.push(target.dispose);
          target.cancel && cancels.push(target.cancel);
          onDispose(unwatch);
        } else {
          // skip invalid target
        }
      });
    });
  };
}
