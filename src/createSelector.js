export default function createSelector(selectors, combiner) {
  let lastArgs;
  let lastResult;
  return (...inputArgs) => {
    const currentArgs = selectors
      .map((selector) => selector(...inputArgs))
      .concat(inputArgs.slice(1));
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
