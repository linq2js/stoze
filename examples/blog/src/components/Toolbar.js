import React from "react";
import SearchBox from "./SearchBox";
import PageSize from "./PageSize";

export default function Toolbar() {
  return (
    <div>
      <SearchBox /> <PageSize />
      <p></p>
    </div>
  );
}
