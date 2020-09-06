import stoze from "stoze";

export default {
  postData(value, { postId, updateJob }) {
    const commentAdding = stoze.state(false);
    commentAdding.update(updateJob);
    return {
      ...value,
      [postId]: {
        ...value[postId],
        // just clear comment list and reload
        commentAdding
      }
    };
  }
};
