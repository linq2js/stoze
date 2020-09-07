import React, { useState } from "react";
import Search from "../effects/Search";
import store from "../store";

export default function SearchBox() {
  const [filterText, setFilterText] = useState("");

  function handleChange(e) {
    setFilterText(e.target.value);
    store.dispatch(Search, e.target.value);
  }

  return (
    <input
      type="text"
      value={filterText}
      onChange={handleChange}
      placeholder="Enter post id (#number) or free text"
      style={{ width: 400 }}
    />
  );
}
