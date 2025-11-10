import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export function Droppable(props) {
  const { id } = props;
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable`,
  });
  const style = {
    color: isOver ? 'green' : undefined,
    height: '200px',
    border: '2px dashed gray',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
