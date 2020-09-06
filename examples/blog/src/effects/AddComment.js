import { comments } from "../services/api";
import CommentAdded from "../mutations/CommentAdded";

export default async function AddComment(
  { body, postId },
  { dispatch, cancellable }
) {
  const newComment = await cancellable(
    comments.update(new Date().getTime(), {
      body,
      postId
    })
  );

  return dispatch(CommentAdded, newComment);
}
