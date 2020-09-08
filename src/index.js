// import createAsyncQueue from "./createAsyncQueue";
import stoze from "./createStore";
// import createState from "./createState";
import createSelector from "./createSelector";

Object.assign(stoze, {
  selector: createSelector,
  // state: createState,
  // asyncQueue: createAsyncQueue,
});

export default stoze;
