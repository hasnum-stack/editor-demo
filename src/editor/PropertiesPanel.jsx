import React from 'react'
import useEditorStore from './store'

export default function PropertiesPanel(){
  const selectedId = useEditorStore(s => s.selectedId)
  const node = useEditorStore(s => selectedId ? s.nodes[selectedId] : null)
  const update = useEditorStore(s => s.updateNodeProps)
  if (!node) return <div className="properties small">Select a node to edit its props</div>
  return (
    <div className="properties">
      <div><strong>Editing:</strong> {node.type}</div>
      <label>Label</label>
      <input value={node.props.label||''} onChange={e=>update(node.id,{label:e.target.value})} />
      <label>Name</label>
      <input value={node.props.name||''} onChange={e=>update(node.id,{name:e.target.value})} />
      <label>Width</label>
      <select value={node.props.widthFraction||'1'} onChange={e=>update(node.id,{widthFraction:e.target.value})}>
        <option value="1">Full (1)</option>
        <option value="1/2">Half (1/2)</option>
        <option value="1/3">Third (1/3)</option>
      </select>
      <label>Props JSON (raw)</label>
      <textarea value={JSON.stringify(node.props,null,2)} onChange={e=>{
        try{
          const obj = JSON.parse(e.target.value)
          update(node.id, obj)
        }catch(err){
          // ignore parse error for now
        }
      }} rows={6} />
      <div className="small">You can edit label/name directly.</div>
    </div>
  )
}
