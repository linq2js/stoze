import * as dev from "./DEV";
import injectExtensions from "./injectExtensions";
import storeHook from "./useStore";
import createStore from "./createStore";

export const DEV = dev;

export default injectExtensions(function stoze(state, options) {
  return createStore(state, {
    ...options,
    storeHook,
  });
});
