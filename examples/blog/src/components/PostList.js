import React, { useEffect } from "react";
import LoadPosts from "../effects/LoadPosts";
import JumpToPage from "../mutations/JumpToPage";
import store from "../store";
import Post from "./Post";

export default function PostList() {
  const { posts, pagination, filter } = store.select((state) => {
    return {
      posts: state.posts,
      pagination: state.pagination,
      filter: state.filter,
    };
  });
  // create page indexes
  const pages = new Array(Math.ceil(pagination.total / pagination.size))
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
  }, [pagination.index, filter]);

  if (!posts.length) return <div>No post</div>;

  return (
    <>
      <div>
        {posts.map((post) => (
          <Post key={post.id} {...post} />
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
}
