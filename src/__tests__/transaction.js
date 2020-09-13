import stoze from "../index";

const delay = (ms, value) =>
  new Promise((resolve) => setTimeout(resolve, ms, value));

test("basic transaction", () => {
  const store = stoze({ count: 0 });
  const trans = store.transaction();
  store.dispatch({ count: 2 });
  expect(store.state.count).toBe(2);
  store.dispatch({ count: 3 });
  expect(store.state.count).toBe(3);
  trans.rollback();
  expect(store.state.count).toBe(0);
});

test("nested transaction: rollback child -> rollback parent", () => {
  const store = stoze({ count: 0 });
  const t1 = store.transaction();
  store.dispatch({ count: 2 });
  const t2 = store.transaction();
  store.dispatch({ count: 3 });
  t2.rollback();
  expect(store.state.count).toBe(2);
  t1.rollback();
  expect(store.state.count).toBe(0);
});

test("nested transaction: rollback parent -> rollback child", () => {
  const store = stoze({ count: 0 });
  const t1 = store.transaction();
  store.dispatch({ count: 2 });
  const t2 = store.transaction();
  store.dispatch({ count: 3 });
  t1.rollback();
  expect(store.state.count).toBe(0);
  t2.rollback();
  expect(store.state.count).toBe(0);
});

test("async", async () => {
  const store = stoze({ count: 0 });
  const update = { count: (_, payload) => payload };
  const t1 = store.transaction();
  store.dispatch(update, delay(10, 1));
  store.dispatch(update, delay(10, 2));
  t1.rollback();
  await delay(15);
  expect(store.state.count).toBe(0);
});
