import { create } from "zustand";
import { produce } from "immer";

const useGridStore = create((set) => ({
  rowData: [],
  originalRowData: [], // 데이터 초기 상태 저장

  // 초기 데이터 설정
  setRowData: (data) =>
    set({
      rowData: data.map((row) => ({ ...row, isNew: false, isDirty: false })),
      originalRowData: JSON.parse(JSON.stringify(data)), // 깊은 복사로 원본 저장
    }),

  // 행 추가
  addRow: (newRow) =>
    set(
      produce((state) => {
        state.rowData.unshift({ ...newRow, isNew: true, isDirty: false });
      })
    ),

  // 행 데이터 업데이트
  // store/gridStore.js

updateRowData: (rowIndex, colId, value) =>
  set(
    produce((state) => {
      const row = state.rowData[rowIndex];
      if (row) {
        row[colId] = value;
        // 새로 추가된 행이 아닌 경우에만 isDirty 플래그 설정
        if (!row.isNew) {
          row.isDirty = true;
          // saveFlag가 'I'(Insert)가 아니면 'U'(Update)로 설정
         // if (row.saveFlag !== "I") {
            row.saveFlag = "U";
        // }
        }
      }
    })
  ),

  // 변경된 데이터만 필터링하여 반환
  getChangedRows: () => {
    const { rowData } = useGridStore.getState();
    return rowData.filter((row) => row.isNew || row.isDirty);
  },
}));

export default useGridStore;
