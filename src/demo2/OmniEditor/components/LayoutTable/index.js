import React from "react";
import useSpreadsheet from "../../../../hooks/useSpreadsheet";
import { Input } from "antd";
import CellWorkSpace from "./CellWorkSpace";

// Default cell renderer: uses hook-provided value and setValue to update a single cell
function DefaultCellRenderer({ value, onChange }) {
  console.log(value, "value");
  return (
    <Input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      bordered={false}
    />
  );
}

const LayoutTable = (props) => {
    console.log("===LayoutTable=========",props);
  const {
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
  } = useSpreadsheet({
    rows: 2,
    cols: 2,
    cellRender: {
      Component: CellWorkSpace,
    },
  });

  console.log(data, "data");
  console.log(meta, "meta");
  return (
    <div>
      <div>
        <button onClick={mergeSelection}>Merge</button>
        <button onClick={splitSelection}>Split</button>
        <button
          onClick={() => {
            const metaSummary = {};
            Object.keys(meta).forEach((k) => {
              const m = meta[k];
              metaSummary[k] = {
                origin: m.origin || null,
                rowSpan: m.rowSpan || null,
                colSpan: m.colSpan || null,
                hasOriginalContents: !!m.originalContents,
              };
            });
            const dataKeys = Object.keys(data);
            console.log({ selection, metaSummary, dataKeys });
            alert("State dumped to console (open devtools).");
          }}
        >
          Dump state
        </button>

        <button onClick={insertRowAbove}>Insert Row Above</button>
        <button onClick={insertRowBelow}>Insert Row Below</button>
        <button onClick={insertColLeft}>Insert Col Left</button>
        <button onClick={insertColRight}>Insert Col Right</button>

        <button onClick={deleteRowAtSelection}>Delete Row</button>
        <button onClick={deleteColAtSelection}>Delete Col</button>

        <span>
          Selection:{" "}
          {selection
            ? `${selection.startRow},${selection.startCol} → ${selection.endRow},${selection.endCol}`
            : "none"}
        </span>
      </div>

      <div style={{ overflow: "auto", border: "1px solid #ccc" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>{rowsElems}</tbody>
        </table>
      </div>

      <div style={{ marginTop: 8, color: "#888", fontSize: 12 }}>
        Tip: 拖拽选择区域，使用工具栏合并/拆分单元格，或插入/删除行列
      </div>
    </div>
  );
};
export default LayoutTable;
