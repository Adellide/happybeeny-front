import React, { useMemo, useCallback, useEffect } from "react";
import { Card, Button, Space, message } from "antd";
import { AgGridReact } from "ag-grid-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import useGridStore from "../store/gridStore";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

/**
 * Mock API 함수
 */
const fetchGridData = async () => {
  // 실제 API URL로 교체하세요.
  // const { data } = await axios.get("/api/grid-data");
  // 아래는 목업 데이터입니다.
  await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 시뮬레이션
  return [
    { id: 1, name: "John Doe", role: "Admin", active: true },
    { id: 2, name: "Jane Smith", role: "User", active: false },
    { id: 3, name: "Peter Jones", role: "Guest", active: true },
  ];
};

const fetchRoleOptions = async () => {
  // 실제 API URL로 교체하세요.
  // const { data } = await axios.get("/api/roles");
  await new Promise((resolve) => setTimeout(resolve, 300)); // 로딩 시뮬레이션
  // API에서 받아온 역할 목록이라고 가정합니다.
  return ["Admin", "User", "Guest", "Moderator"];
};

const saveGridData = async (changedData) => {
  console.log("Saving data to backend:", changedData);
  // 실제 API URL로 교체하세요.
  // const { data } = await axios.post("/api/save-grid-data", { changedData });
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, message: "데이터가 성공적으로 저장되었습니다." };
};

export default function DynamicGrid() {
  const { rowData, setRowData, addRow, updateRowData, getChangedRows } =
    useGridStore();

  // 데이터 로딩 (React Query 사용)
  /*
  const { isLoading, isError, refetch: fetchGrid } = useQuery({
    queryKey: ["gridData"],
    queryFn: fetchGridData,
    enabled: false, // '조회' 버튼 클릭 시 수동으로 데이터를 가져오기 위해 초기 자동 실행을 방지합니다.
    onSuccess: (data) => {
      setRowData(data || []); // 데이터가 null/undefined일 경우 빈 배열로 설정
    },
  });*/
  const { isLoading, refetch } = useQuery({
    queryKey: ["gridData"],
    queryFn: fetchGridData,
    enabled: false, // 조회 버튼으로만 동작
  });

  // 역할 옵션 로딩 (React Query 사용)
  const { data: roleOptions } = useQuery({
    queryKey: ["roleOptions"],
    queryFn: fetchRoleOptions,
    initialData: [], // 초기값은 빈 배열로 설정
  });

  // 데이터 저장 (React Query useMutation 사용)
  const mutation = useMutation({
    mutationFn: saveGridData,
    onSuccess: (data) => {
      message.success(data.message);
      // 저장 후 상태 초기화 또는 재조회 로직 추가 가능
    },
    onError: () => {
      message.error("데이터 저장 중 오류가 발생했습니다.");
    },
  });

  // 컬럼 정의
  const columnDefs = useMemo(
    () => [
      { field: "id", headerName: "ID", editable: false, width: 80 },
      {
        field: "name",
        headerName: "이름 (Text)",
        editable: true,
        flex: 1,
      },
      {
        field: "role",
        headerName: "역할 (Select)",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: roleOptions, // API에서 받아온 데이터 사용
        },
        flex: 1,
      },
      {
        field: "active",
        headerName: "활성 (Checkbox)",
        editable: true,
        cellRenderer: "agCheckboxCellRenderer",
        cellEditor: "agCheckboxCellEditor",
        width: 150,
      },
    ],
    [roleOptions]
  );

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true, minWidth: 120 }),
    []
  );

  // 셀 값 변경 시 Zustand 스토어 업데이트
  const onCellValueChanged = useCallback(
    (params) => {
      const { rowIndex } = params.node;
      const { colId } = params.column.getColDef();
      const { newValue } = params;
      updateRowData(rowIndex, colId, newValue);
    },
    [updateRowData]
  );

  // 행 추가 핸들러
  const handleAddRow = () => {
    const newRow = { id: `NEW_${Date.now()}`, name: "", role: "User", active: false };
    addRow(newRow);
  };

  // 저장 핸들러
  const handleSaveChanges = () => {
    const changedRows = getChangedRows();
    if (changedRows.length === 0) {
      message.info("변경된 내용이 없습니다.");
      return;
    }
    mutation.mutate(changedRows);
  };

  // 조회 핸들러
  const handleSearch = async () => {
    const { data } = await refetch();
    if (data) {
      setRowData(data); // useEffect 없이 깔끔하게 스토어 반영!
    }
  };
const onCellEditRequest = useCallback(
    (event) => {
      const { rowIndex } = event.node;
      const colId = event.column.getColId();
      const newValue = event.newValue;

      // Zustand 스토어를 통해 상태 변경
      updateRowData(rowIndex, colId, newValue);
    },
    [updateRowData]
  );
  return (
    <Card title="사용자 관리" size="small">
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={handleSearch} loading={isLoading}>
          조회
        </Button>
        <Button onClick={handleAddRow}>Add Row</Button>
        <Button type="primary" onClick={handleSaveChanges} loading={mutation.isPending}>
          Save Changes
        </Button>
      </Space>
      <div className="ag-theme-quartz" style={{ height: 400, width: "100%" }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows
          //onCellValueChanged={onCellValueChanged}
          readOnlyEdit={true}
          onCellEditRequest={onCellEditRequest}
        />
      </div>
    </Card>
  );
}
