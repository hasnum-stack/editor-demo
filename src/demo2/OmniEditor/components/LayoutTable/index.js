import React, { useState, useEffect } from "react";
import { Space, Tooltip } from "antd";
import useSpreadsheet from "../../../../hooks/useSpreadsheet";
import CellWorkSpace from "./CellWorkSpace";
import styles from "./index.module.less";
import MERGE_SVG from "../../images/merge-cells.svg";
import SPLIT_SVG from "../../images/split-cells.svg";
import INSERT_ROW_ABOVE from "../../images/insert-row-above.svg";
import INSERT_ROW_BELOW from "../../images/insert-row-below.svg";
import INSERT_ROW_LEFT from "../../images/insert-row-left.svg";
import INSERT_ROW_RIGHT from "../../images/insert-row-right.svg";
import DELETE_ROW from "../../images/delete-row.svg";
import DELETE_COL from "../../images/delete-column.svg";

const LayoutTable = (props) => {
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
    rowCount,
    colCount,
  } = useSpreadsheet({
    rows: 2,
    cols: 2,
    cellRender: {
      Component: (cellProps) => (
        <CellWorkSpace
          {...props}
          {...cellProps}
          rowCount={rowCount}
          colCount={colCount}
        />
      ),
    },
  });

  console.log(data, "data");
  console.log(meta, "meta");
  return (
    <div className={styles.layoutTableWrapper}>
      <div style={{ overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>{rowsElems}</tbody>
        </table>
      </div>
      <div className={styles.actionsBtn}>
        <Space size='middle'>
          <Tooltip title="合并单元格">
            <img src={MERGE_SVG} onClick={mergeSelection} />
          </Tooltip>
          <Tooltip title="拆分单元格">
            <img src={SPLIT_SVG} onClick={splitSelection} />
          </Tooltip>
          <Tooltip title="上插入行">
            <img src={INSERT_ROW_ABOVE} onClick={insertRowAbove} />
          </Tooltip>
          <Tooltip title="下插入行">
            <img src={INSERT_ROW_BELOW} onClick={insertRowBelow} />
          </Tooltip>
          <Tooltip title="左插入列">
            <img src={INSERT_ROW_LEFT} onClick={insertColLeft} />
          </Tooltip>
          <Tooltip title="右插入列">
            <img src={INSERT_ROW_RIGHT} onClick={insertColRight} />
          </Tooltip>
          <Tooltip title="删除行">
            <img src={DELETE_ROW} onClick={deleteRowAtSelection} />
          </Tooltip>
          <Tooltip title="删除列">
            <img src={DELETE_COL} onClick={deleteColAtSelection} />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
};
export default LayoutTable;
