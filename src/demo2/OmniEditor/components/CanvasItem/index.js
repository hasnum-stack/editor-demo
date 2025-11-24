import React from "react";
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
  const { nodeId, data, index, style: propsStyle,disabled } = props;
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
  
  const transformStyle = draggable.transform
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
    padding: 8,
  };
  
  console.log(hint);

  return (
    <div ref={ref} style={style}>
      <div
        style={{
          position: "relative",
        }}
      >
        <div
          {...(!disabled ? (draggable.attributes ?? {}) : {})}
          {...(!disabled ? (draggable.listeners ?? {}) : {})}
          style={{
            width: "24px",
            height: "24px",
            left: -20,
            top: -20,
            position: "absolute",
            cursor: disabled ? "default" : "pointer",
            zIndex: 10,
            display: disabled ? "none" : "block",
            background:'#07a6f0',
            borderRadius:4
          }}
        >
          {!disabled ? <img src={DRAG_SVG} /> : null}
        </div>
        {/* <div>{nodeId}</div> */}
        {props.children}
      </div>
    </div>
  );
}
export default CanvasItem;
