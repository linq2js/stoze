import React, { Suspense } from "react";
import "./styles.css";
import PostList from "./components/PostList";
import SearchBox from "./components/SearchBox";

export default function App() {
  return (
    <div className="App">
      <h1>Blogs</h1>
      <SearchBox />
      <Suspense fallback="Loading posts...">
        <PostList />
      </Suspense>
    </div>
  );
}
