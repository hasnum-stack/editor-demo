import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Input } from "antd";
function coordKey(row, col) {
  return `${row},${col}`;
}

function parseKey(key) {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

// memoized Cell component — re-renders only when value/span/selection change
const Cell = React.memo(
  function Cell({
    row,
    col,
    spanRow,
    spanCol,
    value,
    isSelected,
    onMouseDown,
    onMouseEnter,
    onClick,
    onChange,
  }) {
    const cellKey = coordKey(row, col);
    console.log(value, "valuevalue");
    return (
      <td
        key={cellKey}
        rowSpan={spanRow}
        colSpan={spanCol}
        onMouseDown={(e) => onMouseDown && onMouseDown(e, row, col)}
        onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, row, col)}
        onClick={(e) => onClick && onClick(e, row, col)}
        style={{
          border: "1px solid #ddd",
          minWidth: 80,
          height: 28 * spanRow,
          padding: 4,
          verticalAlign: "top",
          background: isSelected ? "#d0e7ff" : "white",
        }}
      >
        <Input
          value={value}
          onChange={(e) => onChange(row, col, e.target.value)}
          bordered={false}
        />
      </td>
    );
  },
  (a, b) => {
    return (
      a.value === b.value &&
      a.isSelected === b.isSelected &&
      a.spanRow === b.spanRow &&
      a.spanCol === b.spanCol
    );
  },
);

export default function useSpreadSheet({ rows = 10, cols = 10 }) {
  const [rowCount, setRowCount] = useState(rows);
  const [colCount, setColCount] = useState(cols);
  const [data, setData] = useState({});
  const [meta, setMeta] = useState({});
  const [selection, setSelection] = useState(null);
  const selecting = useRef(false);
  const anchor = useRef(null);
  const metaRef = useRef(meta);
  const selectionRef = useRef(selection);

  // keep refs up-to-date so stable callbacks can read latest values
  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  function normalizeSel(a, b) {
    const startRow = Math.min(a.row, b.row);
    const endRow = Math.max(a.row, b.row);
    const startCol = Math.min(a.col, b.col);
    const endCol = Math.max(a.col, b.col);
    return { startRow, startCol, endRow, endCol };
  }

  // Expand a tentative selection so it fully contains any origin rectangles that intersect it.
  function expandSelectionToIncludeOrigins(tentative) {
    let { startRow, startCol, endRow, endCol } = tentative;
    // normalize
    if (startRow > endRow) [startRow, endRow] = [endRow, startRow];
    if (startCol > endCol) [startCol, endCol] = [endCol, startCol];

    for (let iter = 0; iter < 20; iter++) {
      let expanded = false;
      // scan global meta origins and expand to include any that intersect
      for (const metaKey of Object.keys(metaRef.current)) {
        const entry = metaRef.current[metaKey];
        if (!entry) continue;
        if (!(entry.rowSpan || entry.colSpan)) continue; // only origin entries
        const p = parseKey(metaKey);
        const oR = p.row;
        const oC = p.col;
        const oREnd = oR + (entry.rowSpan || 1) - 1;
        const oCEnd = oC + (entry.colSpan || 1) - 1;

        const intersects = !(
          oREnd < startRow ||
          oR > endRow ||
          oCEnd < startCol ||
          oC > endCol
        );
        if (!intersects) continue;

        if (oR < startRow) {
          startRow = oR;
          expanded = true;
        }
        if (oC < startCol) {
          startCol = oC;
          expanded = true;
        }
        if (oREnd > endRow) {
          endRow = oREnd;
          expanded = true;
        }
        if (oCEnd > endCol) {
          endCol = oCEnd;
          expanded = true;
        }
      }
      if (!expanded) break;
    }

    return { startRow, startCol, endRow, endCol };
  }

  function getOriginFor(row, col) {
    const cellKey = coordKey(row, col);
    const cellMeta = metaRef.current[cellKey];
    if (!cellMeta) return null;
    if (cellMeta.origin) return cellMeta.origin;
    return cellKey;
  }

  // stable setter for cell value by data key
  const setCellValue = useCallback((key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // stable event handlers (they read refs inside so they stay valid without changing identity)
  const handleCellMouseDown = useCallback((e, row, col) => {
    selecting.current = true;
    anchor.current = { row, col };
    const baseSel = { startRow: row, startCol: col, endRow: row, endCol: col };
    const expandedSel = expandSelectionToIncludeOrigins(baseSel);
    setSelection(expandedSel);
  }, []);

  const handleCellMouseEnter = useCallback((e, row, col) => {
    if (!selecting.current || !anchor.current) return;
    const tentative = normalizeSel(anchor.current, { row, col });
    const expanded = expandSelectionToIncludeOrigins(tentative);
    setSelection(expanded);
  }, []);

  const handleCellClick = useCallback((e, row, col) => {
    if (e.shiftKey && selectionRef.current) {
      const start = {
        row: selectionRef.current.startRow,
        col: selectionRef.current.startCol,
      };
      const sel = normalizeSel(start, { row, col });
      setSelection(sel);
    } else {
      setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
    }
  }, []);

  function onMouseUp() {
    selecting.current = false;
    anchor.current = null;
  }

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);

  // Merge selection into an origin cell
  function mergeSelection() {
    if (!selection) return;

    // start from current selection
    let { startRow, startCol, endRow, endCol } = selection;
    const initial = { startRow, startCol, endRow, endCol };

    // Iteratively expand selection to fully include any origin that intersects it.
    for (let iter = 0; iter < 20; iter++) {
      let expanded = false;

      // scan all origin entries in meta (entries with rowSpan/colSpan)
      Object.keys(meta).forEach((metaKey) => {
        const entry = meta[metaKey];
        if (!entry) return;
        if (!(entry.rowSpan || entry.colSpan)) return; // not an origin

        const p = parseKey(metaKey);
        const oR = p.row;
        const oC = p.col;
        const oREnd = oR + (entry.rowSpan || 1) - 1;
        const oCEnd = oC + (entry.colSpan || 1) - 1;

        // intersects current selection?
        const intersects = !(
          oREnd < startRow ||
          oR > endRow ||
          oCEnd < startCol ||
          oC > endCol
        );
        if (!intersects) return;

        // expand bounds to fully include the origin rect
        if (oR < startRow) {
          startRow = oR;
          expanded = true;
        }
        if (oC < startCol) {
          startCol = oC;
          expanded = true;
        }
        if (oREnd > endRow) {
          endRow = oREnd;
          expanded = true;
        }
        if (oCEnd > endCol) {
          endCol = oCEnd;
          expanded = true;
        }
      });

      if (!expanded) break;
    }

    // If selection expanded, update visible selection so user sees it
    if (
      startRow !== initial.startRow ||
      startCol !== initial.startCol ||
      endRow !== initial.endRow ||
      endCol !== initial.endCol
    ) {
      setSelection({ startRow, startCol, endRow, endCol });
    }

    const rowSpan = endRow - startRow + 1;
    const colSpan = endCol - startCol + 1;
    if (rowSpan === 1 && colSpan === 1) return;

    // Collect all origin keys whose origin rectangles are fully inside the (possibly expanded) selection
    const originsToMerge = new Set();
    Object.keys(meta).forEach((metaKey) => {
      const entry = meta[metaKey];
      if (!entry || !(entry.rowSpan || entry.colSpan)) return;
      const p = parseKey(metaKey);
      const oR = p.row;
      const oC = p.col;
      const oREnd = oR + (entry.rowSpan || 1) - 1;
      const oCEnd = oC + (entry.colSpan || 1) - 1;
      const fullyInside =
        oR >= startRow && oREnd <= endRow && oC >= startCol && oCEnd <= endCol;
      if (fullyInside) originsToMerge.add(metaKey);
    });

    // Also include any origins referenced by covered cells inside the selection (defensive)
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const ck = coordKey(r, c);
        const cm = meta[ck];
        if (cm && cm.origin) originsToMerge.add(cm.origin);
      }
    }

    // Build originalContents mapping: prefer origin.originalContents if available, otherwise fallback to data at origin
    const originalContentsMap = {};
    originsToMerge.forEach((originKey) => {
      const originMeta = meta[originKey] || {};
      if (originMeta.originalContents) {
        Object.entries(originMeta.originalContents).forEach(
          ([cellK, content]) => {
            originalContentsMap[cellK] = content;
          },
        );
      } else {
        if (data[originKey] !== undefined)
          originalContentsMap[originKey] = data[originKey];
      }
    });

    // Collect standalone data cells inside selection (override if necessary)
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const k = coordKey(r, c);
        // only add standalone data cells if we don't already have original content
        if (data[k] !== undefined && originalContentsMap[k] === undefined)
          originalContentsMap[k] = data[k];
      }
    }

    // Build merged content in row-major order
    const mergedContentList = [];
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const k = coordKey(r, c);
        if (originalContentsMap[k] !== undefined)
          mergedContentList.push(originalContentsMap[k]);
      }
    }

    const newOriginKey = coordKey(startRow, startCol);

    // Update meta: remove merged origins and their covered refs, then set new origin and covered refs
    setMeta((prev) => {
      const next = { ...prev };

      // remove old origins and their covered pointers inside selection
      originsToMerge.forEach((ok) => {
        const om = next[ok] || {};
        const p = parseKey(ok);
        const or = p.row;
        const oc = p.col;
        const ors = om.rowSpan || 1;
        const ocs = om.colSpan || 1;
        for (let rr = or; rr < or + ors; rr++) {
          for (let cc = oc; cc < oc + ocs; cc++) {
            const covered = coordKey(rr, cc);
            if (next[covered] && next[covered].origin === ok)
              delete next[covered];
          }
        }
        delete next[ok];
      });

      // set new origin with originalContents map for potential split
      next[newOriginKey] = {
        rowSpan,
        colSpan,
        originalContents: originalContentsMap,
      };

      // mark covered cells
      for (let rr = startRow; rr <= endRow; rr++) {
        for (let cc = startCol; cc <= endCol; cc++) {
          const covered = coordKey(rr, cc);
          if (covered === newOriginKey) continue;
          next[covered] = { origin: newOriginKey };
        }
      }

      return next;
    });

    // Update data: write merged content to the new origin and delete other data in selection
    setData((prev) => {
      const next = { ...prev };
      next[newOriginKey] =
        mergedContentList.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {mergedContentList.map((content, idx) => (
              <div key={idx}>{content}</div>
            ))}
          </div>
        ) : (
          ""
        );

      for (let rr = startRow; rr <= endRow; rr++) {
        for (let cc = startCol; cc <= endCol; cc++) {
          const k = coordKey(rr, cc);
          if (k !== newOriginKey) delete next[k];
        }
      }

      return next;
    });
  }

  // 拆分合并单元格：还原原始内容到各自位置
  function splitSelection() {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const toSplit = [];

    // 找到需要拆分的合并单元格
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const key = coordKey(r, c);
        const cellMeta = meta[key];
        if (cellMeta && (cellMeta.rowSpan || cellMeta.colSpan)) {
          toSplit.push({
            ...parseKey(key),
            key,
            rowSpan: cellMeta.rowSpan,
            colSpan: cellMeta.colSpan,
            originalContents: cellMeta.originalContents,
          });
        }
      }
    }

    // 处理单个单元格属于合并区域的情况
    if (toSplit.length === 0 && startRow === endRow && startCol === endCol) {
      const key = coordKey(startRow, startCol);
      const cellMeta = meta[key];
      if (cellMeta && cellMeta.origin) {
        const originMeta = meta[cellMeta.origin];
        if (originMeta && (originMeta.rowSpan || originMeta.colSpan)) {
          toSplit.push({
            key: cellMeta.origin,
            ...parseKey(cellMeta.origin),
            rowSpan: originMeta.rowSpan,
            colSpan: originMeta.colSpan,
            originalContents: originMeta.originalContents,
          });
        }
      }
    }

    if (toSplit.length === 0) return;

    // 清除合并元数据
    setMeta((prev) => {
      const next = { ...prev };
      toSplit.forEach((entry) => {
        const { row, col, rowSpan, colSpan, key } = entry;
        delete next[key];
        for (let r2 = row; r2 < row + rowSpan; r2++) {
          for (let c2 = col; c2 < col + colSpan; c2++) {
            const coveredKey = coordKey(r2, c2);
            if (next[coveredKey] && next[coveredKey].origin === key) {
              delete next[coveredKey];
            }
          }
        }
      });
      return next;
    });

    // 还原原始内容
    setData((prev) => {
      const next = { ...prev };
      toSplit.forEach((entry) => {
        const { key, originalContents } = entry;
        delete next[key]; // 删除合并后的整合内容

        // 按原始映射还原内容
        if (originalContents) {
          Object.entries(originalContents).forEach(([cellKey, content]) => {
            next[cellKey] = content;
          });
        }
      });
      return next;
    });
  }

  // 插入行
  function insertRow(at) {
    if (at < 0) at = 0;
    if (at > rowCount) at = rowCount;

    const newData = {};
    const newMeta = {};

    const origins = [];
    Object.keys(meta).forEach((metaKey) => {
      const entry = meta[metaKey];
      const parsed = parseKey(metaKey);
      if (entry && (entry.rowSpan || entry.colSpan)) {
        origins.push({
          row: parsed.row,
          col: parsed.col,
          rowSpan: entry.rowSpan || 1,
          colSpan: entry.colSpan || 1,
          originalContents: entry.originalContents,
          key: metaKey,
        });
      }
    });

    origins.forEach((origin) => {
      let {
        row: originRow,
        col: originCol,
        rowSpan: rs,
        colSpan: cs,
        originalContents,
      } = origin;
      const newOriginRow = originRow >= at ? originRow + 1 : originRow;
      if (originRow < at && originRow + rs - 1 >= at) rs += 1;
      const newKey = coordKey(newOriginRow, originCol);
      newMeta[newKey] = { rowSpan: rs, colSpan: cs, originalContents };

      const oldDataKey = coordKey(originRow, originCol);
      if (data[oldDataKey] !== undefined) newData[newKey] = data[oldDataKey];
    });

    Object.keys(newMeta).forEach((originKey) => {
      const originMeta = newMeta[originKey];
      const parsedOrigin = parseKey(originKey);
      for (
        let r2 = parsedOrigin.row;
        r2 < parsedOrigin.row + originMeta.rowSpan;
        r2++
      ) {
        for (
          let c2 = parsedOrigin.col;
          c2 < parsedOrigin.col + originMeta.colSpan;
          c2++
        ) {
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
      const isOrigin = origins.some((o) => o.row === row && o.col === col);
      if (isOrigin) return;
      const newR = row >= at ? row + 1 : row;
      const newK = coordKey(newR, col);
      if (newData[newK] === undefined) newData[newK] = data[dataKey];
    });

    Object.keys(meta).forEach((metaKey) => {
      const parsed = parseKey(metaKey);
      const row = parsed.row;
      const col = parsed.col;
      const cellMeta = meta[metaKey];
      if (cellMeta && cellMeta.origin) {
        const originParsed = parseKey(cellMeta.origin);
        const originNewR =
          originParsed.row >= at ? originParsed.row + 1 : originParsed.row;
        const newR = row >= at ? row + 1 : row;
        const newK = coordKey(newR, col);
        if (!newMeta[newK])
          newMeta[newK] = { origin: coordKey(originNewR, originParsed.col) };
      }
    });

    setData(newData);
    setMeta(newMeta);
    setRowCount((prev) => prev + 1);

    if (selection) {
      const { startRow: sr, endRow: er, startCol, endCol } = selection;
      const newSr = sr >= at ? sr + 1 : sr;
      const newEr = er >= at ? er + 1 : er;
      setSelection({ startRow: newSr, endRow: newEr, startCol, endCol });
    }
  }

  // 插入列
  function insertCol(at) {
    if (at < 0) at = 0;
    if (at > colCount) at = colCount;

    const newData = {};
    const newMeta = {};

    const origins = [];
    Object.keys(meta).forEach((metaKey) => {
      const entry = meta[metaKey];
      const parsed = parseKey(metaKey);
      if (entry && (entry.rowSpan || entry.colSpan)) {
        origins.push({
          row: parsed.row,
          col: parsed.col,
          rowSpan: entry.rowSpan || 1,
          colSpan: entry.colSpan || 1,
          originalContents: entry.originalContents,
          key: metaKey,
        });
      }
    });

    origins.forEach((origin) => {
      let {
        row: originRow,
        col: originCol,
        rowSpan: rs,
        colSpan: cs,
        originalContents,
      } = origin;
      const newOriginCol = originCol >= at ? originCol + 1 : originCol;
      if (originCol < at && originCol + cs - 1 >= at) cs += 1;
      const newKey = coordKey(originRow, newOriginCol);
      newMeta[newKey] = { rowSpan: rs, colSpan: cs, originalContents };

      const oldDataKey = coordKey(originRow, originCol);
      if (data[oldDataKey] !== undefined) newData[newKey] = data[oldDataKey];
    });

    Object.keys(newMeta).forEach((originKey) => {
      const originMeta = newMeta[originKey];
      const parsedOrigin = parseKey(originKey);
      for (
        let r2 = parsedOrigin.row;
        r2 < parsedOrigin.row + originMeta.rowSpan;
        r2++
      ) {
        for (
          let c2 = parsedOrigin.col;
          c2 < parsedOrigin.col + originMeta.colSpan;
          c2++
        ) {
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
      const isOrigin = origins.some((o) => o.row === row && o.col === col);
      if (isOrigin) return;
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
        const originNewC =
          originParsed.col >= at ? originParsed.col + 1 : originParsed.col;
        const newC = col >= at ? col + 1 : col;
        const newK = coordKey(row, newC);
        if (!newMeta[newK])
          newMeta[newK] = { origin: coordKey(originParsed.row, originNewC) };
      }
    });

    setData(newData);
    setMeta(newMeta);
    setColCount((prev) => prev + 1);

    if (selection) {
      const { startRow, endRow, startCol: sc, endCol: ec } = selection;
      const newSc = sc >= at ? sc + 1 : sc;
      const newEc = ec >= at ? ec + 1 : ec;
      setSelection({ startRow, endRow, startCol: newSc, endCol: newEc });
    }
  }

  // 删除行
  function deleteRow(at) {
    if (rowCount <= 1) return;
    if (at < 0) at = 0;
    if (at >= rowCount) at = rowCount - 1;

    // If the deleted row intersects any merged origin, block deletion
    for (const metaKey of Object.keys(meta)) {
      const entry = meta[metaKey];
      if (entry && (entry.rowSpan || entry.colSpan)) {
        const p = parseKey(metaKey);
        const oR = p.row;
        const oREnd = oR + (entry.rowSpan || 1) - 1;
        if (oR <= at && oREnd >= at) {
          alert("无法删除：所选行包含合并单元格。请先拆分或调整合并区域。");
          return;
        }
      }
    }

    const clearedMeta = { ...meta };
    Object.keys(meta).forEach((metaKey) => {
      const metaEntry = meta[metaKey];
      if (metaEntry && (metaEntry.rowSpan || metaEntry.colSpan)) {
        const parsed = parseKey(metaKey);
        const rs = metaEntry.rowSpan || 1;
        if (parsed.row <= at && parsed.row + rs - 1 >= at) {
          delete clearedMeta[metaKey];
          for (let r2 = parsed.row; r2 < parsed.row + rs; r2++) {
            for (
              let c2 = parsed.col;
              c2 < parsed.col + (metaEntry.colSpan || 1);
              c2++
            ) {
              const kk = coordKey(r2, c2);
              if (clearedMeta[kk] && clearedMeta[kk].origin === metaKey)
                delete clearedMeta[kk];
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
        const originNewR =
          oldOrigin.row > at ? oldOrigin.row - 1 : oldOrigin.row;
        metaEntry.origin = coordKey(originNewR, oldOrigin.col);
      }
    });

    setData(newData);
    setMeta(newMeta);
    setRowCount((prev) => prev - 1);

    if (selection) {
      let { startRow: sr, endRow: er, startCol, endCol } = selection;
      if (sr > at) sr -= 1;
      if (er > at) er -= 1;
      if (sr > er) sr = er;
      setSelection({ startRow: sr, endRow: er, startCol, endCol });
    }
  }

  // 删除列
  function deleteCol(at) {
    if (colCount <= 1) return;
    if (at < 0) at = 0;
    if (at >= colCount) at = colCount - 1;
    // If the deleted column intersects any merged origin, block deletion
    for (const metaKey of Object.keys(meta)) {
      const entry = meta[metaKey];
      if (entry && (entry.rowSpan || entry.colSpan)) {
        const p = parseKey(metaKey);
        const oC = p.col;
        const oCEnd = oC + (entry.colSpan || 1) - 1;
        if (oC <= at && oCEnd >= at) {
          alert("无法删除：所选列包含合并单元格。请先拆分或调整合并区域。");
          return;
        }
      }
    }

    // No intersecting merged origins — perform column removal by shifting columns left
    const clearedMeta = { ...meta };
    Object.keys(meta).forEach((metaKey) => {
      const metaEntry = meta[metaKey];
      if (metaEntry && (metaEntry.rowSpan || metaEntry.colSpan)) {
        const parsed = parseKey(metaKey);
        const cs = metaEntry.colSpan || 1;
        if (parsed.col <= at && parsed.col + cs - 1 >= at) {
          // should not happen because we blocked intersections, but keep defensive cleanup
          delete clearedMeta[metaKey];
          for (
            let r2 = parsed.row;
            r2 < parsed.row + (metaEntry.rowSpan || 1);
            r2++
          ) {
            for (let c2 = parsed.col; c2 < parsed.col + cs; c2++) {
              const kk = coordKey(r2, c2);
              if (clearedMeta[kk] && clearedMeta[kk].origin === metaKey)
                delete clearedMeta[kk];
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
        const originNewC =
          oldOrigin.col > at ? oldOrigin.col - 1 : oldOrigin.col;
        metaEntry.origin = coordKey(oldOrigin.row, originNewC);
      }
    });

    setData(newData);
    setMeta(newMeta);
    setColCount((prev) => prev - 1);

    if (selection) {
      let { startRow, endRow, startCol: sc, endCol: ec } = selection;
      if (sc > at) sc -= 1;
      if (ec > at) ec -= 1;
      if (sc > ec) sc = ec;
      setSelection({ startRow, endRow, startCol: sc, endCol: ec });
    }
  }

  // 工具栏辅助函数
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

  // 渲染单元格
  function renderCell(row, col) {
    const cellKey = coordKey(row, col);
    const cellMeta = meta[cellKey];
    if (cellMeta && cellMeta.origin) return null;

    const spanRow = cellMeta?.rowSpan || 1;
    const spanCol = cellMeta?.colSpan || 1;

    const isSelected =
      selection &&
      row >= selection.startRow &&
      row <= selection.endRow &&
      col >= selection.startCol &&
      col <= selection.endCol;

    const valueKey = getOriginFor(row, col) || cellKey;
    const value = data[valueKey] || "";
    // console.log(data, "datadatadatadata");
    // console.log(valueKey, "valueKeyvalueKeyvalueKey");
    return (
      <Cell
        key={cellKey}
        row={row}
        col={col}
        spanRow={spanRow}
        spanCol={spanCol}
        value={value}
        isSelected={isSelected}
        onMouseDown={handleCellMouseDown}
        onMouseEnter={handleCellMouseEnter}
        onClick={handleCellClick}
        onChange={(row, col, newValue) => {
          const k = getOriginFor(row, col) || coordKey(row, col);
          setData((data) => {
            return {
              ...data,
              [k]: newValue,
            };
          });
        }}
      />
    );
  }

  // 构建表格行
  const rowsElems = [];
  for (let row = 0; row < rowCount; row++) {
    const tds = [];
    for (let col = 0; col < colCount; col++) {
      const cell = renderCell(row, col);
      if (cell) tds.push(cell);
    }
    rowsElems.push(
      <tr key={row} style={{ height: 50 }}>
        {tds}
      </tr>,
    );
  }

  return {
    rowsElems,
    mergeSelection,
    splitSelection,
    insertRowAbove,
    insertRowBelow,
    insertColLeft,
    insertColRight,
    deleteRowAtSelection,
    deleteColAtSelection,
    selection,
    data,
    meta,
    setData,
  };
}
