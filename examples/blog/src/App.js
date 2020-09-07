import React, { Suspense } from "react";
import "./styles.css";
import PostList from "./components/PostList";
import Toolbar from "./components/Toolbar";

export default function App() {
  return (
    <div className="App">
      <h1>Blog App </h1>
      <Toolbar />

      <Suspense fallback={<div>Loading posts...</div>}>
        <PostList />
      </Suspense>
    </div>
  );
}
