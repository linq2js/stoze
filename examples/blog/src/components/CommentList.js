import React, { Suspense, useRef, memo, useLayoutEffect } from "react";
import LoadComments from "../effects/LoadComments";
import AddComment from "../effects/AddComment";
import store from "../store";

export default memo(function CommentList({ postId }) {
  const comments = store.select((state) => {
    const post = state.postData[postId];
    return post.comments && post.comments.value;
  });

  useLayoutEffect(() => {
    if (!comments) {
      store.dispatch(LoadComments, postId);
    }
  }, [postId, comments]);

  if (!comments) return null;

  if (!comments.length) return <div>No comment</div>;

  return (
    <>
      <h4>Comments:</h4>
      <ul className="post-comments">
        {comments.map((comment) => (
          <li key={comment.id}>{comment.body}</li>
        ))}
      </ul>
      <Suspense fallback="Submitting comment...">
        <CommentForm postId={postId} />
      </Suspense>
      <p></p>
    </>
  );
});
const CommentForm = memo(function ({ postId }) {
  store.select((state) => state.$.commentAddingStatus(postId));
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
});
