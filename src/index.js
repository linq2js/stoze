// import createAsyncQueue from "./createAsyncQueue";
import * as dev from "./DEV";
import stoze from "./createStore";
// import createState from "./createState";
import createSelector from "./createSelector";

export const DEV = dev;

Object.assign(stoze, {
  selector: createSelector,
  // state: createState,
  // asyncQueue: createAsyncQueue,
});

export default stoze;
