import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';

// AG-Grid 기본 CSS 모듈 Import
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const Dashboard = () => {
  // 1. 컬럼 정의
  const [columnDefs] = useState([
    {
      headerName: 'DEL',
      field: 'del',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 80,
      headerClass: 'vertical-center-header', // 수직 중앙 정렬용 커스텀 클래스
    },
    {
      headerName: 'NAME',
      field: 'name',
      width: 120,
      headerClass: 'vertical-center-header', // 수직 중앙 정렬용 커스텀 클래스
    },
    {
      headerName: 'START',
      children: [
        { headerName: '일자', field: 'startDate', width: 110 },
        { headerName: '명칭', field: 'startName', width: 120 },
        { headerName: '시간', field: 'startTime', width: 100 },
      ],
    },
    {
      headerName: 'END',
      children: [
        { headerName: '회사', field: 'endCompany', width: 120 },
        { headerName: '명칭', field: 'endName', width: 120 },
        { headerName: '시간', field: 'endTime', width: 100 },
      ],
    },
  ]);

  // 2. 샘플 데이터
  const [rowData] = useState([
    {
      del: false,
      name: '홍길동',
      startDate: '2026-03-01',
      startName: '본사',
      startTime: '09:00',
      endCompany: 'ABC상사',
      endName: '지사',
      endTime: '18:00',
    },
    {
      del: false,
      name: '김철수',
      startDate: '2026-03-02',
      startName: '공장',
      startTime: '10:00',
      endCompany: 'XYZ물류',
      endName: '창고',
      endTime: '19:00',
    },
  ]);

  return (
    <div style={{ width: '100%', height: '500px', padding: '20px' }}>
      {/* 3. 인라인 스타일을 통해 CSS 적용 (styled-components 미사용) */}
      <style>{`
        /* 2줄을 차지하는 DEL, NAME 컬럼의 텍스트를 수직/수평 중앙 정렬 */
        .vertical-center-header .ag-header-cell-label {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
        }

        /* 체크박스 정렬 보정 */
        .vertical-center-header .ag-header-select-all {
          display: flex;
          align-items: center;
        }
      `}</style>

      {/* 4. AG-Grid 컴포넌트 */}
      <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          groupHeaderHeight={40} // 상단 그룹 헤더 높이(px)
          headerHeight={40}      // 하단 헤더 높이(px) (DEL/NAME은 합산되어 80px 높이를 가짐)
        />
      </div>
    </div>
  );
};

export default Dashboard;