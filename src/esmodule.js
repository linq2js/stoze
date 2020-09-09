import * as dev from "./DEV";
import stoze from "./createStore";
import injectExtensions from "./injectExtensions";

export const DEV = dev;

export default injectExtensions(stoze);
