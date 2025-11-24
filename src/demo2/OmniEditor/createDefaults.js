import React from "react";
import { nanoid } from "nanoid";
import { Input } from "antd";
import WorkSpace from "./components/WorkSpace";
import LayoutGrid from "./components/LayoutGrid";
import LayoutTable from "./components/LayoutTable";
import { GlobalType, ToolbarType } from "./utils/enum";

function Input2() {
  return <Input placeholder="输入框" />;
}

export const createInputItem = (list = []) => {
  const length = list.length || 0;
  const id = `node_${nanoid(4)}_${length}`;
  return {
    nodeId: id,
    nodeType: ToolbarType.Input,
    Content: Input2,
  };
};

export const createWorkspaceItem = () => {
  return {
    nodeId: `workSpace_node_${nanoid(4)}`,
    nodeType: GlobalType.Workspace,
    Content: WorkSpace,
    isWorkSpace: true,
    children: [],
  };
};

export const createGridItem = (list = []) => {
  const length = list.length || 0;
  const id = `node_${nanoid(4)}_${length}`;
  return {
    nodeId: id,
    nodeType: ToolbarType.Grid,
    Content: LayoutGrid,
    children: [createWorkspaceItem(), createWorkspaceItem(), createWorkspaceItem()],
  };
};

export const createTableItem = (list = []) => {
  const length = list.length || 0;
  const id = `node_${nanoid(4)}_${length}`;
  return {
    nodeId: id,
    nodeType: ToolbarType.Table,
    Content: LayoutTable,
    children: {},
  };
};

export const defaultCreateMap = {
  [ToolbarType.Input]: createInputItem,
  [ToolbarType.Grid]: createGridItem,
  [ToolbarType.Table]: createTableItem,
};

export default defaultCreateMap;
