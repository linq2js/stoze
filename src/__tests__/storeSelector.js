import createSelector from "../createSelector";
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

test("should not call selectors if input args not changed", () => {
  const selector1 = jest.fn();
  selector1.mockReturnValue(1);
  const selector2 = jest.fn();
  selector2.mockReturnValue(2);
  const selector3 = (value1, value2) => value1 + value2;
  const selector4 = createSelector([selector1, selector2], selector3);

  selector4(1);
  selector4(1);
  selector4(1);

  expect(selector4(1)).toBe(3);
  expect(selector1).toBeCalledTimes(1);
  expect(selector2).toBeCalledTimes(1);

  expect(selector4(2)).toBe(3);
  expect(selector1).toBeCalledTimes(2);
  expect(selector2).toBeCalledTimes(2);
});

test("should skip inputArgs checking for store selector", () => {
  const selector1 = jest.fn();
  selector1.mockReturnValue(1);
  const selector2 = jest.fn();
  selector2.mockReturnValue(2);
  const selector3 = (value1, value2) => value1 + value2;
  const selector4 = createSelector([selector1, selector2], selector3);
  const store = stoze({ value: selector4 });
  expect(store.state.value).toBe(3);
  expect(store.state.value).toBe(3);
  expect(selector1).toBeCalledTimes(2);
  expect(selector2).toBeCalledTimes(2);
});
