import stoze from "./createStore";
import createState from "./createState";
import createSelector from "./createSelector";

Object.assign(stoze, {
  state: createState,
  selector: createSelector,
});

export default stoze;
