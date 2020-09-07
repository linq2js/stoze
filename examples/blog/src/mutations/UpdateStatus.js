import stoze from "stoze";
export default {
  statuses(value, { name, promise }) {
    return {
      ...value,
      [name]: stoze.asyncQueue(promise)
    };
  }
};
