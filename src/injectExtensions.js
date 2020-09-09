import createSelector from "./createSelector";
import createEntities from "./createEntities";

export default function injectExtensions(target) {
  Object.assign(target, {
    selector: createSelector,
    entities: createEntities,
  });

  return target;
}
