import React, { useState } from "react";
import "./Container.css";
import TopContainer from "./TopContainer";
import MainContainer from "./MainContainer";

function Container({ user }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="container">
      <TopContainer user={user} onSearch={setSearchQuery} />
      <MainContainer user={user} searchQuery={searchQuery} />
    </div>
  );
}

export default Container;