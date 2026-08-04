import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";
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
const fetchGridData = async ({ queryKey }) => {
  const [_, searchParams] = queryKey;
  // 실제 API 요청 시 다음과 같이 param 전달:
  // const { data } = await axios.get("/api/grid-data", { params: searchParams });
  console.log("Fetching data with search params:", searchParams);

  await new Promise((resolve) => setTimeout(resolve, 500));
  const allData = [
    { name: "John Doe", role: "Admin", use: "Y", delYn: "N", isDirty: false, saveFlag: '' },
    { name: "Jane Smith", role: "User", use: "Y", delYn: "N", isDirty: false, saveFlag: '' },
    { name: "Peter Jones", role: "Guest", use: "N", delYn: "N", isDirty: false, saveFlag: '' },
  ];

  // searchParams에 useYn이 있으면 필터링을 적용합니다.
  if (searchParams && searchParams.useYn) {
    return allData.filter(item => item.use === searchParams.useYn);
  }

  return allData;
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
  const gridRef = useRef();
  const [searchParams, setSearchParams] = useState(null);
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
  const { data, isFetching } = useQuery({
    queryKey: ["gridData", searchParams],
    queryFn: fetchGridData,
    // searchParams가 null이 아닐 때만 쿼리를 실행합니다. (초기 로딩 방지)
    enabled: !!searchParams,
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
  useEffect(() => {
    // isFetching에서 false로 변경되는 시점에 데이터를 세팅해야
    // 검색 버튼을 연달아 눌렀을 때 이전 데이터가 잠깐 보이는 현상을 방지할 수 있습니다.
    if (!isFetching && data) {
      setRowData(data);
    }
  }, [isFetching, data, setRowData]);
  // 컬럼 정의
  const columnDefs = useMemo(
    () => [
      {
        field: "name",
        headerName: "이름 (Text)",
        editable: true,
        flex: 1,
        // 값이 비어있을 때 'ag-cell-invalid' 클래스를 적용하여 시각적 피드백을 줍니다.
        cellClassRules: {
          "ag-cell-invalid": (params) =>
            !params.value || params.value.trim() === "",
        },
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
        field: "use",
        headerName: "사용 여부 (Checkbox)",
        editable: true,
        cellRenderer: "agCheckboxCellRenderer",
        cellEditor: "agCheckboxCellEditor",
        // 'Y'면 true, 아니면 false로 체크박스에 표시
        valueGetter: (params) => params.data?.use === "Y",
        // 체크박스 클릭 시 true/false를 'Y'/'N'으로 변환하여 데이터 저장
        valueSetter: (params) => {
    const newValue = params.newValue ? "Y" : "N";
    params.data.use = newValue;
    return true;
  },
        width: 150,
      },
       {
        field: "delYn",
        headerName: "삭제",
        editable: true,
        cellRenderer: "agCheckboxCellRenderer",
        cellEditor: "agCheckboxCellEditor",
        // 'Y'면 true, 아니면 false로 체크박스에 표시
        valueGetter: (params) => params.data?.delYn === "Y",
        // 체크박스 클릭 시 true/false를 'Y'/'N'으로 변환하여 데이터 저장
        valueSetter: (params) => {
    const newValue = params.newValue ? "Y" : "N";
    params.data.delYn = newValue;
    return true;
  },
        width: 150,
      },
      {
        field: "isDirty",
        headerName: "SELECTED",
        //editable: true,
        cellRenderer: "agCheckboxCellRenderer",
        cellEditor: "agCheckboxCellEditor",
        width: 150,
      },
       {
        field: "saveFlag",
        headerName: "saveFlag",
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
    const newRow = {  name: "", role: "User", use: 'Y', delYn: 'N', isDirty : false ,saveFlag: "I" }; // 새로 추가된 행은 saveFlag를 'I'로 설정
    addRow(newRow);
  };

  // 저장 핸들러
  // DynamicGrid.jsx

// 저장 핸들러
const handleSaveChanges = () => {
  const changedRows = getChangedRows();

  if (changedRows.length === 0) {
    message.info("변경된 내용이 없습니다.");
    return;
  }

  // 1. name과 role이 빈값인지 검사
  for (let i = 0; i < changedRows.length; i++) {
    const row = changedRows[i];
    
    const isNameEmpty = !row.name || String(row.name).trim() === "";
    const isRoleEmpty = !row.role || String(row.role).trim() === "";

    if (isNameEmpty || isRoleEmpty) {
      alert("이름과 역할은 필수 입력 항목입니다.");
      return; // 저장 로직 중단
    }
  }

  console.log("===handleSaveChanges===변경된 행 데이터:", changedRows);
  mutation.mutate(changedRows);
};

  // 조회 핸들러
  const handleSearch = () => {
    setSearchParams({ type: ['aa', 'bb', 'cc'], useYn: 'Y' });
  };

  const onCellEditRequest = useCallback(
    (event) => {
      const { data, node, colDef, newValue, api } = event;
      const { rowIndex } = event.node;
      const colId = event.column.getColId();

      let valueToUpdate = newValue;

      if (colId === "use" || colId === "delYn") {
        valueToUpdate = newValue ? "Y" : "N";
      }
      // --- 유효성 검사 로직 추가 ---
      // '이름' 필드에 대한 필수값 검사
      if (colId === "name" && (!valueToUpdate || valueToUpdate.trim() === "")) {
        // 편집을 강제로 취소하고 이전 값으로 되돌립니다.
        // api.stopEditing(true)는 현재 편집을 취소하는 역할을 합니다.
        // setTimeout을 사용하여 message.error가 표시된 후 비동기적으로 실행되도록 합니다.
        setTimeout(() => api.stopEditing(true), 0);

        message.error("이름은 필수 입력 항목입니다.");
        // 유효성 검사에 실패했으므로 스토어를 업데이트하지 않습니다.
        // readOnlyEdit=true 이므로, 스토어가 변경되지 않으면 그리드는
        // 자동으로 이전 값으로 되돌립니다.
        return; // 스토어를 업데이트하지 않고 함수를 종료
      }

      // Zustand 스토어를 통해 상태 변경
      updateRowData(rowIndex, colId, valueToUpdate);
    },
    [updateRowData]
  );

  return (
    <Card title="사용자 관리" size="small">
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={handleSearch} loading={isFetching}>
          조회
        </Button>
        <Button onClick={handleAddRow}>Add Row</Button>
        <Button type="primary" onClick={handleSaveChanges} loading={mutation.isPending}>
          Save Changes
        </Button>
      </Space>
      {/* 유효하지 않은 셀에 대한 스타일 정의 */}
      <style>{`
        .ag-cell-invalid {
          border-color: red !important;
        }
      `}</style>
      <div className="ag-theme-quartz" style={{ height: 400, width: "100%" }}>
        <AgGridReact
          ref={gridRef}
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
