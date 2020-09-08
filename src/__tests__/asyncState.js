import stoze from "../index";

const delay = (ms, value) =>
  new Promise((resolve) => setTimeout(resolve, ms, value));

test("simple async state", async () => {
  const store = stoze({ $async: { count: 1 } });
  // access async state from outside store
  expect(store.state.$async("count")).toBe(1);
  expect(store.loadable.$async("count").state).toBe("hasValue");
  // update async state using async state map
  store.dispatch({ $async: { count: delay(10, 2) } });
  expect(store.state.$async("count")).toBe(1);
  expect(store.loadable.$async("count").state).toBe("loading");
  await delay(15);
  expect(store.state.$async("count")).toBe(2);
  // update async state using async reducer
  store.dispatch(
    {
      $async(loadable, payload, state) {
        expect(loadable("count").state).toBe("hasValue");
        return { count: delay(10, payload) };
      },
    },
    3
  );
  expect(store.loadable.$async("count").state).toBe("loading");
  await delay(15);
  expect(store.state.$async("count")).toBe(3);
  // try get undefined async states
  expect(store.loadable.$async("count2", 100).value).toBe(100);
  expect(store.state.$async("count2", 100)).toBe(100);
});
