import React, { useState, useRef, useEffect } from "react";

// Spreadsheet component (read-only cells)
// - Data keyed by 'row,col'
// - Meta tracks merged origins and covered cells

function coordKey(row, col) {
  return `${row},${col}`;
}

function parseKey(key) {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

export default function Spreadsheet({ rows = 12, cols = 8 }) {
  const [rowCount, setRowCount] = useState(rows);
  const [colCount, setColCount] = useState(cols);

  const [data, setData] = useState({}); // { 'row,col': string }
  const [meta, setMeta] = useState({}); // { 'row,col': { origin } | { rowSpan, colSpan } }

  // selection: { startRow, startCol, endRow, endCol }
  const [selection, setSelection] = useState(null);
  const selecting = useRef(false);
  const anchor = useRef(null);

  // normalize two points into a selection rectangle
  function normalizeSel(a, b) {
    const startRow = Math.min(a.row, b.row);
    const endRow = Math.max(a.row, b.row);
    const startCol = Math.min(a.col, b.col);
    const endCol = Math.max(a.col, b.col);
    return { startRow, startCol, endRow, endCol };
  }

  function getOriginFor(row, col) {
    const cellKey = coordKey(row, col);
    const cellMeta = meta[cellKey];
    if (!cellMeta) return null;
    if (cellMeta.origin) return cellMeta.origin;
    return cellKey;
  }

  // selection mouse handlers
  function onCellMouseDown(e, row, col) {
    selecting.current = true;
    anchor.current = { row, col };
    setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
  }

  function onCellMouseEnter(e, row, col) {
    if (!selecting.current || !anchor.current) return;
    const sel = normalizeSel(anchor.current, { row, col });
    setSelection(sel);
  }

  function onMouseUp() {
    selecting.current = false;
    anchor.current = null;
  }

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);

  function onCellClick(e, row, col) {
    if (e.shiftKey && selection) {
      const start = { row: selection.startRow, col: selection.startCol };
      const sel = normalizeSel(start, { row, col });
      setSelection(sel);
    } else {
      setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
    }
  }

  // Merge selection into an origin cell
  function mergeSelection() {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const rowSpan = endRow - startRow + 1;
    const colSpan = endCol - startCol + 1;
    if (rowSpan === 1 && colSpan === 1) return;

    // Validate there are no partial overlaps with existing merges
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const key = coordKey(r, c);
        const cellMeta = meta[key];
        if (cellMeta && cellMeta.origin) {
          const originCoord = parseKey(cellMeta.origin);
          if (
            originCoord.row < startRow ||
            originCoord.row > endRow ||
            originCoord.col < startCol ||
            originCoord.col > endCol
          ) return alert("Cannot merge: selection includes part of an existing merged area");
        }
        if (cellMeta && (cellMeta.rowSpan || cellMeta.colSpan)) {
          const originRow = r;
          const originCol = c;
          const originRowSpan = cellMeta.rowSpan || 1;
          const originColSpan = cellMeta.colSpan || 1;
          const originRowEnd = originRow + originRowSpan - 1;
          const originColEnd = originCol + originColSpan - 1;
          if (
            originRow < startRow ||
            originRowEnd > endRow ||
            originCol < startCol ||
            originColEnd > endCol
          ) return alert("Cannot merge: selection includes part of an existing merged area");
        }
      }
    }

    const originKey = coordKey(startRow, startCol);
    setMeta((prev) => {
      const next = { ...prev };
      next[originKey] = { rowSpan, colSpan };
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const k = coordKey(r, c);
          if (k === originKey) continue;
          next[k] = { origin: originKey };
        }
      }
      return next;
    });
  }

  // Split merged cells found in selection
  function splitSelection() {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const toSplit = [];

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const key = coordKey(r, c);
        const cellMeta = meta[key];
        if (cellMeta && (cellMeta.rowSpan || cellMeta.colSpan)) {
          toSplit.push({ row: r, col: c, key, rowSpan: cellMeta.rowSpan, colSpan: cellMeta.colSpan });
        }
      }
    }

    if (toSplit.length === 0) {
      if (startRow === endRow && startCol === endCol) {
        const key = coordKey(startRow, startCol);
        const cellMeta = meta[key];
        if (cellMeta && cellMeta.origin) {
          const originKey = cellMeta.origin;
          const originMeta = meta[originKey];
          if (originMeta && (originMeta.rowSpan || originMeta.colSpan)) {
            toSplit.push({ key: originKey, ...parseKey(originKey), rowSpan: originMeta.rowSpan, colSpan: originMeta.colSpan });
          }
        }
      }
    }

    if (toSplit.length === 0) return;

    setMeta((prev) => {
      const next = { ...prev };
      toSplit.forEach((entry) => {
        const { row, col, rowSpan, colSpan, key } = entry;
        delete next[key];
        for (let r2 = row; r2 < row + rowSpan; r2++) {
          for (let c2 = col; c2 < col + colSpan; c2++) {
            const coveredKey = coordKey(r2, c2);
            if (next[coveredKey] && next[coveredKey].origin === key) delete next[coveredKey];
          }
        }
      });
      return next;
    });
  }

  // Insert/Delete rows/cols (handle shifting meta/data)
  function insertRow(at) {
    if (at < 0) at = 0;
    if (at > rowCount) at = rowCount;

    const newData = {};
    const newMeta = {};

    // collect origin entries
    const origins = [];
    Object.keys(meta).forEach((metaKey) => {
      const entry = meta[metaKey];
      const parsed = parseKey(metaKey);
      if (entry && (entry.rowSpan || entry.colSpan)) origins.push({ row: parsed.row, col: parsed.col, rowSpan: entry.rowSpan || 1, colSpan: entry.colSpan || 1, key: metaKey });
    });

    // relocate origins
    origins.forEach((origin) => {
      let { row: originRow, col: originCol, rowSpan: rs, colSpan: cs } = origin;
      const newOriginRow = originRow >= at ? originRow + 1 : originRow;
      if (originRow < at && originRow + rs - 1 >= at) rs = rs + 1;
      const newKey = coordKey(newOriginRow, originCol);
      newMeta[newKey] = { rowSpan: rs, colSpan: cs };
      const oldDataKey = coordKey(originRow, originCol);
      if (data[oldDataKey] !== undefined) newData[newKey] = data[oldDataKey];
    });

    // set covered cells for new origins
    Object.keys(newMeta).forEach((originKey) => {
      const originMeta = newMeta[originKey];
      const parsedOrigin = parseKey(originKey);
      for (let r2 = parsedOrigin.row; r2 < parsedOrigin.row + originMeta.rowSpan; r2++) {
        for (let c2 = parsedOrigin.col; c2 < parsedOrigin.col + originMeta.colSpan; c2++) {
          const coveredKey = coordKey(r2, c2);
          if (r2 === parsedOrigin.row && c2 === parsedOrigin.col) continue;
          newMeta[coveredKey] = { origin: originKey };
        }
      }
    });

    // move data cells
    Object.keys(data).forEach((dataKey) => {
      const parsed = parseKey(dataKey);
      const row = parsed.row;
      const col = parsed.col;
      const maybeOrigin = origins.find((o) => o.row === row && o.col === col);
      if (maybeOrigin) return;
      const newR = row >= at ? row + 1 : row;
      const newK = coordKey(newR, col);
      if (newData[newK] === undefined) newData[newK] = data[dataKey];
    });

    // copy covered meta refs
    Object.keys(meta).forEach((metaKey) => {
      const parsed = parseKey(metaKey);
      const row = parsed.row;
      const col = parsed.col;
      const cellMeta = meta[metaKey];
      if (cellMeta && cellMeta.origin) {
        const originParsed = parseKey(cellMeta.origin);
        const originNewR = originParsed.row >= at ? originParsed.row + 1 : originParsed.row;
        const originNewKey = coordKey(originNewR, originParsed.col);
        const newR = row >= at ? row + 1 : row;
        const newK = coordKey(newR, col);
        if (!newMeta[newK]) newMeta[newK] = { origin: originNewKey };
      }
    });

    setData(newData);
    setMeta(newMeta);
    setRowCount((prev) => prev + 1);

    if (selection) {
      const { startRow, endRow, startCol, endCol } = selection;
      const nsr = startRow >= at ? startRow + 1 : startRow;
      const ner = endRow >= at ? endRow + 1 : endRow;
      setSelection({ startRow: nsr, endRow: ner, startCol, endCol });
    }
  }

  function insertCol(at) {
    if (at < 0) at = 0;
    if (at > colCount) at = colCount;

    const newData = {};
    const newMeta = {};

    const origins = [];
    Object.keys(meta).forEach((metaKey) => {
      const entry = meta[metaKey];
      const parsed = parseKey(metaKey);
      if (entry && (entry.rowSpan || entry.colSpan)) origins.push({ row: parsed.row, col: parsed.col, rowSpan: entry.rowSpan || 1, colSpan: entry.colSpan || 1, key: metaKey });
    });

    origins.forEach((origin) => {
      let { row: originRow, col: originCol, rowSpan: rs, colSpan: cs } = origin;
      const newOriginCol = originCol >= at ? originCol + 1 : originCol;
      if (originCol < at && originCol + cs - 1 >= at) cs = cs + 1;
      const newKey = coordKey(originRow, newOriginCol);
      newMeta[newKey] = { rowSpan: rs, colSpan: cs };
      const oldDataKey = coordKey(originRow, originCol);
      if (data[oldDataKey] !== undefined) newData[newKey] = data[oldDataKey];
    });

    Object.keys(newMeta).forEach((originKey) => {
      const originMeta = newMeta[originKey];
      const parsedOrigin = parseKey(originKey);
      for (let r2 = parsedOrigin.row; r2 < parsedOrigin.row + originMeta.rowSpan; r2++) {
        for (let c2 = parsedOrigin.col; c2 < parsedOrigin.col + originMeta.colSpan; c2++) {
          const coveredKey = coordKey(r2, c2);
          if (r2 === parsedOrigin.row && c2 === parsedOrigin.col) continue;
          newMeta[coveredKey] = { origin: originKey };
        }
      }
    });

    Object.keys(data).forEach((dataKey) => {
      const parsed = parseKey(dataKey);
      const row = parsed.row;
      const col = parsed.col;
      const maybeOrigin = origins.find((o) => o.row === row && o.col === col);
      if (maybeOrigin) return;
      const newC = col >= at ? col + 1 : col;
      const newK = coordKey(row, newC);
      if (newData[newK] === undefined) newData[newK] = data[dataKey];
    });

    Object.keys(meta).forEach((metaKey) => {
      const parsed = parseKey(metaKey);
      const row = parsed.row;
      const col = parsed.col;
      const cellMeta = meta[metaKey];
      if (cellMeta && cellMeta.origin) {
        const originParsed = parseKey(cellMeta.origin);
        const originNewC = originParsed.col >= at ? originParsed.col + 1 : originParsed.col;
        const newC = col >= at ? col + 1 : col;
        const newK = coordKey(row, newC);
        if (!newMeta[newK]) newMeta[newK] = { origin: originNewC };
      }
    });

    setData(newData);
    setMeta(newMeta);
    setColCount((prev) => prev + 1);

    if (selection) {
      const { startRow, endRow, startCol, endCol } = selection;
      const nsc = startCol >= at ? startCol + 1 : startCol;
      const nec = endCol >= at ? endCol + 1 : endCol;
      setSelection({ startRow, endRow, startCol: nsc, endCol: nec });
    }
  }

  function deleteRow(at) {
    if (rowCount <= 1) return;
    if (at < 0) at = 0;
    if (at >= rowCount) at = rowCount - 1;

    const clearedMeta = { ...meta };
    Object.keys(meta).forEach((metaKey) => {
      const metaEntry = meta[metaKey];
      if (metaEntry && (metaEntry.rowSpan || metaEntry.colSpan)) {
        const parsed = parseKey(metaKey);
        const rs = metaEntry.rowSpan || 1;
        if (parsed.row <= at && parsed.row + rs - 1 >= at) {
          delete clearedMeta[metaKey];
          for (let r2 = parsed.row; r2 < parsed.row + rs; r2++) {
            for (let c2 = parsed.col; c2 < parsed.col + (metaEntry.colSpan || 1); c2++) {
              const kk = coordKey(r2, c2);
              if (clearedMeta[kk] && clearedMeta[kk].origin === metaKey) delete clearedMeta[kk];
            }
          }
        }
      }
    });

    const newData = {};
    const newMeta = {};

    Object.keys(data).forEach((dataKey) => {
      const parsed = parseKey(dataKey);
      const row = parsed.row;
      const col = parsed.col;
      if (row === at) return;
      const nr = row > at ? row - 1 : row;
      newData[coordKey(nr, col)] = data[dataKey];
    });

    Object.keys(clearedMeta).forEach((metaKey) => {
      const parsed = parseKey(metaKey);
      const row = parsed.row;
      const col = parsed.col;
      if (row === at) return;
      const nr = row > at ? row - 1 : row;
      newMeta[coordKey(nr, col)] = { ...clearedMeta[metaKey] };
    });

    Object.keys(newMeta).forEach((metaKey) => {
      const metaEntry = newMeta[metaKey];
      if (metaEntry && metaEntry.origin) {
        const oldOrigin = parseKey(metaEntry.origin);
        const originNewR = oldOrigin.row > at ? oldOrigin.row - 1 : oldOrigin.row;
        metaEntry.origin = coordKey(originNewR, oldOrigin.col);
      }
    });

    setData(newData);
    setMeta(newMeta);
    setRowCount((prev) => prev - 1);

    if (selection) {
      let { startRow, endRow, startCol, endCol } = selection;
      if (startRow > at) startRow = startRow - 1;
      if (endRow > at) endRow = endRow - 1;
      if (startRow > endRow) startRow = endRow;
      setSelection({ startRow, endRow, startCol, endCol });
    }
  }

  function deleteCol(at) {
    if (colCount <= 1) return;
    if (at < 0) at = 0;
    if (at >= colCount) at = colCount - 1;

    const clearedMeta = { ...meta };
    Object.keys(meta).forEach((metaKey) => {
      const metaEntry = meta[metaKey];
      if (metaEntry && (metaEntry.rowSpan || metaEntry.colSpan)) {
        const parsed = parseKey(metaKey);
        const cs = metaEntry.colSpan || 1;
        if (parsed.col <= at && parsed.col + cs - 1 >= at) {
          delete clearedMeta[metaKey];
          for (let r2 = parsed.row; r2 < parsed.row + (metaEntry.rowSpan || 1); r2++) {
            for (let c2 = parsed.col; c2 < parsed.col + cs; c2++) {
              const kk = coordKey(r2, c2);
              if (clearedMeta[kk] && clearedMeta[kk].origin === metaKey) delete clearedMeta[kk];
            }
          }
        }
      }
    });

    const newData = {};
    const newMeta = {};
    Object.keys(data).forEach((dataKey) => {
      const parsed = parseKey(dataKey);
      const row = parsed.row;
      const col = parsed.col;
      if (col === at) return;
      const nc = col > at ? col - 1 : col;
      newData[coordKey(row, nc)] = data[dataKey];
    });
    Object.keys(clearedMeta).forEach((metaKey) => {
      const parsed = parseKey(metaKey);
      const row = parsed.row;
      const col = parsed.col;
      if (col === at) return;
      const nc = col > at ? col - 1 : col;
      newMeta[coordKey(row, nc)] = { ...clearedMeta[metaKey] };
    });

    Object.keys(newMeta).forEach((metaKey) => {
      const metaEntry = newMeta[metaKey];
      if (metaEntry && metaEntry.origin) {
        const oldOrigin = parseKey(metaEntry.origin);
        const originNewC = oldOrigin.col > at ? oldOrigin.col - 1 : oldOrigin.col;
        metaEntry.origin = coordKey(oldOrigin.row, originNewC);
      }
    });

    setData(newData);
    setMeta(newMeta);
    setColCount((prev) => prev - 1);

    if (selection) {
      let { startRow, endRow, startCol, endCol } = selection;
      if (startCol > at) startCol = startCol - 1;
      if (endCol > at) endCol = endCol - 1;
      if (startCol > endCol) startCol = endCol;
      setSelection({ startRow, endRow, startCol, endCol });
    }
  }

  // toolbar helpers
  function deleteRowAtSelection() {
    if (!selection) return;
    deleteRow(selection.startRow);
  }
  function deleteColAtSelection() {
    if (!selection) return;
    deleteCol(selection.startCol);
  }

  function insertRowAbove() {
    if (!selection) return;
    insertRow(selection.startRow);
  }
  function insertRowBelow() {
    if (!selection) return;
    insertRow(selection.endRow + 1);
  }
  function insertColLeft() {
    if (!selection) return;
    insertCol(selection.startCol);
  }
  function insertColRight() {
    if (!selection) return;
    insertCol(selection.endCol + 1);
  }

  // render a single cell
  function renderCell(row, col) {
    const cellKey = coordKey(row, col);
    const cellMeta = meta[cellKey];
    if (cellMeta && cellMeta.origin) return null;

    const spanRow = cellMeta && cellMeta.rowSpan ? cellMeta.rowSpan : 1;
    const spanCol = cellMeta && cellMeta.colSpan ? cellMeta.colSpan : 1;

    const isSelected =
      selection &&
      row >= selection.startRow &&
      row <= selection.endRow &&
      col >= selection.startCol &&
      col <= selection.endCol;

    const valueKey = getOriginFor(row, col) || cellKey;
    const value = data[valueKey] || "";

    return (
      <td
        key={cellKey}
        rowSpan={spanRow}
        colSpan={spanCol}
        onMouseDownCapture={(e) => onCellMouseDown(e, row, col)}
        onMouseEnter={(e) => onCellMouseEnter(e, row, col)}
        onClick={(e) => onCellClick(e, row, col)}
        style={{
          border: "1px solid #ddd",
          minWidth: 80,
          height: 28 * spanRow,
          padding: 4,
          verticalAlign: "top",
          background: isSelected ? "#d0e7ff" : "white",
        }}
      >
        <div style={{ width: "100%", height: "100%", outline: "none", userSelect: "text" }}>
          {value}
        </div>
      </td>
    );
  }

  // build rows
  const rowsElems = [];
  for (let row = 0; row < rowCount; row++) {
    const tds = [];
    for (let col = 0; col < colCount; col++) {
      const cell = renderCell(row, col);
      if (cell) tds.push(cell);
    }
    rowsElems.push(
      <tr key={row} style={{ height: 28 }}>
        {tds}
      </tr>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={mergeSelection} style={{ marginRight: 8 }}>
          Merge
        </button>
        <button onClick={splitSelection} style={{ marginRight: 8 }}>
          Split
        </button>

        <button onClick={insertRowAbove} style={{ marginRight: 6 }}>
          Insert Row Above
        </button>
        <button onClick={insertRowBelow} style={{ marginRight: 6 }}>
          Insert Row Below
        </button>
        <button onClick={insertColLeft} style={{ marginRight: 6 }}>
          Insert Col Left
        </button>
        <button onClick={insertColRight} style={{ marginRight: 12 }}>
          Insert Col Right
        </button>

        <button onClick={deleteRowAtSelection} style={{ marginRight: 6 }}>
          Delete Row
        </button>
        <button onClick={deleteColAtSelection} style={{ marginRight: 12 }}>
          Delete Col
        </button>

        <span style={{ marginLeft: 12, color: "#666" }}>
          Selection: {selection ? `${selection.startRow},${selection.startCol} → ${selection.endRow},${selection.endCol}` : 'none'}
        </span>
      </div>

      <div style={{ overflow: "auto", border: "1px solid #ccc" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>{rowsElems}</tbody>
        </table>
      </div>

      <div style={{ marginTop: 8, color: "#888", fontSize: 12 }}>
        Tip: drag to select, or click/click+shift. Use the toolbar to merge/split, or insert/delete rows/columns relative to the selection.
      </div>
    </div>
  );
}
