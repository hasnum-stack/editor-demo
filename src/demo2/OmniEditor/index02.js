import React from "react";
import defaultCreateMap from "./createDefaults";
import DynamicLayout from "./components/DynamicLayout";
import Tool from "./components/Toolbar/Tool";
import { ToolbarType, GlobalType } from "./utils/enum";
const OmniEditor2 = () => {
  return (
    <DynamicLayout createMap={defaultCreateMap}>
      <div
        style={{
          border: "1px solid #ccc",
          padding: 8,
        }}
      >
        <Tool
          id={ToolbarType.Input}
          data={{
            id: ToolbarType.Input,
            globalType: GlobalType.Tool,
            createType: ToolbarType.Input,
          }}
        >
          <div>input</div>
        </Tool>
        <Tool
          id={ToolbarType.Grid}
          data={{
            id: ToolbarType.Grid,
            globalType: GlobalType.Tool,
            createType: ToolbarType.Grid,
          }}
        >
          <div>container</div>
        </Tool>

        <Tool
          id={ToolbarType.Table}
          data={{
            id: ToolbarType.Table,
            globalType: GlobalType.Tool,
            createType: ToolbarType.Table,
          }}
        >
          <div>table</div>
        </Tool>
      </div>
    </DynamicLayout>
  );
};

export default OmniEditor2;
