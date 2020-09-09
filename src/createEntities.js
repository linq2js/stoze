const defaultSelectId = (item) => item.id;
const defaultOptions = {};
const defaultInitial = [];
const emptyIds = [];
const emptyEntities = {};

export default function createEntities(
  initial = defaultInitial,
  options = defaultOptions
) {
  const { selectId = defaultSelectId } = options;
  return createEntitiesWrapper(initial, emptyIds, emptyEntities, {
    selectId,
  }).reset();
}

function createEntitiesWrapper(initial, ids, entities, options, defaultValue) {
  let value = defaultValue;
  return {
    ids,
    entities,
    get() {
      if (!value) {
        value = ids.map((id) => entities[id]);
      }
      return value;
    },
    add(inputEntity) {
      const inputEntities = Array.isArray(inputEntity)
        ? inputEntity
        : [inputEntity];
      if (!inputEntities.length) return this;

      let newIds;
      let newEntities;

      inputEntities.forEach((entity) => {
        if (typeof entity !== "object") {
          throw new Error(
            "Entity must be object type but got " + typeof entity
          );
        }

        const id = options.selectId(entity);
        if (typeof id !== "number" && typeof id !== "string") {
          throw new Error(
            "Entity id must be string or number but got " + typeof id
          );
        }
        const current = (newEntities || entities)[id];
        const isNew = !current;
        if (current !== entity) {
          if (!newEntities) newEntities = { ...entities };
          newEntities[id] = entity;
        }
        if (isNew) {
          if (!newIds) newIds = ids.slice();
          newIds.push(id);
        }
      });

      return createEntitiesWrapper(
        initial,
        newIds || ids,
        newEntities || entities,
        options
      );
    },
    remove(inputId) {
      const filter = Array.isArray(inputId)
        ? (x) => inputId.includes(x)
        : (x) => x === inputId;
      let newIds;
      let newEntities;
      ids.forEach((id) => {
        if (!filter(id)) {
          if (!newIds) {
            newIds = [];
            newEntities = {};
          }
          newIds.push(id);
          newEntities[id] = entities[id];
        }
      });
      return newIds
        ? createEntitiesWrapper(initial, newIds, newEntities, options)
        : this;
    },
    reset() {
      const temp = createEntitiesWrapper(
        initial,
        emptyIds,
        emptyEntities,
        options
      ).add(initial);
      return createEntitiesWrapper(
        initial,
        temp.ids,
        temp.entities,
        options,
        initial
      );
    },
    clear() {
      return createEntitiesWrapper(initial, emptyIds, emptyEntities, options);
    },
  };
}
