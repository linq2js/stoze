import React, { useEffect, useRef, memo } from "react";
import LoadComments from "../effects/LoadComments";
import AddComment from "../effects/AddComment";
import store from "../store";

export default memo(function CommentList({ postId }) {
  const comments = store.select((state) => {
    const post = state.postData[postId];
    return post.comments && post.comments.value;
  });
  const commentNotInitialized = !comments;

  useEffect(() => {
    store.dispatch(LoadComments, postId);
  }, [postId, commentNotInitialized]);

  if (!comments) return null;

  if (!comments.length) return <div>No comment</div>;

  return (
    <>
      <ul className="post-comments">
        {comments.map((comment) => (
          <li key={comment.id}>{comment.body}</li>
        ))}
      </ul>
      <CommentForm postId={postId} />
      <p></p>
    </>
  );
});
function CommentForm({ postId }) {
  const inputRef = useRef();
  function handleSubmit(e) {
    e.preventDefault();
    store.dispatch(AddComment, { postId, body: inputRef.current.value });
    inputRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        ref={inputRef}
        placeholder="Leave some comment here and press enter"
        style={{ width: 300 }}
      />
    </form>
  );
}
