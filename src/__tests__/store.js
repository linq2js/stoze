import stoze from "../index";

const delay = (ms, value) =>
  new Promise((resolve) => setTimeout(resolve, ms, value));

test("should not allow copy selector collection", () => {
  const store = stoze({ select() {} });
  const copy = { ...store.state };
  expect(copy.$).toBeUndefined();
  expect(store.state.$select).not.toBeUndefined();
});

test("task.result()", () => {
  const store = stoze();
  const task = store.dispatch(() => 1);
  expect(task.result()).toBe(1);
});

test("on(action, callbackAction)", () => {
  const callback = jest.fn();
  const ClickSaga = (payload, { on }) => {
    return on(Click, callback);
  };
  const Click = {};
  const store = stoze();
  store.dispatch(ClickSaga);
  store.dispatch(Click);
  store.dispatch(Click);
  store.dispatch(Click);
  expect(callback).toBeCalledTimes(3);
});

test("on(action, callbackAction, payload)", () => {
  const callback = jest.fn();
  const ClickSaga = (payload, { on }) => {
    return on(Click, callback, 1);
  };
  const Click = {};
  const store = stoze();
  store.dispatch(ClickSaga);
  store.dispatch(Click);
  store.dispatch(Click);
  store.dispatch(Click);
  expect(callback.mock.calls).toEqual([
    [1, expect.anything()],
    [1, expect.anything()],
    [1, expect.anything()],
  ]);
});

test("dispatch single mutation", () => {
  const Increase = {
    count: (value) => value + 1,
  };
  const store = stoze({ count: 0 });

  expect(store.state.count).toBe(0);
  store.dispatch(Increase);
  expect(store.state.count).toBe(1);
});

test("dispatch multiple mutations", () => {
  const Increase = {
    count1: (value) => value + 1,
    count2: (value) => value + 1,
  };
  const store = stoze({ count1: 1, count2: 2 });

  expect(store.state.count1).toBe(1);
  expect(store.state.count2).toBe(2);
  store.dispatch(Increase);
  expect(store.state.count1).toBe(2);
  expect(store.state.count2).toBe(3);
});

test("optimize change notification", () => {
  const callback = jest.fn();
  const Increase = {
    count1: (value) => value + 1,
    count2: (value) => value + 1,
  };
  const store = stoze({ count1: 1, count2: 2 });
  store.onChange(callback);
  store.dispatch(Increase);
  expect(callback).toBeCalledTimes(1);
});

test("verify state existing", () => {
  const store = stoze({ count1: 1, count2: 2 });
  expect(() => store.dispatch({ count3: () => {} })).toThrowError();
});

test("latest effect", async () => {
  const Increase = { count: (value) => value + 1 };
  const IncreaseAsync = async (payload, { latest, dispatch, delay }) => {
    latest();
    await delay(10);
    dispatch(Increase);
  };
  const store = stoze({ count: 0 });
  store.dispatch(IncreaseAsync);
  store.dispatch(IncreaseAsync);
  store.dispatch(IncreaseAsync);
  store.dispatch(IncreaseAsync);
  await delay(15);
  expect(store.state.count).toBe(1);
});

test("handle future dispatching", async () => {
  const callback = jest.fn();
  const Login = {};
  const LoginSaga = (payload, { on }) => {
    return on(Login, ({ payload }) => {
      callback(payload);
    });
  };
  const store = stoze({});

  store.dispatch(LoginSaga);

  expect(callback).toBeCalledTimes(0);
  store.dispatch(Login);
  store.dispatch(Login);
  store.dispatch(Login);
  expect(callback).toBeCalledTimes(3);
});

test("race", async () => {
  const cancelCallback = jest.fn();
  const UpdateSearchResults = {
    results: (value, payload) => payload,
  };
  const Cancel = () => {};
  const SearchApi = async (term) => {
    await delay(10);
    return [term];
  };
  const Search = async (term, { race, when, dispatch }) => {
    const { cancel } = await race({
      cancel: when(Cancel),
      update: dispatch(UpdateSearchResults, SearchApi(term)),
    });
    cancel && cancelCallback();
  };
  const store = stoze({ results: [] });

  // first try, search effect should be successfully
  store.dispatch(Search, 1);
  expect(store.loadable.results.state).toBe("loading");
  await delay(15);
  expect(store.loadable.results.state).toBe("hasValue");
  expect(store.state.results).toEqual([1]);

  // second try, we cancel search effect before it done
  store.dispatch(Search, 2);
  store.dispatch(Cancel);
  await delay(15);
  expect(store.loadable.results.state).toBe("hasValue");
  expect(store.state.results).toEqual([1]);

  expect(cancelCallback).toBeCalledTimes(1);
});

test("loadable: loading & hasValue", async () => {
  const store = stoze({
    count: 0,
  });

  store.dispatch({ count: (value, payload) => payload }, delay(10, 100));
  expect(store.loadable.count.state).toBe("loading");
  await delay(15);
  expect(store.loadable.count.state).toBe("hasValue");
  expect(store.state.count).toBe(100);
});

test("loadable: hasError", async () => {
  const store = stoze({
    count: 0,
  });
  const rejected = Promise.reject("invalid");
  store.dispatch({ count: (value, payload) => payload }, rejected);
  expect(store.loadable.count.state).toBe("loading");
  await delay(15);
  expect(store.loadable.count.state).toBe("hasError");
  expect(store.loadable.count.error).toBe("invalid");
  expect(store.state.count).toBe(0);
});

test("mutation: perform multiple mutations on one state", async () => {
  const store = stoze({
    count1: 1,
    count2: 2,
    count3: 3,
  });

  const reducer = (value, payload) => payload;

  // mutate count1 and count2 in 10ms
  store.dispatch(
    {
      count1: reducer,
      count2: reducer,
    },
    delay(10, 100)
  );

  // mutate count2 and count3 in 15ms
  store.dispatch(
    {
      count2: reducer,
      count3: reducer,
    },
    delay(15, 200)
  );

  await delay(20);
  expect(store.state.count1).toEqual(100);
  // even second mutation takes much time than first mutation
  // but count2 will be changed only by second mutation lock
  // first mutation is skipped
  expect(store.state.count2).toEqual(200);
  expect(store.state.count3).toEqual(200);
});

test("pipe", () => {
  const callback = jest.fn();
  const Up = {};
  const Down = {};
  const CheatCodeWatch = (payload, { pipe, when }) => {
    return pipe([() => when(Up), () => when(Down), callback]);
  };
  const CheatCodeSaga = (payload, { repeat }) => {
    return repeat(CheatCodeWatch);
  };
  const store = stoze();

  store.dispatch(CheatCodeSaga);
  store.dispatch(Up);
  store.dispatch(Down);
  expect(callback).toBeCalledTimes(1);
});

test("pipe([promiseFactory, callback])", async () => {
  const callback = jest.fn();
  const Effect = (payload, { pipe, when }) => {
    return pipe([() => delay(10), callback]);
  };
  const store = stoze();

  store.dispatch(Effect);
  expect(callback).toBeCalledTimes(0);
  await delay(20);
  expect(callback).toBeCalledTimes(1);

  const t = store.dispatch(Effect);
  t.cancel();
  await delay(5);
  expect(callback).toBeCalledTimes(1);
});

test("init state lazily", async () => {
  const store = stoze(
    {
      count: 0,
    },
    {
      async init(setState) {
        await delay(10);
        setState({ count: 1 });
      },
    }
  );

  expect(store.state.count).toBe(0);
  expect(store.loading).toBeTruthy();
  expect(() => store.select()).toThrowError(Promise);
  await delay(15);
  expect(store.state.count).toBe(1);
  expect(store.loading).toBeFalsy();
});
