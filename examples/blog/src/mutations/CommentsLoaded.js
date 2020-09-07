import stoze from "stoze";

export default {
  postData(value, { postId, data }) {
    return {
      ...value,
      [postId]: {
        ...value[postId],
        comments: stoze.state(data)
      }
    };
  }
};
