import React from "react";
import store from "../store";
import UpdatePageSize from "../mutations/UpdatePageSize";
export default function PageSize() {
  const size = store.select((state) => {
    return state.pagination.size;
  });

  function handleChange(e) {
    store.dispatch(UpdatePageSize, e.target.value);
  }

  return (
    <select value={size} onChange={handleChange}>
      <option value={5}>Show 5 posts</option>
      <option value={10}>Show 10 posts</option>
      <option value={20}>Show 20 posts</option>
    </select>
  );
}
