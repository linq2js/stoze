import createLoadable from "./createLoadable";
import createState from "./createState";
import isPromiseLike from "./isPromiseLike";

const undefinedLoadable = createLoadable("hasValue", undefined);

export default function createStateAccessors(defaultState, mutable) {
  const stateObjects = {};
  const rawValueAccessor = {};
  const valueAccessor = {};
  const loadableAccessor = {};

  Object.defineProperty(rawValueAccessor, "$select", {
    value: {},
    enumerable: false,
  });
  Object.defineProperty(valueAccessor, "$select", {
    value: {},
    enumerable: false,
  });
  Object.defineProperty(loadableAccessor, "$select", {
    value: {},
    enumerable: false,
  });

  Object.keys(defaultState).forEach((prop) => {
    const value = defaultState[prop];
    // is selector
    if (typeof value === "function") {
      const selector = value;

      function selectorWrapper() {
        try {
          selector.__ignoreInputArgsChecking = true;
          return selector(...arguments);
        } finally {
          delete selector.__ignoreInputArgsChecking;
        }
      }

      function valueWrapper() {
        return selectorWrapper(valueAccessor, ...arguments);
      }
      function rawValueWrapper() {
        return selectorWrapper(rawValueAccessor, ...arguments);
      }
      let loadable;
      function loadableWrapper() {
        let args;
        try {
          args = {
            value: valueWrapper(...arguments),
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

      rawValueAccessor.$select[prop] = rawValueWrapper;
      valueAccessor.$select[prop] = valueWrapper;
      loadableAccessor.$select[prop] = loadableWrapper;

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
    set(prop, value);
  });

  function unset(prop) {
    stateObjects[prop] = undefined;
  }

  function set(prop, value) {
    const isNew = !(prop in stateObjects);
    stateObjects[prop] = mutable
      ? createState(value, { mutable: true })
      : (stateObjects[prop] || createState(value, { mutable: false })).update(
          value
        );
    // only define new prop if the prop is not exist in stateObjects
    if (isNew) {
      Object.defineProperty(rawValueAccessor, prop, {
        get() {
          return stateObjects[prop] && stateObjects[prop].rawValue;
        },
      });
      Object.defineProperty(valueAccessor, prop, {
        get() {
          return stateObjects[prop] && stateObjects[prop].value;
        },
      });
      Object.defineProperty(loadableAccessor, prop, {
        get() {
          return stateObjects[prop]
            ? stateObjects[prop].loadable
            : undefinedLoadable;
        },
      });
    }
  }

  return {
    stateObjects,
    valueAccessor,
    valueAccessorFn(key, defaultValue) {
      const value = valueAccessor[key];
      return typeof value === "undefined" ? defaultValue : value;
    },
    loadableAccessor,
    loadableAccessorFn(key, defaultValue) {
      const value = loadableAccessor[key];
      if (!value)
        return typeof defaultValue === "undefined"
          ? undefinedLoadable
          : createLoadable("hasValue", defaultValue);
      return value;
    },
    rawValueAccessor,
    rawValueAccessorFn(key, defaultValue) {
      const value = rawValueAccessor[key];
      return typeof value === "undefined" ? defaultValue : value;
    },
    set,
    unset,
  };
}
