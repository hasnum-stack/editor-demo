import React, { useState } from "react";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import WorkSpace from "../WorkSpace";
import CanvasItem from "../CanvasItem";
import { useEditorStore } from "../../store";
import { GlobalType } from "../../utils/enum";
import styles from "./index.module.less";
import DRAG_SVG from "../../images/drag.svg";
const isExist = (arr, nodeId) => {
  const index = arr.findIndex((item) => item.nodeId === nodeId);
  return index >= 0;
};

const moveBefore = (arr, moveBox, dstItem) => {
  if (!arr) return;
  let srcIdx = moveBox.index;
  let dstIdx = dstItem.index;

  if (srcIdx === undefined || srcIdx === null) {
    srcIdx = dstIdx?.length > 0 ? dstIdx - 1 : 0;
    arr.splice(srcIdx, 0, moveBox);
    return;
  }
  if (srcIdx === dstIdx || srcIdx === dstIdx - 1) return arr;
  const flag = isExist(arr, moveBox.nodeId);
  const [item] = flag ? arr.splice(srcIdx, 1) : []; // 移除要移动的项
  const insertIdx = srcIdx < dstIdx ? dstIdx - 1 : dstIdx;
  arr.splice(insertIdx, 0, item); // 插入到目标索引前
  return;
};

const moveDiffStreetBefore = (moveBox, dstItem) => {
  // 移除moveBox从原street中
  const srcStreet = moveBox.street;
  const srcIdx = moveBox.index;
  const flag = isExist(srcStreet, moveBox.nodeId);
  const [item] = flag ? srcStreet.splice(srcIdx, 1) : []; // 移除要移动的项
  // 插入到目标street中
  const dstStreet = dstItem.street;
  const dstIdx = dstItem.index;
  const insertIdx = dstIdx > 0 ? dstIdx - 1 : 0;
  dstStreet.splice(insertIdx, 0, item);
  return;
};

const moveDiffStreetAfter = (moveBox, dstItem) => {
  // 移除moveBox从原street中
  const srcStreet = moveBox.street;
  const srcIdx = moveBox.index;
  const flag = isExist(srcStreet, moveBox.nodeId);
  const [item] = flag ? srcStreet.splice(srcIdx, 1) : []; // 移除要移动的项
  // 插入到目标street中
  const dstStreet = dstItem.street;
  dstStreet.splice(dstItem.index + 1, 0, item);
  return;
};
const moveAfter = (arr, moveBox, dstItem) => {
  if (!arr) return;
  let srcIdx = moveBox.index;
  let dstIdx = dstItem.index;
  if (srcIdx === undefined || srcIdx === null) {
    srcIdx = dstIdx + 1;
    arr.splice(srcIdx, 0, moveBox);
    return;
  }
  if (srcIdx === dstIdx || srcIdx === dstIdx + 1) return arr;
  const flag = isExist(arr, moveBox.nodeId);
  const [item] = flag ? arr.splice(srcIdx, 1) : []; // 移除要移动的项
  const insertIdx = srcIdx < dstIdx ? dstIdx : dstIdx + 1;
  arr.splice(insertIdx, 0, item);
  return;
};

const getNodeData = (node) => {
  return node?.data?.current || {};
};
const getDroppableContainerData = (node) => {
  return node?.data?.droppableContainer?.data || {};
};

function DynamicLayout({ children, createMap = {} }) {
  const storeSetHint = useEditorStore((state) => state.setHint);
  const storeSetOverId = useEditorStore((state) => state.setOverId);
  const list = useEditorStore((state) => state.list);
  const setList = useEditorStore((state) => state.setList);
  return (
    <DndContext
      onDragEnd={handleDragEndWithClosestCenter}
      onDragMove={handleDragMove}
      collisionDetection={(...rest) => {
        // console.log(rest, "resttt");
        const [{ collisionRect, droppableRects }] = rest;
        // console.log(collisionRect, "collisionRect");
        //算出
        const overList = closestCenter(...rest);
        // 找到数组中value最小的元素
        const winner = overList.reduce((min, current) =>
          current.value < min.value ? current : min
        );
        // console.log(winner, "--winner");
        const overRect = droppableRects.get(winner.id);
        if (!overRect) return winner;

        // 3. 计算拖拽物中心点（相对于视口）
        const centerX = collisionRect.left;
        const centerY = collisionRect.top;

        // 4. 分别计算到四条边的“距离”
        const distTop = Math.abs(centerY - overRect.top);
        const distBottom = Math.abs(centerY - overRect.bottom);
        const distLeft = Math.abs(centerX - overRect.left);
        const distRight = Math.abs(centerX - overRect.right);

        // 5. 找出最小值以及对应边
        const minDist = Math.min(distTop, distBottom, distLeft, distRight);
        let nearestEdge;
        if (minDist === distTop) nearestEdge = "top";
        else if (minDist === distBottom) nearestEdge = "bottom";
        else if (minDist === distLeft) nearestEdge = "left";
        else /* distRight */ nearestEdge = "right";

        winner.nearestEdge = nearestEdge;
        return overList;
      }}
    >
      <div className={styles.dynamicLayoutWrapper}>
        <div className={styles.tools}>{children}</div>
           <WorkSpace
            id={GlobalType.Workspace}
            globalType={GlobalType.Workspace}
            data={{
              isWorkSpace: true,
              street: list,
            }}
          >
            {list.map((item, index) => {
              const { nodeId, Content, nodeType, children } = item;
              // const hint = "top";
              // insertHint?.targetId === id ? insertHint?.position : null;

              return (
                <CanvasItem
                  nodeId={nodeId}
                  key={nodeId}
                  data={{
                    index,
                    nodeId,
                    street: list,
                    nodeType,
                    globalType: GlobalType.Node,
                  }}
                  style={{
                    marginBottom: 12,
                  }}
                >
                  <Content
                    nodeId={nodeId}
                    nodeType={nodeType}
                    children={children}
                  />
                </CanvasItem>
              );
            })}
          </WorkSpace>
        <DragOverlay dropAnimation={null}>
          <div className={styles.dragImg}>
            <img src={DRAG_SVG} />
          </div>
        </DragOverlay>
      </div>
    </DndContext>
  );
  function handleDragMove(event) {
    const { collisions = [] } = event;
    const winner = collisions.find((item) => item.nearestEdge);
    const { nearestEdge, id } = winner || {};
    // use prop callbacks if provided, otherwise fall back to store
    if (typeof propSetHint === "function") propSetHint(nearestEdge);
    else storeSetHint(nearestEdge);
    if (typeof propSetOverId === "function") propSetOverId(id);
    else storeSetOverId(id);
  }
  function findOverIsActiveChild(overId, street) {
    if (overId === undefined || overId === null) return false;
    return (
      Array.isArray(street) &&
      street.some(
        (item) =>
          Array.isArray(item.children) &&
          item.children.some((child) => child.nodeId === overId)
      )
    );
  }
  function handleDragEndWithClosestCenter(event) {
    console.log(event);
    const { over, active, collisions } = event;
    const {
      globalType,
      createType,
      nodeId: activeNodeId,
      street = [],
    } = getNodeData(active);
    if (!over) return;
    const victor = collisions.find((c) => c.nearestEdge);
    console.log(victor, "victorvictorvictor");
    const {
      current: { nodeId: victorNodeId, street: victorStreet },
      current,
    } = getDroppableContainerData(victor) || {};
    const nearestEdge = victor.nearestEdge;
    console.log(victorNodeId, "victorNodeId");
    console.log(activeNodeId, "activeNodeIdactiveNodeIdactiveNodeId");
    // 自己不能放到自己的children内部
    const isActiveChild = findOverIsActiveChild(victor.id, street);
    if (isActiveChild) {
      return;
    }
    if (victorNodeId && victorNodeId === activeNodeId) {
      //不可以自己去自己内部
      return;
    }
    let moveBox = active.data.current;
    console.log(globalType, "globalTypeglobalType");
    console.log(active, "activeactive");
    if (globalType === GlobalType.Tool) {
      // use merged create map; allow consumers to override creation logic
      const factory =
        createMap[createType] || (propCreateMap && propCreateMap[createType]);
      moveBox = typeof factory === "function" ? factory(street || []) : moveBox;
    }
    const insertBefore = nearestEdge === "left" || nearestEdge === "top";
    if (insertBefore) {
      if (
        moveBox.street &&
        current.street &&
        moveBox.street !== current.street
      ) {
        moveDiffStreetBefore(moveBox, current);
      } else {
        moveBefore(victorStreet, moveBox, current);
      }
    } else {
      if (
        moveBox.street &&
        current.street &&
        moveBox.street !== current.street
      ) {
        moveDiffStreetAfter(moveBox, current);
      } else {
        moveAfter(victorStreet, moveBox, current);
      }
    }
    console.log(moveBox, "moveBoxmoveBox");
    setList([...list]);
  }
}

export default DynamicLayout;
