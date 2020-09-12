import stoze from "../index";

const historyPlugin = stoze.history("history", ["value1", "value2"]);
let store;

beforeEach(() => {
  store = stoze(
    {
      history: undefined,
      value1: 1,
      value2: 2,
    },
    {
      plugins: [historyPlugin],
    }
  );
});

test("push new entry", () => {
  expect(store.state.history).toMatchObject({
    index: 0,
    entries: [{ value1: 1, value2: 2 }],
  });

  store.dispatch({
    value1: 2,
  });

  expect(store.state.history).toMatchObject({
    index: 1,
    entries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
    ],
  });

  store.dispatch({
    value1: 3,
    value2: 3,
  });

  expect(store.state.history).toMatchObject({
    index: 2,
    entries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
      { value1: 3, value2: 3 },
    ],
  });

  store.dispatch({
    value1: 3,
    value2: 3,
  });

  // nothing added
  expect(store.state.history).toMatchObject({
    index: 2,
    entries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
      { value1: 3, value2: 3 },
    ],
  });

  store.dispatch({
    value1: 4,
    value2: 4,
  });

  expect(store.state.history).toMatchObject({
    index: 3,
    entries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
      { value1: 3, value2: 3 },
      { value1: 4, value2: 4 },
    ],
  });

  store.dispatch(historyPlugin.back);

  expect(store.state.history).toMatchObject({
    index: 2,
    prevEntries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
    ],
    current: { value1: 3, value2: 3 },
    entries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
      { value1: 3, value2: 3 },
      { value1: 4, value2: 4 },
    ],
    nextEntries: [{ value1: 4, value2: 4 }],
  });

  expect(store.state).toMatchObject({ value1: 3, value2: 3 });

  store.dispatch(historyPlugin.forward);

  expect(store.state.history).toMatchObject({
    index: 3,
    prevEntries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
      { value1: 3, value2: 3 },
    ],
    entries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
      { value1: 3, value2: 3 },
      { value1: 4, value2: 4 },
    ],
    nextEntries: [],
  });

  expect(store.state).toMatchObject({ value1: 4, value2: 4 });

  store.dispatch(historyPlugin.go, 100);

  expect(store.state.history).toMatchObject({
    index: 3,
    entries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
      { value1: 3, value2: 3 },
      { value1: 4, value2: 4 },
    ],
  });

  store.dispatch(historyPlugin.go, -1000);

  expect(store.state.history).toMatchObject({
    index: 0,
    entries: [
      { value1: 1, value2: 2 },
      { value1: 2, value2: 2 },
      { value1: 3, value2: 3 },
      { value1: 4, value2: 4 },
    ],
  });
  store.dispatch({
    value1: 4,
    value2: 4,
  });

  expect(store.state.history).toMatchObject({
    index: 1,
    prevEntries: [{ value1: 1, value2: 2 }],
    entries: [
      { value1: 1, value2: 2 },
      { value1: 4, value2: 4 },
    ],
    nextEntries: [],
  });
});
