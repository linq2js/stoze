export default {
  pagination(value, page) {
    return { ...value, index: page };
  },
};
