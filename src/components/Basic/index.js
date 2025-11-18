import React, { useState } from "react";
import {
  DndContext,
  closestCorners,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import { Droppable } from "./Droppable";
import { Draggable } from "./Draggable";
import { CanvasItem } from "../../editor/CanvasItem.js";
import { useEditorStore } from "../../store";
import {
  arrayMove,
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { nanoid } from "nanoid";
const moveBefore = (arr, srcIdx, dstIdx) => {
  if (srcIdx === dstIdx || srcIdx === dstIdx - 1) return arr; // 无需移动
  const item = arr[srcIdx];
  return [
    ...arr.slice(0, Math.min(srcIdx, dstIdx)), // 左段
    ...(srcIdx < dstIdx
      ? arr.slice(srcIdx + 1, dstIdx) // 中段（右移场景）
      : []),
    item, // 被移动的元素
    ...(srcIdx < dstIdx
      ? [] // 中段（左移场景）
      : arr.slice(dstIdx, srcIdx)),
    ...arr.slice(Math.max(srcIdx, dstIdx) + (srcIdx < dstIdx ? 0 : 1)), // 右段
  ];
};

const createItemPushLast = (list) => {
  const length = list.length;
  const id = `canvas_item_${nanoid(4)}_${length}`;
  return [
    ...list,
    {
      id,
      content: `${id}`,
    },
  ];
};
// 🧩 自定义碰撞检测：支持 top/bottom/left/right/inside
export const customCollisionDetection = (...rest) => {
  // console.log(rest, "restrestrestrestrest");
  // const [{ collisionRect, droppableContainers }] = rest;
  // console.log(collisionRect, "123123");
  // console.log(droppableContainers, "droppableContainersdroppableContainers");
  console.log(rest, "restrest");
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

function Basic() {
  const [list, setList] = useState([]);
  const [insertHint, setInsertHint] = useState(null);
  const setHint = useEditorStore((state) => state.setHint);
  const hint = useEditorStore((state) => state.hint);
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
        console.log(rest, "resttt");
        const [{ collisionRect, droppableRects }] = rest;
        console.log(collisionRect, "collisionRect");
        //算出
        const overList = closestCenter(...rest);
        // 找到数组中value最小的元素
        const winner = overList.reduce((min, current) =>
          current.value < min.value ? current : min,
        );
        console.log(winner, "--winner");
        const overRect = droppableRects.get(winner.id);
        if (!overRect) return winner;

        // 3. 计算拖拽物中心点（相对于视口）
        const centerX = collisionRect.left + collisionRect.width / 2;
        const centerY = collisionRect.top + collisionRect.height / 2;

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

        // console.log(aa, "aa");
        console.log(nearestEdge, "nearestEdgenearestEdge");
        setHint(nearestEdge);
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
          <Draggable id="tool">
            <div>Drag me</div>
          </Draggable>
        </div>

        {/*<SortableContext items={list}>*/}
        {/*  <ul>*/}
        {/*    {list.map((id, index) => (*/}
        {/*      <SortablePage*/}
        {/*        id={id}*/}
        {/*        index={index + 1}*/}
        {/*        key={id}*/}
        {/*        layout={layout}*/}
        {/*        activeIndex={activeIndex}*/}
        {/*        onRemove={() =>*/}
        {/*          setItems((items) => items.filter((itemId) => itemId !== id))*/}
        {/*        }*/}
        {/*      />*/}
        {/*    ))}*/}
        {/*  </ul>*/}
        {/*</SortableContext>*/}
        {/* 主容器 */}
        <Droppable id="canvas">
          <div
            style={{
              border: "2px solid #333",
              padding: 12,
              width: "100%",
              minHeight: 600,
            }}
          >
            {list.map((item, index) => {
              const { id, content } = item;
              const hint = "top";
              // insertHint?.targetId === id ? insertHint?.position : null;

              return (
                <CanvasItem
                  id={id}
                  key={id}
                  index={index}
                  style={{
                    border: "1px solid",
                    borderColor: " #aaa",
                    borderRadius: 2,
                    background: "#fafafa",
                    display: "inline-block",
                    padding: "20px",
                    // position: "relative",
                  }}
                >
                  {content}
                  {/*<div>*/}
                  {/*  /!* ==== 插入提示线 ==== *!/*/}
                  {/*  {hint === "top" && (*/}
                  {/*    <div*/}
                  {/*      style={{*/}
                  {/*        position: "absolute",*/}
                  {/*        top: 0,*/}
                  {/*        left: 0,*/}
                  {/*        right: 0,*/}
                  {/*        height: 3,*/}
                  {/*        background: "dodgerblue",*/}
                  {/*      }}*/}
                  {/*    />*/}
                  {/*  )}*/}
                  {/*  {hint === "bottom" && (*/}
                  {/*    <div*/}
                  {/*      style={{*/}
                  {/*        position: "absolute",*/}
                  {/*        bottom: 0,*/}
                  {/*        left: 0,*/}
                  {/*        right: 0,*/}
                  {/*        height: 3,*/}
                  {/*        background: "dodgerblue",*/}
                  {/*      }}*/}
                  {/*    />*/}
                  {/*  )}*/}

                  {/*  <div>{content}</div>*/}

                  {/*  {hint === "left" && (*/}
                  {/*    <div*/}
                  {/*      style={{*/}
                  {/*        position: "absolute",*/}
                  {/*        top: 0,*/}
                  {/*        bottom: 0,*/}
                  {/*        left: 0,*/}
                  {/*        width: 3,*/}
                  {/*        background: "dodgerblue",*/}
                  {/*      }}*/}
                  {/*    />*/}
                  {/*  )}*/}
                  {/*  {hint === "right" && (*/}
                  {/*    <div*/}
                  {/*      style={{*/}
                  {/*        position: "absolute",*/}
                  {/*        top: 0,*/}
                  {/*        bottom: 0,*/}
                  {/*        right: 0,*/}
                  {/*        width: 3,*/}
                  {/*        background: "dodgerblue",*/}
                  {/*      }}*/}
                  {/*    />*/}
                  {/*  )}*/}
                  {/*</div>*/}
                </CanvasItem>
                // <Draggable id={id} key={id}>
                //   <Droppable id={id}>

                // </Droppable>
                // </Draggable>
              );
            })}
          </div>
        </Droppable>
      </div>

      <DragOverlay>
        {/*<CustomDragOverlay>*/}
        <button style={{ marginBottom: 16 }}>123123</button>
        {/*</CustomDragOverlay>*/}
      </DragOverlay>
    </DndContext>
  );

  // ================================
  // 💥 拖拽结束时更新列表顺序
  // ================================
  function handleDragEnd(event) {
    console.log(event);
    const { over, active, collisions } = event;
    if (!over) return;

    // 从工具栏拖入
    if (active.id === "tool" && over.id === "droppable") {
      setList((prev) => {
        const length = prev.length;
        const id = `canvas_item_${nanoid(4)}_${length}`;
        return [
          ...prev,
          {
            id,
            content: `${id}`,
          },
        ];
      });
      setInsertHint(null);
      return;
    }
    if (active.id.startsWith("canvas_item_")) {
      //找到得分最高的碰撞目标
      const maxCollision = collisions.reduce(
        (max, c) => (c.data.value > max.data.value ? c : max),
        collisions[0],
      );
      console.log(maxCollision, "maxCollisionmaxCollision");

      const maxValueId = maxCollision.id;
      // 放到maxValueId的前面
      if (maxValueId !== "droppable") {
        const maxIndex =
          maxCollision.data.droppableContainer.data.current.index;
        const activeIndex = active.data.current.index;
        console.log(maxIndex, "maxIndex");
        console.log(activeIndex, "activeIndex");

        setList((list) => {
          return moveBefore(list, activeIndex, maxIndex);
        });
        // setList((list) => {
        //   console.log(list, "listlistlistlist");
        //   const activeIndex = list.findIndex((item) => item.id === active.id);
        //   const targetIndex = list.findIndex((item) => item.id === maxValueId);
        //   console.log(activeIndex, "activeIndexactiveIndex");
        //   const newList = arrayMove(list, activeIndex, targetIndex - 1);
        //   return newList;
        // });
      }
      // collisions.find((item) => {
      //   const { id, data } = item;
      //   const { value } = data;
      //
      // });
      // 移动到最后
      // setList((list) => {
      //   console.log(list, "listlistlistlist");
      //   const activeIndex = list.findIndex((item) => item.id === active.id);
      //   console.log(activeIndex, "activeIndexactiveIndex");
      //   return arrayMove(list, activeIndex, list.length - 1);
      // });
      return;
    }

    // 列表内部重新排序
    // const type = over.data.current?.type;
    // console.log(type, "type");
    // const targetId = over.id;
    //
    // setList((prev) => {
    //   const fromIndex = prev.findIndex((i) => i.id === active.id);
    //   const toIndex = prev.findIndex((i) => i.id === targetId);
    //   if (fromIndex === -1 || toIndex === -1) return prev;
    //
    //   const newList = [...prev];
    //   const [moved] = newList.splice(fromIndex, 1);
    //
    //   if (type === "top") newList.splice(toIndex, 0, moved);
    //   else if (type === "bottom") newList.splice(toIndex + 1, 0, moved);
    //
    //   return newList;
    // });
    //
    setInsertHint(null);
  }

  // ================================
  // 💡 拖拽经过时显示边界提示
  // ================================
  function handleDragOver(event) {
    const { collisions, over } = event;
    console.log(collisions);
    console.log(over);
    if (!over || !collisions?.length) {
      setInsertHint(null);
      return;
    }

    const hit = collisions[0];
    const type = hit.data?.type; // ✅ 直接从 collisions 获取
    // console.log(type, "12321");
    setInsertHint({
      targetId: over.id,
      position: type,
    });
    return;
    // console.log(event, "event");
    // const { over } = event;
    // if (!over) {
    //   setInsertHint(null);
    //   return;
    // }
    //
    // const type = over.data.current?.type;
    // setInsertHint({
    //   targetId: over.id,
    //   position: type,
    // });
  }
  function handleDragMove(event) {
    // console.log(event, "eventeventevent");
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
    const { over, active } = event;
    if (!over) return;
    // 从工具栏拖入到最后
    if (over.id === "canvas") {
      setList(createItemPushLast);
    }
  }
}

export default Basic;
