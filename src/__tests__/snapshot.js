import stoze from "../index";

test("simple snapshot", () => {
  const store = stoze({ count: 0 });
  const s1 = store.snapshot();
  expect(s1.state.count).toBe(0);
  store.dispatch({ count: 2 });
  s1.revert();
  expect(store.state.count).toBe(0);
  store.dispatch({ count: 3 });
  s1.revert();
  expect(store.state.count).toBe(0);

  const s2 = store.snapshot();
  const s3 = store.snapshot();

  // no new snapshot created if nothing changed
  expect(s2).toBe(s3);
  store.dispatch({ count: 0 });
  const s4 = store.snapshot();
  expect(s4).toBe(s2);

  store.dispatch({ count: 4 });
  const s5 = store.snapshot();
  expect(s5).not.toBe(s2);
});
