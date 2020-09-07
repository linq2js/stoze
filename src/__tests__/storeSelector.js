import stoze from "../index";

test("call selector outside store", () => {
  const store = stoze({
    data(state, value = 1) {
      return value;
    },
  });

  expect(store.state.data).toBe(1);
  expect(store.state.$.data()).toBe(1);
  expect(store.state.$.data(2)).toBe(2);
});
