import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useEditorStore } from "../../store";
import DRAG_SVG from "../../images/drag.svg";
const borderMap = {
  top: {
    borderTopColor: " blue",
  },
  right: {
    borderRightColor: "blue",
  },
  bottom: {
    borderBottomColor: "blue",
  },
  left: {
    borderLeftColor: "blue",
  },
};
function CanvasItem(props) {
  const { nodeId, data, style: propsStyle, disabled } = props;
  const hint = useEditorStore((state) => state.hint);
  const overId = useEditorStore((state) => state.overId);
  const droppable = useDroppable({
    id: nodeId,
    data,
  });
  const { isOver } = droppable;
  //  { isOver, setNodeRef, ...rest }
  const draggable = useDraggable({
    id: nodeId,
    data,
    disabled
  });
  const ref = (node) => {
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  };
  
  const isDragging = !!draggable.isDragging;
  const transformStyle = draggable.transform && !isDragging
    ? {
        // transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
      }
    : {};
  const borderStyle = overId === nodeId ? borderMap[hint] : {};
  const borderStyles = {
    border: "1px dashed",
    borderTopColor: "#aaa",
    borderBottomColor: "#aaa",
    borderLeftColor: " #aaa",
    borderRightColor: "#aaa",
    borderRadius: 2,
  };
  let style = {
    ...transformStyle,
    ...propsStyle,
    ...borderStyles,
    ...borderStyle,
    padding: 16,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 12px 30px rgba(0,0,0,0.18)" : undefined,
  };
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          position: "relative",
        }}
      >
        <div
          {...(!disabled ? (draggable.attributes ?? {}) : {})}
          {...(!disabled ? (draggable.listeners ?? {}) : {})}
          role="button"
          aria-label="Drag handle"
          tabIndex={disabled ? -1 : 0}
          style={{
            width: 24,
            height: 24,
            left: -24,
            top: -24,
            position: "absolute",
            cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
            zIndex: 10,
            // opacity: disabled ? 0 : hovered ? 1 : 0.25,
            transition: "opacity 120ms ease, transform 120ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#07a6f0",
            borderRadius: 4,
            boxShadow: isDragging ? "0 6px 18px rgba(0,0,0,0.18)" : "0 2px 6px rgba(0,0,0,0.12)",
            pointerEvents: disabled ? "none" : "auto",
            transform: isDragging ? "scale(1.02)" : "none",
          }}
        >
          {!disabled ? (
            <img src={DRAG_SVG} alt="drag" style={{ width: 14, height: 14, pointerEvents: "none" }} />
          ) : null}
        </div>
        {/* <div>{nodeId}</div> */}
        {props.children}
      </div>
    </div>
  );
}
export default CanvasItem;
