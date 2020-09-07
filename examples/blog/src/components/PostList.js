import React, { useEffect, memo } from "react";
import LoadPosts from "../effects/LoadPosts";
import JumpToPage from "../mutations/JumpToPage";
import store from "../store";
import Post from "./Post";

export default memo(function PostList() {
  const { postIds, pagination, filter, totalPosts } = store.select((state) => {
    return {
      postIds: state.postIds,
      pagination: state.pagination,
      filter: state.filter,
      totalPosts: state.totalPosts
    };
  });

  // create page indexes
  const pages = new Array(Math.ceil(totalPosts / pagination.size))
    .fill(0)
    .map((value, index) => index);

  function jumpToPage(page) {
    store.dispatch(JumpToPage, page);
  }

  function isCurrent(page) {
    return pagination.index === page;
  }

  // fetch posts whenever pagination changed
  useEffect(() => {
    store.dispatch(LoadPosts);
  }, [pagination, filter]);

  if (!postIds.length) return <div>No post</div>;

  return (
    <>
      <div>
        {postIds.map((id) => (
          <Post key={id} id={id} />
        ))}
      </div>
      <div className="pagination">
        {pages.map((page) => (
          <button
            key={page}
            disabled={isCurrent(page)}
            onClick={() => jumpToPage(page)}
          >
            {page + 1}
          </button>
        ))}
      </div>
    </>
  );
});
