import { useRef, useEffect, useState, useLayoutEffect } from "react";
import isEqual from "./isEqual";
import isPromiseLike from "./isPromiseLike";

export default function useStore(
  { onChange, getState, getSelectorArgs },
  store,
  selector
) {
  const data = useRef({}).current;
  data.selector = selector;
  data.rerender = useState(undefined)[1];

  if (!data.handleChange || data.store !== store) {
    data.store = store;
    delete data.error;
    data.handleChange = () => {
      data.error = undefined;
      try {
        if (selector) {
          const next = selector ? selector(...getSelectorArgs()) : getState();
          if (isEqual(next, data.prev)) return;
        }
      } catch (e) {
        if (isPromiseLike(e)) {
          e.finally(data.handleChange);
        }
        data.error = e;
      }
      data.rerender({});
    };
  }

  useLayoutEffect(() => {
    // data.handleChange();
    return onChange(data.handleChange);
  }, [data, onChange]);

  if (data.error) throw data.error;

  data.prev = selector ? selector(...getSelectorArgs()) : getState();
  return data.prev;
}
