import React, { Suspense } from "react";
import CommentList from "./CommentList";

export default function Post({ id, title }) {
  return (
    <div>
      <div className="post-title">
        {title} (id = {id})
      </div>
      <Suspense fallback="Loading comments...">
        <CommentList postId={id} />
      </Suspense>
    </div>
  );
}
