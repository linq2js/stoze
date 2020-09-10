import isEqual from "./isEqual";

const defaultSelectId = (item) => item.id;
const defaultOptions = {};
const defaultInitial = [];
const emptyIds = [];
const emptyEntities = {};

export default function createEntities(
  initial = defaultInitial,
  options = defaultOptions
) {
  const { selectId = defaultSelectId, equal = isEqual } = options;
  return createEntitiesWrapper(emptyIds, emptyEntities, {
    ...options,
    selectId,
    equal,
  }).update(initial);
}

function createEntitiesWrapper(ids, entities, options) {
  const { slice = {} } = options;
  let sliceCache = new WeakMap();
  const slicers = Object.entries(slice).map((x) => x[1]);
  let value;

  if (options.__sliceCache) {
    slicers.forEach((slicer) => {
      const value = options.__sliceCache.get(slicer);
      if (!value) return;
      sliceCache.set(slicer, value);
    });
  }

  function create(newIds, newEntities) {
    return createEntitiesWrapper(newIds || ids, newEntities || entities, {
      ...options,
      __sliceCache: sliceCache,
    });
  }

  return {
    ids,
    entities,
    get() {
      if (!value) {
        value = ids.map((id) => entities[id]);
      }
      return value;
    },
    update(inputEntity, merge) {
      const inputEntities = Array.isArray(inputEntity)
        ? inputEntity
        : [inputEntity];
      if (!inputEntities.length) return this;

      let newIds;
      let newEntities;

      const affectedSlicers = [];
      let currentSlicers = slicers.slice();

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
        if (merge) {
          entity = { ...current, ...entity };
        }
        const isNew = !current;
        const equal = merge ? isEqual(entity, current) : current === entity;
        if (!equal) {
          if (isNew) {
            // if new one to be added, all slicers are affected
          } else {
            // find out affected slicers
            const unaffectedSlicers = [];
            while (currentSlicers.length) {
              const slicer = currentSlicers.shift();
              if (!options.equal(slicer(current), slicer(entity))) {
                affectedSlicers.push(slicer);
              } else {
                unaffectedSlicers.push(slicer);
              }
            }
            currentSlicers = unaffectedSlicers;
          }
          if (!newEntities) newEntities = { ...entities };
          newEntities[id] = entity;
        }
        if (isNew) {
          if (slice) {
            // clear all cache
            sliceCache = new WeakMap();
          }
          if (!newIds) newIds = ids.slice();
          newIds.push(id);
        } else {
          // clear affected slicer cache
          affectedSlicers.forEach((slicer) =>
            sliceCache.set(slicer, undefined)
          );
        }
      });
      // nothing to change
      if (!newIds && !newEntities) return this;

      return create(newIds, newEntities);
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
      return newIds ? create(newIds, newEntities) : this;
    },
    slice(name) {
      if (!slice || !(name in slice)) {
        throw new Error("No slice named " + name);
      }
      const slicer = slice[name];
      let value = sliceCache.get(slicer);
      if (!value) {
        value = this.get().map(slicer);
        sliceCache.set(slicer, value);
      }
      return value;
    },
    clear() {
      return create(emptyIds, emptyEntities);
    },
  };
}
