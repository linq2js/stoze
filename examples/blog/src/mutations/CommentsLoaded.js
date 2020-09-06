import stoze from "stoze";

export default {
  postData(value, { postId, data }) {
    const comments = stoze.state([]);
    comments.update(data);

    return {
      ...value,
      [postId]: {
        ...value[postId],
        comments
      }
    };
  }
};
