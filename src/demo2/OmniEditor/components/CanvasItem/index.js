import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useEditorStore } from "../../store";
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
  // const isOverStyle = isOver ? { borderColor: "blue " } : {};
  const borderStyle = overId === nodeId ? borderMap[hint] : {};
  // console.log(borderStyle, "borderStyle");
  //
  // console.log(transformStyle, "transformStyletransformStyle");
  const style = {
    ...transformStyle,
    ...propsStyle,
    // ...isOverStyle,
    ...borderStyle,

    // color: isOver ? "green" : undefined,
    // height: "200px",
    // border: "2px dashed gray",
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
            width: "20px",
            height: "20px",
            left: 0,
            top: 0,
            backgroundColor: "gray",
            position: "absolute",
            cursor: disabled ? "default" : "pointer",
            zIndex: 10,
            display: disabled ? "none" : "block",
          }}
        >
          {!disabled ? "+" : null}
        </div>
        <div>{nodeId}</div>
        {props.children}
      </div>
    </div>
  );
}
export default CanvasItem;
