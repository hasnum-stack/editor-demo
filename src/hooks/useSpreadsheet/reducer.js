// 初始状态工厂函数
export const createInitialSpreadsheetState = ({ rows = 2, cols = 2 }) => ({
  rows,
  cols,
  data: {},
  meta: {},
});

// 辅助函数：更新 key
function updateKeysInObject(obj, rowDelta, colDelta, startRow, startCol) {
  if (!obj) return obj;
  const newObj = {};
  for (const key in obj) {
    const [r, c] = key.split(',').map(Number);
    let newRow = r;
    let newCol = c;

    if (r >= startRow) newRow += rowDelta;
    if (c >= startCol) newCol += colDelta;

    newObj[`${newRow},${newCol}`] = obj[key];
  }
  return newObj;
}

// 辅助函数：删除指定行/列的 key
function deleteKeysInObject(obj, rowsToDelete, colsToDelete) {
  if (!obj) return obj;
  const newObj = {};
  for (const key in obj) {
    const [r, c] = key.split(',').map(Number);
    if (rowsToDelete.has(r) || colsToDelete.has(c)) {
      continue; // 跳过要删除的行或列
    }

    // 计算新的行列号
    const newRow = r - Array.from(rowsToDelete).filter(delRow => delRow < r).length;
    const newCol = c - Array.from(colsToDelete).filter(delCol => delCol < c).length;

    newObj[`${newRow},${newCol}`] = obj[key];
  }
  return newObj;
}


export function spreadsheetReducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    case 'SET_DATA': {
      const { updater } = payload;
      // updater 可能是一个函数，也可能是一个直接的值
      const newData = typeof updater === 'function' ? updater(state.data) : updater;
      return {
        ...state,
        data: newData,
      };
    }

    case 'MERGE_SELECTION': {
      const { selection, parseKey, coordKey } = payload;
      const { data, meta } = state;

      if (!selection) return state;

      let { startRow, startCol, endRow, endCol } = selection;
      const initial = { startRow, startCol, endRow, endCol };

      for (let iter = 0; iter < 20; iter++) {
        let expanded = false;
        Object.keys(meta).forEach((metaKey) => {
          const entry = meta[metaKey];
          if (!entry || !(entry.rowSpan || entry.colSpan)) return;

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
          if (!intersects) return;

          if (oR < startRow) { startRow = oR; expanded = true; }
          if (oC < startCol) { startCol = oC; expanded = true; }
          if (oREnd > endRow) { endRow = oREnd; expanded = true; }
          if (oCEnd > endCol) { endCol = oCEnd; expanded = true; }
        });
        if (!expanded) break;
      }

      const rowSpan = endRow - startRow + 1;
      const colSpan = endCol - startCol + 1;
      if (rowSpan === 1 && colSpan === 1) return state;

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

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const k = coordKey(r, c);
          if (data[k] !== undefined && originalContentsMap[k] === undefined)
            originalContentsMap[k] = data[k];
        }
      }

      const mergedContentList = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const k = coordKey(r, c);
          if (originalContentsMap[k] !== undefined)
            mergedContentList.push(originalContentsMap[k]);
        }
      }

      const newOriginKey = coordKey(startRow, startCol);

      const nextMeta = { ...meta };
      originsToMerge.forEach((ok) => {
        const om = nextMeta[ok] || {};
        const p = parseKey(ok);
        const or = p.row;
        const oc = p.col;
        const ors = om.rowSpan || 1;
        const ocs = om.colSpan || 1;
        for (let rr = or; rr < or + ors; rr++) {
          for (let cc = oc; cc < oc + ocs; cc++) {
            const covered = coordKey(rr, cc);
            if (nextMeta[covered] && nextMeta[covered].origin === ok)
              delete nextMeta[covered];
          }
        }
        delete nextMeta[ok];
      });

      nextMeta[newOriginKey] = {
        rowSpan,
        colSpan,
        originalContents: originalContentsMap,
      };

      for (let rr = startRow; rr <= endRow; rr++) {
        for (let cc = startCol; cc <= endCol; cc++) {
          const covered = coordKey(rr, cc);
          if (covered === newOriginKey) continue;
          nextMeta[covered] = { origin: newOriginKey };
        }
      }

      const nextData = { ...data };
      nextData[newOriginKey] =
        mergedContentList.length > 0 ? mergedContentList.join() : "";

      for (let rr = startRow; rr <= endRow; rr++) {
        for (let cc = startCol; cc <= endCol; cc++) {
          const k = coordKey(rr, cc);
          if (k !== newOriginKey) delete nextData[k];
        }
      }

      return {
        ...state,
        meta: nextMeta,
        data: nextData,
      };
    }

    case 'SPLIT_SELECTION': {
      const { selection, parseKey, coordKey } = payload;
      const { data, meta } = state;
      if (!selection) return state;
      const { startRow, startCol, endRow, endCol } = selection;
      const toSplit = [];

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

      if (toSplit.length === 0) return state;

      const nextMeta = { ...meta };
      const nextData = { ...data };

      toSplit.forEach((entry) => {
        const { row, col, rowSpan, colSpan, key, originalContents } = entry;
        if (nextMeta[key]) delete nextMeta[key];
        for (let r2 = row; r2 < row + rowSpan; r2++) {
          for (let c2 = col; c2 < col + colSpan; c2++) {
            const coveredKey = coordKey(r2, c2);
            if (nextMeta[coveredKey] && nextMeta[coveredKey].origin === key) {
              delete nextMeta[coveredKey];
            }
          }
        }
        if (nextData[key] !== undefined) delete nextData[key];
        if (originalContents) {
          Object.entries(originalContents).forEach(([cellKey, content]) => {
            nextData[cellKey] = content;
          });
        }
      });
      return {
        ...state,
        meta: nextMeta,
        data: nextData,
      };
    }

    // ==================== 行操作 ====================
    case 'INSERT_ROW': {
      const { at } = action.payload;
      const { data, meta, rows, cols } = state;
      const newData = updateKeysInObject(data, 1, 0, at, 0);
      const newMeta = updateKeysInObject(meta, 1, 0, at, 0);
      return {
        ...state,
        rows: rows + 1,
        data: newData,
        meta: newMeta,
      };
    }

    case 'DELETE_ROWS': {
      const { startRow, endRow } = action.payload;
      const { data, meta, rows, cols } = state;
      const rowsToDelete = new Set();
      for (let r = startRow; r <= endRow; r++) {
        rowsToDelete.add(r);
      }
      const newData = deleteKeysInObject(data, rowsToDelete, new Set());
      const newMeta = deleteKeysInObject(meta, rowsToDelete, new Set());

      return {
        ...state,
        rows: rows - (endRow - startRow + 1),
        data: newData,
        meta: newMeta,
      };
    }

    // ==================== 列操作 ====================
    case 'INSERT_COL': {
      const { at } = action.payload;
      const { data, meta, rows, cols } = state;
      const newData = updateKeysInObject(data, 0, 1, 0, at);
      const newMeta = updateKeysInObject(meta, 0, 1, 0, at);
      return {
        ...state,
        cols: cols + 1,
        data: newData,
        meta: newMeta,
      };
    }

    case 'DELETE_COLS': {
      const { startCol, endCol } = action.payload;
      const { data, meta, rows, cols } = state;

      const colsToDelete = new Set();
      for (let c = startCol; c <= endCol; c++) {
        colsToDelete.add(c);
      }

      const newData = deleteKeysInObject(data, new Set(), colsToDelete);
      const newMeta = deleteKeysInObject(meta, new Set(), colsToDelete);

      return {
        ...state,
        cols: cols - (endCol - startCol + 1),
        data: newData,
        meta: newMeta,
      };
    }

    default:
      return state;
  }
}

