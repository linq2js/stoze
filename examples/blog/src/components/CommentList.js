import React, { useEffect } from "react";
import LoadComments from "../effects/LoadComments";
import store from "../store";

export default function CommentList({ postId }) {
  const comments = store.select((state) => {
    return state.postData[postId].comments;
  });

  useEffect(() => {
    if (!comments) {
      store.dispatch(LoadComments, postId);
    }
  }, [postId]);

  if (!comments) return null;

  if (!comments.value.length) return <div>No comment</div>;

  return (
    <ul className="post-comments">
      {comments.value.map((comment) => (
        <li key={comment.id}>{comment.name}</li>
      ))}
    </ul>
  );
}
