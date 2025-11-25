import React, { useState } from "react";
import { Row, Col, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import CanvasItem from "../CanvasItem";
import { createWorkspaceItem } from "../../index";
import { useEditorStore } from "../../store";
import ADD_SVG from "../../images/add.svg";
import styles from './index.module.less'

const LayoutGrid = ({
  children: colChildren,
}) => {
  const [selectedCol, setSelectedCol] = useState({});
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
    <Row className={styles.layoutGridWrapper} gutter={[4, 4]}>
      {colChildren.map((col) => {
        const { children, Content, nodeId, nodeType } = col;
        const selected = selectedCol.nodeId == nodeId;
        return (
          <Col
            key={nodeId}
            span={8}
            className={styles.colWrapper}
            onClick={() => {
              setSelectedCol(col);
            }}
          >
            <Content
              id={nodeId}
              nodeId={nodeId}
              nodeType={nodeType}
              data={{ isWorkSpace: true, street: children }}
              selected={selected}
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
            <DeleteOutlined
              style={selected ? { display: "flex" } : { display: "none" }}
              className={styles.delCol}
              onClick={(e) => {
                onDeleteColumn(nodeId, colChildren);
              }}
            />
          </Col>
        );
      })}
      <div className={styles.rowActionsBtn}>
        <img
          src={ADD_SVG}
          onClick={() => {
            onAddColumn(colChildren);
          }}
        />
      </div>
    </Row>
  );
};

export default LayoutGrid;
