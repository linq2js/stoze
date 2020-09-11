import { unset } from "./types";

export default function (targetProp, sourceProps) {
  if (!Array.isArray(sourceProps)) {
    sourceProps = [sourceProps];
  }

  const go = {};
  const back = {};
  const forward = {};
  let goPayload = unset;

  sourceProps.forEach((prop) => {
    function goReducer(_, payload, state) {
      const data = state[targetProp];
      let index = data.index + payload;
      if (index < -1) {
        index = data.length ? 0 : -1;
      } else if (index > data.length - 1) {
        index = data.length - 1;
      }
      return index === -1 ? undefined : data.entries[index][prop];
    }

    go[prop] = goReducer;
    back[prop] = (value, payload, state) => goReducer(value, -1, state);
    forward[prop] = (value, payload, state) => goReducer(value, 1, state);
  });

  function goEffect(number, { dispatch }) {
    try {
      goPayload = number;
      dispatch(go, number);
    } finally {
      goPayload = unset;
    }
  }

  return Object.assign(
    function (store) {
      let data = createHistoryData([], -1);

      store.onChange(
        (state) => {
          const result = {};
          sourceProps.forEach((prop) => {
            result[prop] = state[prop];
          });
          return result;
        },
        ({ value }) => {
          if (goPayload !== unset) {
            const index = normalizeIndex(data.index + goPayload, data.length);
            data = createHistoryData(data.entries, index);
          } else {
            data = createHistoryData(
              data.entries.slice(0, data.index + 1).concat(value),
              data.index + 1
            );
          }
        }
      );

      return {
        [targetProp]() {
          return data;
        },
      };
    },
    {
      go: goEffect,
      back(payload, context) {
        return goEffect(-1, context);
      },
      forward(payload, context) {
        return goEffect(1, context);
      },
    }
  );
}

function createHistoryData(entries, index) {
  let prevEntries;
  let nextEntries;
  return {
    index,
    length: entries.length,
    get current() {
      return entries[index];
    },
    get prev() {
      return entries[index - 1];
    },
    get next() {
      return entries[index + 1];
    },
    get prevEntries() {
      if (!prevEntries) {
        prevEntries = entries.length ? entries.slice(0, index) : [];
      }
      return prevEntries;
    },
    get nextEntries() {
      if (!nextEntries) {
        nextEntries = entries.length ? entries.slice(index + 1) : [];
      }
      return nextEntries;
    },
    entries,
  };
}

function normalizeIndex(index, length) {
  if (index < -1) {
    return length ? 0 : -1;
  } else if (index > length - 1) {
    return length - 1;
  }
  return index;
}
