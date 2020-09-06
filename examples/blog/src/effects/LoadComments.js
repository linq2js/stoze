import CommentsLoaded from "../mutations/CommentsLoaded";
import { comments } from "../services/api";

export default function LoadComments(postId, { dispatch }) {
  const data = comments
    .getMany({ filter: { postId } })
    .then((result) => result.items);

  return dispatch(CommentsLoaded, {
    postId,
    data,
  });
}
