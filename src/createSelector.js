export default function createSelector(selectors, combiner) {
  let lastMappedArgs;
  let lastInputArgs;
  let lastResult;
  const wrapper = (...inputArgs) => {
    if (!wrapper.__ignoreInputArgsChecking) {
      if (
        lastInputArgs &&
        lastInputArgs.length === inputArgs.length &&
        lastInputArgs.every((value, index) => value === inputArgs[index])
      ) {
        return lastResult;
      }
    }
    lastInputArgs = inputArgs;
    const currentArgs = selectors
      .map((selector) => selector(...inputArgs))
      .concat(inputArgs.slice(1));
    if (
      !lastMappedArgs ||
      lastMappedArgs.some((arg, index) => arg !== currentArgs[index])
    ) {
      lastMappedArgs = currentArgs;
      lastResult = combiner(...currentArgs);
    }
    return lastResult;
  };
  return wrapper;
}
