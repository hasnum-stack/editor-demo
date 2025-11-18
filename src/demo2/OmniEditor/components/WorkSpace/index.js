import React from "react";
import { useDroppable } from "@dnd-kit/core";

function WorkSpace(props) {
  const { id, globalType, data } = props;
  const { isOver, setNodeRef, ...rest } = useDroppable({
    id: id,
    data,
  });
  // console.log(isOver );
  // console.log();
  const style = {
    // color: isOver ? "green" : undefined,
    // height: "200px",
    // border: "2px dashed gray",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
export default WorkSpace;
