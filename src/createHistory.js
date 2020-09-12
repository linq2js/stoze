const defaultHistoryData = createHistoryData([], 0);

export default function (dataProp, entryProps, options = {}) {
  const { ignoreInitialState } = options;
  const historyMutationState = dataProp + ".action";
  if (!Array.isArray(entryProps)) {
    entryProps = [entryProps];
  }

  const historyMutation = {
    $name: "history_mutation",
    [historyMutationState](_, payload) {
      return payload;
    },
  };

  entryProps.forEach((prop) => {
    historyMutation[prop] = function (value, payload, state) {
      if (payload.type === "go") {
        const data = select(state);
        return data.entries[payload.index][prop];
      }
      return value;
    };
  });

  function goEffect(number, { dispatch, state }) {
    const data = select(state);
    const index = normalizeIndex(data.index + number, data.length);
    dispatch(historyMutation, { type: "go", index });
  }

  function select(state) {
    return state[dataProp];
  }

  return Object.assign(
    // store setup
    function (store) {
      let data;
      let lastMutation;

      store.onChange(
        (state) => {
          const result = {};
          entryProps.forEach((prop) => {
            result[prop] = state[prop];
          });

          if (!data) {
            data = createHistoryData([result], 0);
          }

          return {
            ...result,
            [historyMutationState]: state[historyMutationState],
          };
        },
        ({ value: { [historyMutationState]: mutation, ...value }, init }) => {
          if (init && ignoreInitialState) return;
          if (init) {
            data = createHistoryData([value], 0);
            return;
          }

          if (mutation && mutation !== lastMutation) {
            lastMutation = mutation;
            const { type, index } = mutation;
            if (type === "go") {
              data = createHistoryData(data.entries, index);
            } else if (type === "clear") {
              data = data.length
                ? createHistoryData([data.current], 0)
                : createHistoryData([], -1);
            }
          } else {
            data = createHistoryData(
              data.entries.slice(0, data.index + 1).concat(value),
              data.index + 1
            );
          }
        }
      );

      return {
        [dataProp]() {
          return data || defaultHistoryData;
        },
        [historyMutationState]: undefined,
      };
    },
    {
      select,
      go: goEffect,
      back(payload, context) {
        return goEffect(-1, context);
      },
      forward(payload, context) {
        return goEffect(1, context);
      },
      clear(payload, { dispatch }) {
        return dispatch(historyMutation, { type: "clear" });
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
