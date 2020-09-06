import stoze from "stoze";
import selectPosts from "./selectors/selectPosts";

export default stoze({
  pagination: { index: 0, size: 5, total: 0 },
  postIds: [],
  postData: {},
  filter: undefined,
  // selectors
  posts: selectPosts
});
