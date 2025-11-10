import React from 'react'
import { useDraggable } from '@dnd-kit/core'

const ITEMS = [
  { type: 'Input', label: 'Text Input', props: { label: 'Text', name: '', widthFraction: '1' } },
  { type: 'TextArea', label: 'Text Area', props: { label: 'Long Text', name: '', widthFraction: '1/2' } },
  { type: 'Select', label: 'Select', props: { label: 'Select', name: '', options: ['a','b'], widthFraction: '1/3' } },
  { type: 'Container', label: 'Container', props: { label: 'Container', widthFraction: '1' } },
]

function PaletteItem({ item }){
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id: `palette-${item.type}-${item.label}`,
    data: { source: 'palette', payload: item }
  })
  // keep the original palette item visually stationary; only the DragOverlay
  // (configured in Editor.jsx) shows a moving preview. Avoid applying the
  // returned `transform` to the source element so it doesn't move.
  const style = {
    transform: 'none',
    cursor: 'grab',
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="palette-item" style={style}>
      {item.label}
    </div>
  )
}

export default function Palette(){
  return (
    <div>
      <div className="small">Drag items from here to the canvas</div>
      {ITEMS.map(it => <PaletteItem key={it.type} item={it} />)}
    </div>
  )
}
