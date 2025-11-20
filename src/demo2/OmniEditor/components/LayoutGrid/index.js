import React, { use, useState } from "react";
import { Row, Col, Button } from "antd";
import CanvasItem from "../CanvasItem";
import { ToolbarType } from "../../utils/enum";
import { nanoid } from "nanoid";

const Default = () => {
  return <div>Drop Here</div>;
};
export const getDefaultItem = () => {
  return {
    nodeId: `default_node_${nanoid(4)}`,
    nodeType: ToolbarType.Default,
    Content: Default,
    isDefault: true,
    disabled: true,
  };
};
const LayoutGrid = ({
  children: colChildren,
  onAddColumn = () => {},
  onDeleteColumn = () => {},
}) => {
  return (
    <Row>
      {colChildren.map((col) => {
        console.log(col);
        const { children, Content, nodeId, nodeType } = col;
        console.log("===children====",children);
        
        const _children =
          children.length > 0 ? children : children.concat([getDefaultItem()]);
          console.log("==_children=======",_children);
          
        return (
          <Col style={{ border: "1px dashed red", padding: 6 }} span={6}>
            <Content
              nodeId={nodeId}
              nodeType={nodeType}
              data={{ isMainSpace: true, sheet: children }}
            >
              {_children.map((item, index) => {
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
                      street: children,
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
                        nodeType === ToolbarType.Input
                          ? "inline-block"
                          : "block",
                      height: 100,
                    }}
                  >
                    <div style={{ height: 100 }}>
                      <Content nodeId={nodeId} nodeType={nodeType} />
                    </div>
                  </CanvasItem>
                );
              })}
            </Content>
            <Button
              onClick={() => {
                onDeleteColumn && onDeleteColumn(nodeId, colChildren);
              }}
            >
              delWorkspace
            </Button>
          </Col>
        );
      })}
      <Button
        onClick={() => {
          onAddColumn(colChildren);
        }}
      >
        add
      </Button>
    </Row>
  );
};

export default LayoutGrid;
