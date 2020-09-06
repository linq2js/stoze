import { useRef, useEffect, useState } from "react";
import isEqual from "./isEqual";
import isPromiseLike from "./isPromiseLike";

export default function useStore(
  { onChange, getState, getSelectorArgs },
  selector
) {
  const data = useRef({}).current;
  data.selector = selector;
  data.rerender = useState()[1];

  if (!data.handleChange) {
    data.handleChange = () => {
      if (data.unmount) return;
      data.error = undefined;
      try {
        if (selector) {
          const next = selector(...getSelectorArgs());
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

  useEffect(() => () => void (data.unmount = true), [data]);
  useEffect(() => {
    data.handleChange();
    return onChange(data.handleChange);
  }, [data, onChange]);

  if (data.error) throw data.error;

  data.prev = selector ? selector(...getSelectorArgs()) : getState();
  return data.prev;
}
