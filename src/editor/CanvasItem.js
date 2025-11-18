import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useEditorStore } from "../store";

export function CanvasItem1(props) {
  const { id } = props;
  const droppable = useDroppable({
    id: `droppable_${id}`,
  });
  //  { isOver, setNodeRef, ...rest }
  const draggable = useDraggable({
    id: `draggable_${id}`,
  });
  // { attributes, listeners, setNodeRef, transform, ...rest }
  console.log(droppable, "droppabledroppabledroppable");
  const ref = (node) => {
    console.log(node, "nodenode");
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  };
  // console.log(isOver);
  // console.log(rest, "rest");
  const transformStyle = draggable.transform
    ? {
        transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
      }
    : {};
  //
  // console.log(transformStyle, "transformStyletransformStyle");
  const style = {
    ...transformStyle,
    // color: isOver ? "green" : undefined,
    // height: "200px",
    // border: "2px dashed gray",
  };

  return (
    <div
      ref={draggable.setNodeRef}
      {...draggable.attributes}
      {...draggable.listeners}
    >
      <div ref={droppable.setNodeRef} style={style}>
        {props.children}
      </div>
    </div>
  );
}

export function CanvasItem(props) {
  const { id, index, style: propsStyle } = props;
  const hint = useEditorStore((state) => state.hint);
  const data = {
    index,
  };
  const droppable = useDroppable({
    id,
    data,
  });
  const { isOver } = droppable;
  //  { isOver, setNodeRef, ...rest }
  const draggable = useDraggable({
    id,
    data,
  });
  // console.log(droppable, id, isOver, "droppabledroppabledroppable");
  // console.log(draggable, id, "draggabledraggable");
  // const {
  //   rect: {
  //     current: { width = 0, height = 0, left, right, top, bottom } = {},
  //   } = {},
  // } = droppable;

  // const {
  //   rect: { current },
  // } = droppable;
  // console.log(current, "current");
  // const {
  //   width = 0,
  //   height = 0,
  //   left = 0,
  //   right = 0,
  //   top = 0,
  //   bottom = 0,
  // } = current || {};
  // console.log(width, height, left, right, top, bottom, "pos");
  //
  // { attributes, listeners, setNodeRef, transform, ...rest }
  // console.log(droppable, "droppabledroppabledroppable");
  const ref = (node) => {
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  };
  // console.log(isOver);
  // console.log(rest, "rest");
  const transformStyle = draggable.transform
    ? {
        // transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
      }
    : {};
  const isOverStyle = isOver ? { borderColor: "blue " } : {};
  //
  // console.log(transformStyle, "transformStyletransformStyle");
  const style = {
    ...transformStyle,
    ...propsStyle,
    ...isOverStyle,

    // color: isOver ? "green" : undefined,
    // height: "200px",
    // border: "2px dashed gray",
  };

  return (
    <div
      ref={ref}
      {...draggable.attributes}
      {...draggable.listeners}
      style={style}
    >
      {/*width: {width}, height: {height}, left: {left}, right: {right}, top: {top}*/}
      {/*, bottom: {bottom}*/}
      {hint}
      {props.children}
    </div>
  );
}
