import React, { useEffect } from "react";
import WorkSpace from "../WorkSpace";
import CanvasItem from "../CanvasItem";
import { ToolbarType } from "../../utils/enum";
const CellWorkSpace = (props) => {
  const {children, nodeId, nodeType, cellKey, rowCount, colCount } = props;
  const id = `cell_workspace_${nodeId}_${cellKey}`;
  const getCellPosition = () => {
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const key = `${r},${c}`;
        if (!children[key]) {
          children[key] = [];
        }
      }
    }
    return children;
  };
  const _children = getCellPosition();
  const cellChildren = _children[cellKey] || [];
  return (
      <WorkSpace
        id={id}
        nodeId={id}
        nodeType={nodeType}
        data={{ isWorkSpace: true, street: cellChildren }}
      >
        {cellChildren.length > 0 ? (
          cellChildren.map((item, index) => {
            const { nodeId, Content, nodeType, isDefault, disabled } = item;
            return (
              <CanvasItem
                nodeId={nodeId}
                key={nodeId}
                index={index}
                disabled={disabled}
                data={{
                  index,
                  nodeId,
                  street: cellChildren,
                  nodeType,
                  isDefault,
                }}
                style={{
                  border: "1px solid",
                  borderTopColor: "#aaa",
                  borderBottomColor: "#aaa",
                  borderLeftColor: " #aaa",
                  borderRightColor: "#aaa",
                  borderRadius: 2,
                  display:
                    nodeType === ToolbarType.Input ? "inline-block" : "block",
                }}
              >
                  <Content
                    nodeId={nodeId}
                    nodeType={nodeType}
                    children={item.children}
                  />
              </CanvasItem>
            );
          })
        ) : (
          <div
            style={{
              minHeight: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            drop here
          </div>
        )}
      </WorkSpace>
  );
};

export default CellWorkSpace;
