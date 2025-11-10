import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import useEditorStore from './store'
import { Row, Col } from './Grid'

// Inner drop zone component for container children
function InnerDropZone({ parentId, index }){
  const id = `canvas-drop-${parentId}-${index}`
  const { isOver, setNodeRef: setDropRef } = useDroppable({ id })
  return <div ref={setDropRef} className={"drop-zone" + (isOver ? ' active' : '')} />
}

export default function NodeItem({ id, activeDrag }){
  const node = useEditorStore(s => s.nodes[id])
  const select = useEditorStore(s => s.selectNode)
  const remove = useEditorStore(s => s.removeNode)
  const update = useEditorStore(s => s.updateNodeProps)
  const {attributes, listeners, setNodeRef, transform, /* transition, */ isDragging} = useSortable({ id })
  // Disable transition so items instantly jump to new positions (no swap animation)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'none'
  }

  // edge drop zones: top/left/right/bottom
  const { isOver: isOverTop, setNodeRef: setTopRef } = useDroppable({ id: `node-drop-${id}-top` })
  const { isOver: isOverRight, setNodeRef: setRightRef } = useDroppable({ id: `node-drop-${id}-right` })
  const { isOver: isOverBottom, setNodeRef: setBottomRef } = useDroppable({ id: `node-drop-${id}-bottom` })
  const { isOver: isOverLeft, setNodeRef: setLeftRef } = useDroppable({ id: `node-drop-${id}-left` })

  // if this node is a Container, render an inner droppable area and its children
  const children = node.children || []
  const isContainer = node.type === 'Container'

  return (
    <div className={'node-wrapper'}>
      <div ref={node => { /* attach draggable ref to the main node */ setNodeRef(node); }} style={style} className={'node' + (isDragging ? ' dragging' : '')}>
        <div className="label" onClick={()=>select(id)}>{node.props.label || node.type} <span className="small">({node.type})</span></div>
        <div style={{display:'flex',gap:8}}>
          <div className="handle" {...listeners} {...attributes}>☰</div>
          <button onClick={()=>remove(id)}>Del</button>
        </div>
      </div>

      {/* edge indicators (only show when there's an active drag) */}
      {activeDrag && <>
        <div ref={setLeftRef} className={"drop-edge left" + (isOverLeft ? ' active' : '')} />
        <div ref={setRightRef} className={"drop-edge right" + (isOverRight ? ' active' : '')} />
        <div ref={setTopRef} className={"drop-edge top" + (isOverTop ? ' active' : '')} />
        <div ref={setBottomRef} className={"drop-edge bottom" + (isOverBottom ? ' active' : '')} />
      </>}

      {/* If container, render inner area with its own dropzones and children */}
      {isContainer && (
        <div className="container-inner">
          <SortableContext items={children} strategy={rectSortingStrategy}>
            <div className="container-grid">
              {/* drop zone before first item (full width) */}
              <div className="grid-item-full"><InnerDropZone parentId={id} index={0} /></div>

              {children.map((childId, i) => {
                const child = useEditorStore.getState().nodes[childId] || {}
                const frac = (child.props && child.props.widthFraction) || '1'
                const span = frac === '1/2' ? 12 : frac === '1/3' ? 8 : 24
                return (
                  <React.Fragment key={childId}>
                    <div className="grid-item" style={{gridColumn: `span ${span}`}}>
                      <NodeItem id={childId} activeDrag={activeDrag} />
                    </div>
                    {/* insertion drop zone as full-width row after this child */}
                    <div className="grid-item-full"><InnerDropZone parentId={id} index={i+1} /></div>
                  </React.Fragment>
                )
              })}

              {/* when empty, show the zero-index dropzone inside the grid */}
              {children.length === 0 && <div className="grid-item-full"><InnerDropZone parentId={id} index={0} /></div>}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  )
}
