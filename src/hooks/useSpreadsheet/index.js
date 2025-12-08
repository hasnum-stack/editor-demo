import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useReducer,
  useMemo,
} from "react";

import { spreadsheetReducer, createInitialSpreadsheetState } from './reducer';

function coordKey(row, col) {
  return `${row},${col}`;
}

function parseKey(key) {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

// simple Cell component — use a plain function so it always re-renders with latest props
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
  children,
  bgColor,
}) {
  const cellKey = coordKey(row, col);

  return (
    <td
      data-value={value}
      key={cellKey}
      rowSpan={spanRow}
      colSpan={spanCol}
      onMouseDown={(e) => onMouseDown && onMouseDown(e, row, col)}
      onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, row, col)}
      onClick={(e) => onClick && onClick(e, row, col)}
      style={{
        border: "1px solid #ddd",
        minWidth: 80,
        minHeight: 31 * spanRow,
        padding: 4,
        verticalAlign: "middle",
        background: isSelected ? "#d0e7ff" : (bgColor || "#fff"),
      }}
    >
      {children}
    </td>
  );
}

function NullComponent() {
  return null;
}
const initializeState = ({ initialRows, initialCols, initialValue }) => {
  // 如果有受控的初始值，直接用它
  if (initialValue) {
    return {
      rows: initialValue.rows || initialRows,
      cols: initialValue.cols || initialCols,
      data: initialValue.data || {},
      meta: initialValue.meta || {},
    };
  }
  // 否则，用 props 里的 rows 和 cols 创建一个空表
  return {
    rows: initialRows,
    cols: initialCols,
    data: {},
    meta: {},
  };
};
export default function useSpreadSheet({
  rows = 2,
  cols = 2,
  cellRender = {},
  bgColor,
  // 受控模式的 props
  value: controlledValue,
  onChange,
}) {
  const { Component: CellComponent = NullComponent } = cellRender;

  // ==================== 核心状态管理 (统一到 useReducer) ====================

  // 1. 使用 useReducer，并提供一个完整的初始状态，包含 rows 和 cols
  const [internalState, dispatch] = useReducer(
    spreadsheetReducer,
    {
      initialRows: rows,
      initialCols: cols,
      initialValue: controlledValue,
    },
    initializeState // 这是初始化函数
  );

  // 2. 判断逻辑保持不变
  const state = controlledValue !== undefined ? controlledValue : internalState;
  const isControlled = controlledValue !== undefined;

  // 3. 解构逻辑保持不变
  const { data, meta, rows: currentRows, cols: currentCols } = state;

  // bump this to force consumer to remount table body when structural changes occur
  const [tableVersion, setTableVersion] = useState(0);
  const [selection, setSelection] = useState(null);
  const selecting = useRef(false);
  const anchor = useRef(null);

  // 为了在回调中能访问到最新的值，使用 ref
  const metaRef = useRef(meta);
  const selectionRef = useRef(selection);
  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const wrappedDispatch = useCallback((action) => {
    // 在 action 的 payload 里附加上当前最新的 state，供 reducer 使用
    const actionWithState = {
      ...action,
      payload: {
        ...action.payload,
        data: state.data,
        meta: state.meta,
      },
    };

    if (isControlled && onChange) {
      // 受控模式：计算出 newState，然后调用 onChange
      const newState = spreadsheetReducer(state, actionWithState);
      onChange(newState);
    } else {
      // 非受控模式：直接 dispatch
      dispatch(actionWithState);
    }
  }, [isControlled, onChange, state]);

  const setData = useCallback((updater) => {
    wrappedDispatch({ type: 'SET_DATA', payload: { updater } });
  }, [wrappedDispatch]);

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
    // read from current meta state (not the ref) so renders immediately after setMeta see updated origins
    const cellMeta = meta[cellKey];
    if (!cellMeta) return null;
    if (cellMeta.origin) return cellMeta.origin;
    return cellKey;
  }

  // stable event handlers (they read refs inside so they stay valid without changing identity)
  const handleCellMouseDown = useCallback((e, row, col) => {
    e.stopPropagation();
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
    wrappedDispatch({
      type: 'MERGE_SELECTION',
      payload: {
        selection,
        // 把 reducer 需要的辅助函数也传过去
        parseKey,
        coordKey,
      },
    });
    // 确保消费者可以重新挂载输入
    setTableVersion((v) => v + 1);
  }

  // 拆分合并单元格：还原原始内容到各自位置
  function splitSelection() {
    wrappedDispatch({
      type: 'SPLIT_SELECTION',
      payload: {
        selection,
        // 把 reducer 需要的辅助函数和当前状态传过去
        parseKey,
        coordKey,
      },
    });

    // 这些 side effect 仍然保留在 hook 里
    // force a no-op selection update to ensure a re-render
    setSelection((s) => (s ? { ...s } : s));
    // bump tableVersion so consumers can remount the table body
    setTableVersion((v) => v + 1);
  }

  // 插入行
  const insertRow = useCallback((at) => {
    wrappedDispatch({
      type: 'INSERT_ROW',
      payload: { at },
    });
  }, [wrappedDispatch]);

  // 插入列
  const insertCol = useCallback((at) => {
    wrappedDispatch({
      type: 'INSERT_COL',
      payload: { at },
    });
  }, [wrappedDispatch]);

  // 删除行
  function deleteRow(at) {

  }

  // 删除列
  function deleteCol(at) {

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

  // 绝对顶部加一行
  function insertRowTop() {
    insertRow(0);
    setTableVersion((v) => v + 1);
  }

  // 当前位置往上加
  function insertRowAbove() {
    if (!selection) return;
    insertRow(selection.startRow);
    setTableVersion((v) => v + 1);
  }

  function insertRowBelow() {
    if (!selection) return;
    insertRow(selection.endRow + 1);
    setTableVersion((v) => v + 1);
  }

  function insertColLeft() {
    if (!selection) return;
    insertCol(selection.startCol);
    setTableVersion((v) => v + 1);
  }

  // 最右侧添加一列
  function insertColEnd() {
    insertCol(currentCols + 1);
    setTableVersion((v) => v + 1);
  }
  
  function insertColRight() {
    if (!selection) return;
    insertCol(selection.endCol + 1);
    setTableVersion((v) => v + 1);
  }

  // 【新】删除当前行 (基于选区的起始行)
  function deleteCurrentRow() {
    if (!selection) return;
    wrappedDispatch({
      type: 'DELETE_ROWS',
      payload: { startRow: selection.startRow, endRow: selection.startRow },
    });
    setTableVersion((v) => v + 1);
  }

  // 【新】删除当前列 (基于选区的起始列)
  function deleteCurrentCol() {
    if (!selection) return;
    wrappedDispatch({
      type: 'DELETE_COLS',
      payload: { startCol: selection.startCol, endCol: selection.startCol },
    });
    setTableVersion((v) => v + 1);
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
        bgColor={bgColor}
      >
        <CellComponent
          cellKey={cellKey}
          value={value}
          onChange={(value) => {
            const k = getOriginFor(row, col) || coordKey(row, col);
            setData((data) => {
              return {
                ...data,
                [k]: value,
              };
            });
          }}
        />
      </Cell>
    );
  }

  // 构建表格行
  const rowsElems = useMemo(() => {
    const elems = [];
    for (let row = 0; row < currentRows; row++) {
      const tds = [];
      for (let col = 0; col < currentCols; col++) {
        const cell = renderCell(row, col);
        if (cell) tds.push(cell);
      }
      elems.push(
        <tr key={row} style={{ height: 31 }}>
          {tds}
        </tr>,
      );
    }
    return elems;
  }, [currentRows, currentCols, renderCell]);

  return {
    rowsElems,
    mergeSelection,
    splitSelection,
    insertRowTop,
    insertRowAbove,
    insertRowBelow,
    insertColLeft,
    insertColEnd,
    insertColRight,
    deleteRowAtSelection,
    deleteColAtSelection,
    selection,
    data,
    meta,
    tableVersion,
    rows: currentRows,
    cols: currentCols,
    deleteCurrentRow,
    deleteCurrentCol,
  };
}
