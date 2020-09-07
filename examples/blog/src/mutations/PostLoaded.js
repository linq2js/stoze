export default {
  postIds(value, listPayload) {
    return listPayload.items.map((post) => post.id);
  },
  postData(value, listPayload) {
    return listPayload.items.reduce((obj, post) => {
      obj[post.id] = {
        ...obj[post.id],
        ...post
      };
      return obj;
    }, value);
  },
  totalPosts(value, listPayload) {
    return listPayload.total;
  }
};
