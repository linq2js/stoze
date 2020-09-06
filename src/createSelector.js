export default function createSelector(selectors, combiner) {
  let lastArgs;
  let lastResult;
  return function () {
    const currentArgs = selectors.map((selector) => selector(...arguments));
    if (
      !lastArgs ||
      lastArgs.some((arg, index) => arg !== currentArgs[index])
    ) {
      lastArgs = currentArgs;
      lastResult = combiner(...currentArgs);
    }
    return lastResult;
  };
}
