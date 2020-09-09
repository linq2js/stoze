import createEmitter from "./createEmitter";

const allStores = {};
const emitter = createEmitter();

export function registerStore(name, store) {
  if (allStores[name] && allStores[name] !== store) {
    emitter.emit("storeUpdate", { name, next: store, prev: allStores[name] });
  }
  allStores[name] = store;
}

export function onStoreUpdate(name, handler) {
  const names = Array.isArray(name) ? name : [name];
  emitter.on("storeUpdate", (args) => {
    if (!names.includes(args.name)) {
      return;
    }
    handler(args);
  });
}
