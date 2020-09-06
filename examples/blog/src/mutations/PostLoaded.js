export default {
  postIds(value, listPayload) {
    return listPayload.items.map((post) => post.id);
  },
  postData(value, listPayload) {
    return listPayload.items.reduce((obj, post) => {
      obj[post.id] = post;
      return obj;
    }, {});
  },
  pagination(value, listPayload) {
    return { ...value, total: listPayload.total };
  },
};
