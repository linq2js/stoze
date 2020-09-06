import stoze from "stoze";
import selectPostIds from "./selectPostIds";
import selectPostData from "./selectPostData";

export default stoze.selector([selectPostIds, selectPostData], function (
  postIds,
  postData
) {
  return postIds.map((id) => postData[id]);
});
