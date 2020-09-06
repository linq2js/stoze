import React, { Suspense, memo } from "react";
import CommentList from "./CommentList";

export default memo(function Post({ id, title }) {
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
