import is from "./is";
import isPromiseLike from "./isPromiseLike";

export default function watch(target, callback) {
  let active = true;
  if (is(target).task) {
    const removeSuccessListener = target.onSuccess((result) =>
      callback(result)
    );
    const removeErrorListener = target.onError((error) =>
      callback(undefined, error)
    );
    return () => {
      if (!active) return;
      active = false;
      removeSuccessListener();
      removeErrorListener();
    };
  } else if (isPromiseLike(target)) {
    target.then(
      (result) => {
        if (!active) return;
        callback(result);
      },
      (error) => {
        if (!active) return;
        callback(undefined, error);
      }
    );
    return () => {
      active = false;
    };
  }

  return false;
}
