import selectCommentAddingStatusKey from "./selectCommentAddingStatusKey";

export default function selectCommentAddingStatus(state, postId) {
  const status = state.statuses[selectCommentAddingStatusKey(postId)];
  return status && status.completed;
}
