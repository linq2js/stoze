import stoze from "stoze";

export default {
  postData(data, comment) {
    const post = data[comment.postId];
    const comments = post.comments.value.concat([comment]);
    return {
      ...data,
      [comment.postId]: {
        ...post,
        comments: stoze.state(comments)
      }
    };
  }
};
