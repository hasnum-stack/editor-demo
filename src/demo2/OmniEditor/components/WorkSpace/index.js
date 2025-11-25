import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useEditorStore } from "../../store";
import styles from "./index.module.less";

const borderMap = {
  top: {
    borderTopColor: "red",
  },
  right: {
    borderRightColor: "red",
  },
  bottom: {
    borderBottomColor: "red",
  },
  left: {
    borderLeftColor: "red",
  },
};
function WorkSpace(props) {
  const { id, data, selected } = props;
  const hint = useEditorStore((state) => state.hint);
  const overId = useEditorStore((state) => state.overId);
  const { isOver, setNodeRef, ...rest } = useDroppable({
    id: id,
    data,
  });
  const borderStyle = isOver && overId === id ? borderMap[hint] : {};
  const borderColor = selected
    ? { border: "1px dashed #07a6f0" }
    : { border: "1px dashed gray" };
  const style = {
    ...borderStyle,
    ...borderColor
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.workSpaceWrapper}>
      {props.children}
    </div>
  );
}
export default WorkSpace;
