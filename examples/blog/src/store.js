import stoze from "stoze";
import selectCommentAddingStatus from "./selectors/selectCommentAddingStatus";

export default stoze({
  pagination: { index: 0, size: 5 },
  totalPosts: 0,
  postIds: [],
  postData: {},
  filter: undefined,
  statuses: {},
  // selectors
  commentAddingStatus: selectCommentAddingStatus
});
