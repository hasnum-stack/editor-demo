import React from 'react';
import useEditorStore from './store';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import NodeItem from './FieldNode';

export default function Canvas({ activeDrag }) {
  const nodes = useEditorStore(s => s.nodes);
  const rootId = useEditorStore(s => s.rootId);
  const children = nodes[rootId].children || [];
  // children of root

  // make the canvas a droppable area (so external drags from the Palette can drop here)
  const { setNodeRef } = useDroppable({ id: rootId });

  // small DropZone component placed between items to provide a clear drop target
  function DropZone({ parentId, index }) {
    const id = `canvas-drop-${parentId}-${index}`;
    const { isOver, setNodeRef: setDropRef } = useDroppable({ id });
    return <div ref={setDropRef} className={'drop-zone' + (isOver ? ' active' : '')} data-index={index} />;
  }

  return (
    <div ref={setNodeRef} className="canvas" id="canvas-root">
      <SortableContext items={children} strategy={rectSortingStrategy}>
        {/* use a 24-column CSS Grid so items can occupy 1, 1/2, or 1/3 widths */}
        <div className="container-grid">
          {/* drop zone before first item (full width) */}
          <div className="grid-item-full">
            <DropZone parentId={rootId} index={0} />
          </div>

          {children.map((id, i) => {
            const node = nodes[id] || {};
            const frac = (node.props && node.props.widthFraction) || '1';
            const span = frac === '1/2' ? 12 : frac === '1/3' ? 8 : 24;
            return (
              <React.Fragment key={id}>
                <div className="grid-item" style={{ gridColumn: `span ${span}` }}>
                  <NodeItem id={id} activeDrag={activeDrag} />
                </div>
                {/* drop zone after each item (full-width insertion between rows) */}
                <div className="grid-item-full">
                  <DropZone parentId={rootId} index={i + 1} />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </SortableContext>
      {children.length === 0 && <div className="small">Drop fields here</div>}
    </div>
  );
}
