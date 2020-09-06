import createTask from "./createTask";

export const noop = () => {};
export const unset = {};
export const doneTask = createTask((callback) => callback(undefined));
