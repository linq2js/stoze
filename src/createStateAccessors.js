import createArrayKeyedMap from "./createArrayKeyedMap";
import createLoadable from "./createLoadable";
import createState from "./createState";
import isPromiseLike from "./isPromiseLike";

const undefinedLoadable = createLoadable("hasValue", undefined);
let propId = 1;

export default function createStateAccessors(state, mutable) {
  const stateObjects = {};
  const rawValueAccessor = {};
  const valueAccessor = {};
  const loadableAccessor = {};
  const propNames = createArrayKeyedMap();

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

  // convert array of key/value pairs to value map
  if (Array.isArray(state)) {
    const temp = {};
    state.forEach(({ key, value }) => {
      temp[getPropName(key)] = value;
    });
    state = temp;
  }

  Object.keys(state).forEach((prop) => {
    const value = state[prop];
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

  function getPropName(prop) {
    if (Array.isArray(prop)) {
      if (prop.length === 1 && typeof prop[0] !== "object") return prop[0];
      return propNames.getOrAdd(prop, () => {
        return "#prop_" + propId++;
      });
    }
    return prop;
  }

  function removePropName(prop) {
    if (Array.isArray(prop)) {
      propNames.delete(prop);
    }
  }

  function unset(prop) {
    stateObjects[getPropName(prop)] = undefined;
    removePropName(prop);
  }

  function set(prop, value) {
    prop = getPropName(prop);
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
      const value = valueAccessor[getPropName(key)];
      return typeof value === "undefined" ? defaultValue : value;
    },
    loadableAccessor,
    loadableAccessorFn(key, defaultValue) {
      const value = loadableAccessor[getPropName(key)];
      if (!value)
        return typeof defaultValue === "undefined"
          ? undefinedLoadable
          : createLoadable("hasValue", defaultValue);
      return value;
    },
    rawValueAccessor,
    rawValueAccessorFn(key, defaultValue) {
      const value = rawValueAccessor[getPropName(key)];
      return typeof value === "undefined" ? defaultValue : value;
    },
    set,
    unset,
    clone() {
      const newState = {};
      Object.entries(state).forEach(([prop, value]) => {
        if (typeof value === "function") {
          newState[prop] = value;
        } else {
          newState[prop] = rawValueAccessor[prop];
        }
      });
      return createStateAccessors(newState, mutable);
    },
  };
}
