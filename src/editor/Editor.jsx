import React, { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import Palette from './Palette';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import useEditorStore from './store';

export default function Editor() {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeDrag, setActiveDrag] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const store = useEditorStore();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={e => {
        console.log(e, 'tewst');
        const { active } = e;
        setActiveDrag(active.id);
        // if palette item, active.data.current.payload exists
        setOverlay(active.data.current?.payload ?? { type: 'Unknown' });
      }}
      onDragEnd={e => {
        const { active, over } = e;
        setActiveDrag(null);
        setOverlay(null);
        if (!over) return;
        // if drop target is a canvas drop zone, it will have id like 'canvas-drop-<index>'
        const overId = over.id;
        const src = active.data.current?.source;
        // directional node-drop: node-drop-<id>-<top|right|bottom|left>
        if (overId && typeof overId === 'string') {
          const m = String(overId).match(/^node-drop-(.+)-(top|right|bottom|left)$/);
          if (m) {
            const targetId = m[1];
            const dir = m[2];
            console.log(dir, 'dirdirdir');
            // find the parent of the target node so we can insert into the correct list
            const parentId = store.nodes[targetId]?.parent ?? store.rootId;
            const children = store.nodes[parentId]?.children || [];
            const targetIndex = children.indexOf(targetId);
            if (targetIndex !== -1) {
              if (src === 'palette') {
                const payload = active.data.current.payload;
                // compute spans helper
                const spanFor = f => (f === '1/2' ? 12 : f === '1/3' ? 8 : 24);
                // left -> insert before target
                if (dir === 'left') {
                  // if target is full and payload is full, split to halves
                  const targetSpan = spanFor(store.nodes[targetId].props.widthFraction);
                  const payloadSpan = spanFor(payload.props?.widthFraction);
                  store.addNode({ type: payload.type, props: payload.props }, parentId, targetIndex);
                  const newId = store.nodes[parentId].children[targetIndex];
                  if (targetSpan === 24 && payloadSpan === 24) {
                    store.updateNodeProps(targetId, { widthFraction: '1/2' });
                    store.updateNodeProps(newId, { widthFraction: '1/2' });
                  } else if (targetSpan === 24 && payloadSpan === 12) {
                    store.updateNodeProps(targetId, { widthFraction: '1/2' });
                    store.updateNodeProps(newId, { widthFraction: '1/2' });
                  }
                  return;
                }
                // right -> insert after target
                if (dir === 'right') {
                  const targetSpan = spanFor(store.nodes[targetId].props.widthFraction);
                  const payloadSpan = spanFor(payload.props?.widthFraction);
                  store.addNode({ type: payload.type, props: payload.props }, parentId, targetIndex + 1);
                  const newId = store.nodes[parentId].children[targetIndex + 1];
                  if (targetSpan === 24 && payloadSpan === 24) {
                    store.updateNodeProps(targetId, { widthFraction: '1/2' });
                    store.updateNodeProps(newId, { widthFraction: '1/2' });
                  } else if (targetSpan === 24 && payloadSpan === 12) {
                    store.updateNodeProps(targetId, { widthFraction: '1/2' });
                    store.updateNodeProps(newId, { widthFraction: '1/2' });
                  }
                  return;
                }
                // top/bottom behave like before/after with full insert
                if (dir === 'top') {
                  store.addNode({ type: payload.type, props: payload.props }, parentId, targetIndex);
                  return;
                }
                if (dir === 'bottom') {
                  store.addNode({ type: payload.type, props: payload.props }, parentId, targetIndex + 1);
                  return;
                }
              } else {
                // internal move
                const movingId = active.id;
                const oldIndex = children.indexOf(movingId);
                let insertIndex = dir === 'left' || dir === 'top' ? targetIndex : targetIndex + 1;
                if (oldIndex !== -1 && oldIndex < insertIndex) insertIndex = insertIndex - 1;
                // before moving, compute spans and possibly adjust so they can sit side-by-side
                const spanFor = f => (f === '1/2' ? 12 : f === '1/3' ? 8 : 24);
                if (dir === 'left' || dir === 'right') {
                  const targetSpan = spanFor(store.nodes[targetId].props.widthFraction);
                  const movingSpan = spanFor(store.nodes[movingId].props.widthFraction);
                  // if target is full and moving is full, make both halves
                  if (targetSpan === 24 && movingSpan === 24) {
                    store.updateNodeProps(targetId, { widthFraction: '1/2' });
                    store.updateNodeProps(movingId, { widthFraction: '1/2' });
                  } else if (targetSpan === 24 && movingSpan === 12) {
                    store.updateNodeProps(targetId, { widthFraction: '1/2' });
                    store.updateNodeProps(movingId, { widthFraction: '1/2' });
                  }
                }
                store.moveNode(movingId, parentId, insertIndex);
                return;
              }
            }
          }
        }
        if (overId && typeof overId === 'string') {
          const m = String(overId).match(/^canvas-drop-(.+)-(\d+)$/);
          if (m) {
            const parentId = m[1];
            const idx = parseInt(m[2], 10);
            if (src === 'palette') {
              const payload = active.data.current.payload;
              store.addNode({ type: payload.type, props: payload.props }, parentId, idx);
              return;
            } else {
              const movingId = active.id;
              store.moveNode(movingId, parentId, idx);
              return;
            }
          }
        }
        // if the drop target is an existing node, insert before that node
        // this enables dragging a node onto another node to place it before
        if (overId && typeof overId === 'string') {
          const parentId = store.nodes[overId]?.parent ?? store.rootId;
          const children = store.nodes[parentId]?.children || [];
          const targetIndex = children.indexOf(overId);
          if (targetIndex !== -1) {
            if (src === 'palette') {
              const payload = active.data.current.payload;
              store.addNode({ type: payload.type, props: payload.props }, parentId, targetIndex);
              return;
            } else {
              const movingId = active.id;
              const oldIndex = children.indexOf(movingId);
              let insertIndex = targetIndex;
              // adjust index if removing an earlier item will shift positions
              if (oldIndex !== -1 && oldIndex < insertIndex) insertIndex = insertIndex - 1;
              store.moveNode(movingId, parentId, insertIndex);
              return;
            }
          }
        }
        // fall back: if source is palette and dropped onto canvas container directly
        if (src === 'palette') {
          const payload = active.data.current.payload;
          store.addNode({ type: payload.type, props: payload.props });
          return;
        }
      }}
      onDragCancel={() => {
        setActiveDrag(null);
        setOverlay(null);
      }}
    >
      <div className="editor">
        <div className="panel">
          <h4>Palette</h4>
          <Palette />
        </div>

        <div className="panel">
          <h4>Canvas</h4>
          <Canvas activeDrag={activeDrag} />
        </div>

        <div className="panel">
          <h4>Properties</h4>
          <PropertiesPanel />
        </div>

        <DragOverlay
          dropAnimation={{ duration: 0 }}
          style={{
            width: '100px',
          }}
        >
          {overlay ? <div className="node">{overlay.type} (preview)</div> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
