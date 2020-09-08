import stoze from "../index";

test("call selector outside store", () => {
  const store = stoze({
    data(state, value = 1) {
      return value;
    },
  });

  expect(store.state.data).toBe(1);
  expect(store.state.$select.data()).toBe(1);
  expect(store.state.$select.data(2)).toBe(2);
});
