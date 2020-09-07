import { comments } from "../services/api";
import CommentAdded from "../mutations/CommentAdded";
import UpdateStatus from "../mutations/UpdateStatus";
import selectCommentAddingStatusKey from "../selectors/selectCommentAddingStatusKey";

export default async function AddComment(
  { body, postId },
  { dispatch, cancellable }
) {
  const addCommentPromise = cancellable(
    comments.update(new Date().getTime(), {
      body,
      postId
    })
  );

  dispatch(UpdateStatus, {
    name: selectCommentAddingStatusKey(postId),
    promise: addCommentPromise
  });

  const newComment = await addCommentPromise;

  return dispatch(CommentAdded, newComment);
}
