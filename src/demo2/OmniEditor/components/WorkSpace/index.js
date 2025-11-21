import React from "react";
import { useDroppable } from "@dnd-kit/core";
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
function WorkSpace(props) {
  const { id, globalType, data } = props;
  const hint = useEditorStore((state) => state.hint);
  const overId = useEditorStore((state) => state.overId);
  const { isOver, setNodeRef, ...rest } = useDroppable({
    id: id,
    data,
  });
  // console.log(isOver );
  // console.log();
    const borderStyle = overId === id ? borderMap[hint] : {};
    
  const style = {
    // color: isOver ? "green" : undefined,
    // height: "200px",
    border: "1px dashed gray",
    padding: 8,
    ...borderStyle
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
export default WorkSpace;
