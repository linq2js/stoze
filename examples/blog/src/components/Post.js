import React, { Suspense, memo } from "react";
import CommentList from "./CommentList";
import store from "store";

export default memo(function Post({ id }) {
  const { title } = store.select((state) => state.postData[id]);
  return (
    <div>
      <div className="post-title">
        [{id}] {title}
      </div>
      <Suspense fallback="Loading comments...">
        <CommentList postId={id} />
      </Suspense>
    </div>
  );
});
