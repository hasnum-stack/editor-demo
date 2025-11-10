import React from 'react'
import './grid.css'

export function Row({ children, gutter = [12,12], style }){
  const [hx, vy] = gutter
  const rowStyle = { display: 'flex', flexWrap: 'wrap', gap: `${vy}px ${hx}px`, alignItems: 'flex-start', ...style }
  return <div className="rs-row" style={rowStyle}>{children}</div>
}

export function Col({ children, span = 24, style }){
  const width = `${(span / 24) * 100}%`
  const colStyle = { flex: `0 0 ${width}`, maxWidth: width, boxSizing: 'border-box', ...style }
  return <div className="rs-col" style={colStyle}>{children}</div>
}

export default { Row, Col }
