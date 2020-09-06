import stoze from "stoze";

const selectPostIds = (state) => state.postIds;
const selectPostData = (state) => state.postData;
const selectPosts = stoze.selector([selectPostIds, selectPostData], function (
  postIds,
  postData
) {
  return postIds.map((id) => postData[id]);
});

export default stoze({
  pagination: { index: 0, size: 10, total: 0 },
  postIds: [],
  postData: {},
  // selectors
  posts: selectPosts,
  filter: undefined
});
