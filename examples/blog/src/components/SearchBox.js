import React, { useState } from "react";
import UpdateFilter from "../mutations/UpdateFilter";
import store from "../store";

export default function SearchBox() {
  const [filterText, setFilterText] = useState("");

  function handleChange(e) {
    setFilterText(e.target.value);
    store.dispatch(UpdateFilter, e.target.value);
  }

  return (
    <div>
      <input
        type="text"
        value={filterText}
        onChange={handleChange}
        placeholder="Enter post id (#number) or free text"
        style={{ width: 400 }}
      />
      <p/>
    </div>
  );
}
