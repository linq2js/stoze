export default {
  pagination(value, size) {
    return {
      ...value,
      // jump to first page
      index: 0,
      size
    };
  }
};
