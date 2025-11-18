import React from "react";
import { useDraggable } from "@dnd-kit/core";

function Tool(props) {
  const { id, data } = props;
  const { attributes, listeners, setNodeRef, transform, ...rest } =
    useDraggable({
      id,
      data,
    });
  const style = transform
    ? {
        // transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}

export default Tool;
