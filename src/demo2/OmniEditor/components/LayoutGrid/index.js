import React from "react";
import { Row, Col, Button } from "antd";
import CanvasItem from "../CanvasItem";
import { ToolbarType } from "../../utils/enum";
import { nanoid } from "nanoid";
import { createWorkspaceItem } from "../../index";
import { useEditorStore } from "../../store";

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
}) => {
  const list = useEditorStore((state) => state.list);
  const setList = useEditorStore((state) => state.setList);
  const onAddColumn = (children) => {
    const newCol = createWorkspaceItem();
    children.splice(children.length, 0, newCol);
    setList([...list]);
  }
  const onDeleteColumn = (colId, children) => {
    const index = children.findIndex((item) => item.nodeId === colId);
    if (index >= 0) {
      children.splice(index, 1);
      setList([...list]);
    }
  };

  return (
    <Row>
      {colChildren.map((col) => {
        const { children, Content, nodeId, nodeType } = col;
        return (
          <Col span={6}>
            <Content
              id={nodeId}
              nodeId={nodeId}
              nodeType={nodeType}
              data={{ isWorkSpace: true, street: children }}
            >
              {children.length > 0 ? (
                children.map((item, index) => {
                  const { nodeId, Content, nodeType, isDefault, disabled } =
                    item;
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
                        height: 200,
                      }}
                    >
                        <Content nodeId={nodeId} nodeType={nodeType} />
                    </CanvasItem>
                  );
                })
              ) : (
                <div
                  style={{
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  drop here
                </div>
              )}
            </Content>
            <Button
              onClick={(e) => {
                onDeleteColumn(nodeId, colChildren);
              }}
            >
              delWorkspace
            </Button>
          </Col>
        );
      })}
      <Button
        onClick={(e) => {
          onAddColumn(colChildren);
        }}
      >
        add
      </Button>
    </Row>
  );
};

export default LayoutGrid;
