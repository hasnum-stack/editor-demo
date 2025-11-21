import React from "react";
// import Editor from "./editor/Editor";
// import Basic from "./components/Basic";
import OmniEditor from "./demo2/OmniEditor";
import Spreadsheet from "./components/Spreadsheet";
export default function App() {
  return (
    <div className="app">
      <OmniEditor />
      <Spreadsheet />
      {/* <h2>Form Editor Demo (minimal)</h2> */}
      {/* <Editor /> */}
      {/*<Basic />*/}
    </div>
  );
}
