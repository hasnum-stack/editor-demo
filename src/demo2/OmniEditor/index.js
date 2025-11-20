import React, { useState } from "react";
import {
  DndContext,
  closestCorners,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import WorkSpace from "./components/WorkSpace";
import Tool from "./components/Toolbar/Tool";
import CanvasItem from "./components/CanvasItem";
import { useEditorStore } from "./store";
import { nanoid } from "nanoid";
import { Row, Col, Input } from "antd";
import { GlobalType, ToolbarType } from "./utils/enum";

// const moveBefore = (arr, srcIdx, dstIdx) => {
//   if (srcIdx === dstIdx || srcIdx === dstIdx - 1) return arr;
//
//   const newArr = [...arr]; // ✅ 展开复制，保持不可变
//   const [item] = newArr.splice(srcIdx, 1); // 移除要移动的项
//
//   const insertIdx = srcIdx < dstIdx ? dstIdx - 1 : dstIdx;
//   newArr.splice(insertIdx, 0, item); // 插入到目标索引前
//
//   return newArr;
// };

const isExist = (arr, nodeId) => {
  const index = arr.findIndex((item) => item.nodeId === nodeId);
  return index >= 0;
};

const moveBefore = (arr, moveBox, dstItem) => {
  if (!arr) return;
  let srcIdx = moveBox.index;
  let dstIdx = dstItem.index;
  if (srcIdx === undefined || srcIdx === null) {
    srcIdx = dstIdx - 1;
    arr.splice(srcIdx, 0, moveBox);
    return;
  }
  if (srcIdx === dstIdx || srcIdx === dstIdx - 1) return arr;
  const flag = isExist(arr, moveBox.nodeId);
  const [item] = flag ? arr.splice(srcIdx, 1) : []; // 移除要移动的项
  const insertIdx = srcIdx < dstIdx ? dstIdx - 1 : dstIdx;
  arr.splice(insertIdx, 0, item); // 插入到目标索引前
  return ;
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
// Move element at srcIdx to be placed after dstIdx (in-place).
// No-op when src is the same as dst or already immediately after dst.
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
  return ;
};

const createBefore = (list, targetIndex) => {
  const item = createInputItem(list);
  const newList = [...list];
  newList.splice(targetIndex, 0, item);
  return newList;
};

const getNodeData = (node) => {
  return node?.data?.current || {};
};
const getDroppableContainerData = (node) => {
  return node?.data?.droppableContainer?.data || {};
};

const Content = {
  [ToolbarType.Input]: Input,
  [ToolbarType.Grid]: Grid,
};

function Grid({ children = [] }) {
  return (
    <>
      <Row>
        {children.map((item, index) => {
          
          const { nodeId, Content, nodeType } = item;
          console.log(nodeType, "typetypetype");
          // const hint = "top";
          // insertHint?.targetId === id ? insertHint?.position : null;
          return (
            <Col>
              <CanvasItem
                nodeId={nodeId}
                key={nodeId}
                index={index}
                data={{
                  index,
                  nodeId,
                  street: children,
                  nodeType,
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
                  height: 100,
                }}
              >
                <div style={{ height: 100 }}>
                  <Content nodeId={nodeId} nodeType={nodeType} />
                </div>
              </CanvasItem>
            </Col>
          );
        })}
      </Row>
    </>
  );
}
function Input2() {
  return <Input placeholder="输入框" />;
}

const createInputItem = (list) => {
  const length = list.length;
  const id = `node_${nanoid(4)}_${length}`;
  return { 
    nodeId: id,
    nodeType: ToolbarType.Input,
    Content: Input2,
  };
};

const createGridItem = (list) => {
  const length = list.length;
  const id = `node_${nanoid(4)}_${length}`;
  return {
    nodeId: id,
    nodeType: ToolbarType.Grid,
    Content: Grid,
  };
};

const create = {
  [ToolbarType.Input]: createInputItem,
  [ToolbarType.Grid]: createGridItem,
};
const createItemPushLast = (list) => {
  const item = createInputItem(list);
  return [...list, item];
};
// 🧩 自定义碰撞检测：支持 top/bottom/left/right/inside
export const customCollisionDetection = (...rest) => {
  // console.log(rest, "restrestrestrestrest");
  // const [{ collisionRect, droppableContainers }] = rest;
  // console.log(collisionRect, "123123");
  // console.log(droppableContainers, "droppableContainersdroppableContainers");
  // console.log(rest, "restrest");
  return;

  const collisions = [];

  for (const droppable of droppableContainers) {
    const rect = droppable.rect.current?.rect;
    if (!rect) continue;
    const { top, bottom, left, right, height, width } = rect;

    const {
      top: dragTop,
      bottom: dragBottom,
      left: dragLeft,
      right: dragRight,
    } = collisionRect;

    const threshold = 0.2;
    const topZone = top + height * threshold;
    const bottomZone = bottom - height * threshold;
    const leftZone = left + width * threshold;
    const rightZone = right - width * threshold;

    // ✅ 优先匹配边缘
    if (dragBottom <= topZone && dragBottom >= top) {
      collisions.push({ id: droppable.id, data: { type: "top", rect } });
      continue;
    }
    if (dragTop >= bottomZone && dragTop <= bottom) {
      collisions.push({ id: droppable.id, data: { type: "bottom", rect } });
      continue;
    }
    if (dragRight <= leftZone && dragRight >= left) {
      collisions.push({ id: droppable.id, data: { type: "left", rect } });
      continue;
    }
    if (dragLeft >= rightZone && dragLeft <= right) {
      collisions.push({ id: droppable.id, data: { type: "right", rect } });
      continue;
    }

    // ✅ 最后才检测 inside，并缩小判断范围
    const innerTop = top + height * threshold;
    const innerBottom = bottom - height * threshold;
    const innerLeft = left + width * threshold;
    const innerRight = right - width * threshold;

    const isInside =
      dragLeft >= innerLeft &&
      dragRight <= innerRight &&
      dragTop >= innerTop &&
      dragBottom <= innerBottom;

    if (isInside) {
      collisions.push({ id: droppable.id, data: { type: "inside", rect } });
    }
  }

  return collisions.sort((a, b) => a.data.rect.top - b.data.rect.top);
};

  
function OmniEditor() {
  const [list, setList] = useState([
    {
      nodeId: "canvas_item_1",
      nodeType: ToolbarType.Grid,
      Content: Grid,
      children: [
        {
          nodeId: "canvas_item_1_1",
          nodeType: ToolbarType.Input,
          Content: Input2,
        },
        {
          nodeId: "canvas_item_1_2",
          nodeType: ToolbarType.Input,
          Content: Input2,
        },
        {
          nodeId: "canvas_item_1_3",
          nodeType: ToolbarType.Input,
          Content: Input2,
        },
      ],
    },
  ]);
  const setHint = useEditorStore((state) => state.setHint);
  const hint = useEditorStore((state) => state.hint);
  const setOverId = useEditorStore((state) => state.setOverId);
  const overEnd = useEditorStore((state) => state.overEnd);
  console.log("======list====", list);
  
  return (
    <DndContext
      // onDragEnd={handleDragEnd}
      // onDragEnd={handleDragEndWithClosestCorners}
      onDragEnd={handleDragEndWithClosestCenter}
      // onDragOver={handleDragOver}
      onDragMove={handleDragMove}
      // collisionDetection={closestCorners}
      // collisionDetection={customCollisionDetection}
      // collisionDetection={closestCenter}
      collisionDetection={(...rest) => {
        // console.log(rest, "resttt");
        const [{ collisionRect, droppableRects }] = rest;
        // console.log(collisionRect, "collisionRect");
        //算出
        const overList = closestCenter(...rest);
        // 找到数组中value最小的元素
        const winner = overList.reduce((min, current) =>
          current.value < min.value ? current : min,
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
      <div>
        {/* 工具栏 */}
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
        </div>

        {/* 主容器 */}
        <WorkSpace
          id={GlobalType.Workspace}
          globalType={GlobalType.Workspace}
          data={{
            isMainSpace: true,
            street: list,
          }}
        >
          <div
            style={{
              border: "2px solid #333",
              padding: 12,
              width: "100%",
              minHeight: 600,
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
                    border: "1px solid",
                    borderTopColor: "#aaa",
                    borderBottomColor: "#aaa",
                    borderLeftColor: " #aaa",
                    borderRightColor: "#aaa",
                    borderRadius: 2,
                    display: nodeType === ToolbarType.Input ? "inline-block" : "block",
                  }}
                >
                  <Content nodeId={nodeId} nodeType={nodeType}>
                    {children}
                  </Content>
                </CanvasItem>
              );
            })}
          </div>
        </WorkSpace>
      </div>

      <DragOverlay dropAnimation={null}>
        <button style={{ marginBottom: 16 }}>123123</button>
      </DragOverlay>
    </DndContext>
  );

  // ================================
  // 💥 拖拽结束时更新列表顺序
  // ================================
  // function handleDragEnd(event) {
  //   console.log(event);
  //   const { over, active, collisions } = event;
  //   if (!over) return;
  //
  //   // 从工具栏拖入
  //   if (active.id === "tool" && over.id === "droppable") {
  //     setList((prev) => {
  //       const length = prev.length;
  //       const id = `canvas_item_${nanoid(4)}_${length}`;
  //       return [
  //         ...prev,
  //         {
  //           id,
  //           content: `${id}`,
  //         },
  //       ];
  //     });
  //     setInsertHint(null);
  //     return;
  //   }
  //   if (active.id.startsWith("canvas_item_")) {
  //     //找到得分最高的碰撞目标
  //     const maxCollision = collisions.reduce(
  //       (max, c) => (c.data.value > max.data.value ? c : max),
  //       collisions[0],
  //     );
  //     console.log(maxCollision, "maxCollisionmaxCollision");
  //
  //     const maxValueId = maxCollision.id;
  //     // 放到maxValueId的前面
  //     if (maxValueId !== "droppable") {
  //       const maxIndex =
  //         maxCollision.data.droppableContainer.data.current.index;
  //       const activeIndex = active.data.current.index;
  //       console.log(maxIndex, "maxIndex");
  //       console.log(activeIndex, "activeIndex");
  //
  //       setList((list) => {
  //         return moveBefore(list, activeIndex, maxIndex);
  //       });
  //       // setList((list) => {
  //       //   console.log(list, "listlistlistlist");
  //       //   const activeIndex = list.findIndex((item) => item.id === active.id);
  //       //   const targetIndex = list.findIndex((item) => item.id === maxValueId);
  //       //   console.log(activeIndex, "activeIndexactiveIndex");
  //       //   const newList = arrayMove(list, activeIndex, targetIndex - 1);
  //       //   return newList;
  //       // });
  //     }
  //     // collisions.find((item) => {
  //     //   const { id, data } = item;
  //     //   const { value } = data;
  //     //
  //     // });
  //     // 移动到最后
  //     // setList((list) => {
  //     //   console.log(list, "listlistlistlist");
  //     //   const activeIndex = list.findIndex((item) => item.id === active.id);
  //     //   console.log(activeIndex, "activeIndexactiveIndex");
  //     //   return arrayMove(list, activeIndex, list.length - 1);
  //     // });
  //     return;
  //   }
  //
  //   // 列表内部重新排序
  //   // const type = over.data.current?.type;
  //   // console.log(type, "type");
  //   // const targetId = over.id;
  //   //
  //   // setList((prev) => {
  //   //   const fromIndex = prev.findIndex((i) => i.id === active.id);
  //   //   const toIndex = prev.findIndex((i) => i.id === targetId);
  //   //   if (fromIndex === -1 || toIndex === -1) return prev;
  //   //
  //   //   const newList = [...prev];
  //   //   const [moved] = newList.splice(fromIndex, 1);
  //   //
  //   //   if (type === "top") newList.splice(toIndex, 0, moved);
  //   //   else if (type === "bottom") newList.splice(toIndex + 1, 0, moved);
  //   //
  //   //   return newList;
  //   // });
  //   //
  //   setInsertHint(null);
  // }

  // ================================
  // 💡 拖拽经过时显示边界提示
  // ================================
  // function handleDragOver(event) {
  //   // console.log(event, "onDragOver");
  //   return;
  //   const { collisions, over } = event;
  //   console.log(collisions);
  //   console.log(over);
  //   if (!over || !collisions?.length) {
  //     setInsertHint(null);
  //     return;
  //   }
  //
  //   const hit = collisions[0];
  //   const type = hit.data?.type; // ✅ 直接从 collisions 获取
  //   // console.log(type, "12321");
  //   setInsertHint({
  //     targetId: over.id,
  //     position: type,
  //   });
  //   return;
  //   // console.log(event, "event");
  //   // const { over } = event;
  //   // if (!over) {
  //   //   setInsertHint(null);
  //   //   return;
  //   // }
  //   //
  //   // const type = over.data.current?.type;
  //   // setInsertHint({
  //   //   targetId: over.id,
  //   //   position: type,
  //   // });
  // }
  function handleDragMove(event) {
    const { collisions = [] } = event;
    const winner = collisions.find((item) => item.nearestEdge);
    const { nearestEdge, id } = winner || {};
    setHint(nearestEdge);
    setOverId(id);
  }
  function handleDragEndWithClosestCorners(event) {
    console.log(event);
    const { over, active } = event;
    if (!over) return;
    // 从工具栏拖入到最后
    if (over.id === "canvas") {
      setList(createItemPushLast);
    }
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
    if (victorNodeId && victorNodeId === activeNodeId) {
      //不可以自己去自己内部
      return;
    }
    let moveBox = active.data.current;
    console.log(globalType, "globalTypeglobalType");
    console.log(active, "activeactive");
    if (globalType === GlobalType.Tool) {
      moveBox = create[createType](street);
    }
    const insertBefore = nearestEdge === "left" || nearestEdge === "top";
    // 如果是碰触到最外层容器，前边的话插入到数组最前边
    if (insertBefore && current.isMainSpace) {
      if (moveBox.index !== undefined && moveBox.index !== null) {
        return;
      }
      victorStreet.splice(0, 0, moveBox);
      setList((list) => {
        return [...list];
      });
      return;
    }
    // 如果是碰触到最外层容器，后边的话插入到数组最后边
    if (!insertBefore && current.isMainSpace) {
      if (moveBox.index !== undefined && moveBox.index !== null) {
        return;
      } else {
        const insertIndex = victorStreet.length > 0 ? victorStreet.length : 0;
        victorStreet.splice(insertIndex, 0, moveBox);
      }
      setList((list) => {
        return [...list];
      });
      return;
    }
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

    setList((list) => {
      return [...list];
    });

    //放进去

    // if (activeType === GlobalType.Tool) {
    //   console.log(over, "overover");
    //   // 从工具栏拖入
    //   const item = collisions.find((c) => c.nearestEdge);
    //   const { id, nearestEdge } = item || {};
    //   if (id === GlobalType.Workspace) {
    //     console.log(active.id, "active.data.current.type");
    //     setList((list) => [...list, create[active.id](list)]);
    //     overEnd();
    //     return;
    //   }
    // }
    // if (collisions) {
    //   const item = collisions.find((c) => c.nearestEdge);
    //   const nearestEdge = item?.nearestEdge;
    //   const itemIndex = item.data.droppableContainer.data.current.index;
    //   const currentList = item.data.droppableContainer.data.current.currentList;
    //   const activeIndex = active.data.current?.index;
    //   if (activeIndex) {
    //     if (nearestEdge === "left" || nearestEdge === "top") {
    //       setList((list) => {
    //         moveBefore(currentList, activeIndex, itemIndex);
    //         return [...list];
    //       });
    //     } else if (nearestEdge === "right" || nearestEdge === "bottom") {
    //       setList((list) => {
    //         moveBefore(currentList, activeIndex, itemIndex + 1);
    //         return [...list];
    //       });
    //     }
    //   } else {
    //     const item = createInputItem(list);
    //     //拖入新的元素
    //     if (nearestEdge === "left" || nearestEdge === "top") {
    //       setList((list) => {
    //         return createBefore(list, itemIndex);
    //       });
    //     } else if (nearestEdge === "right" || nearestEdge === "bottom") {
    //       setList((list) => {
    //         return createBefore(list, itemIndex + 1);
    //       });
    //     }
    //   }
    //   overEnd();
    // }
  }
}

export default OmniEditor;
