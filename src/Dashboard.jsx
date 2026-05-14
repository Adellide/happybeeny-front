import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

// API 호출을 흉내내는 가짜(Mock) 함수들입니다. 실제 API 호출(axios 등)로 교체하시면 됩니다.
const api = {
  getChart1: async (params) => { /* axios.get('/api/chart1', { params }) */ return params ? [[15, 20], [30, 40], [50, 60]] : [[10, 20], [20, 30], [30, 40]]; },
  getChart2: async (params) => { /* axios.get('/api/chart2', { params }) */ return params ? [[100, 200], [300, 400]] : [[10, 50], [20, 60], [30, 70]]; },
  getChart3: async (params) => { /* axios.get('/api/chart3', { params }) */ return params ? [[1, 2], [3, 4], [5, 6]] : [[5, 10], [15, 20], [25, 30]]; },
  getGrid: async (params) => { /* axios.get('/api/grid', { params }) */ return [{ id: 1, name: 'Row 1' }, { id: 2, name: 'Row 2' }]; },
};

const Dashboard = (props) => {
  // 상태 관리
  const [chartsData, setChartsData] = useState({ chart1: [], chart2: [], chart3: [] });
  const [gridData, setGridData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [baseYn, setBaseYn] = useState('N');

  // [핵심] 3개의 차트 데이터를 호출하는 공통 함수
  // params가 없으면 최초 로딩용, params가 있으면 그리드 더블클릭용으로 사용합니다.
  const fetchChartsData = useCallback(async (params = null) => {
    try {
      // 3개의 API를 동시에 병렬로 호출합니다.
      const [res1, res2, res3] = await Promise.all([
        api.getChart1(params),
        api.getChart2(params),
        api.getChart3(params)
      ]);

      setChartsData({
        chart1: res1,
        chart2: res2,
        chart3: res3
      });
    } catch (error) {
      console.error("차트 데이터를 불러오는 중 오류 발생:", error);
    }
  }, []);

  // 최초 로딩 시 4개의 API 호출 (차트 3개 + 그리드 1개)
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // 차트 데이터 호출 함수(fetchChartsData)를 재사용하면서, 그리드 데이터도 동시에 호출합니다.
        const [gridRes] = await Promise.all([
          api.getGrid(props),
          fetchChartsData(props) 
        ]);
        
        setGridData(gridRes);
      } catch (error) {
        console.error("초기 데이터를 불러오는 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchChartsData, props]);

  // 그리드 더블클릭 이벤트 핸들러
  const handleGridDoubleClick = (rowData) => {
    // 선택된 행의 데이터(예: id)를 파라미터로 넘겨 차트 API 3개를 다시 호출합니다.
    fetchChartsData({ id: rowData.id });
  };

  if (isLoading) return <div>데이터를 불러오는 중입니다...</div>;

  // ECharts 스캐터 차트 옵션 생성 공통 함수
  const getScatterOption = (data, currentBaseYn) => {
    // baseYn === 'N' 일 때의 기본 시리즈
    const defaultSeries = [{
      name: 'Default',
      symbolSize: 10,
      data: data,
      type: 'scatter'
    }];

    // baseYn === 'Y' 일 때의 변경된 시리즈 (예: 심볼, 크기, 색상 변경)
    const baseSeries = [{
      name: 'Base',
      symbol: 'diamond', // 마커 모양 변경
      symbolSize: 15,    // 마커 크기 변경
      itemStyle: {
        color: '#e63946' // 마커 색상 변경
      },
      data: data,
      type: 'scatter'
    }];

    return {
      xAxis: {},
      yAxis: {},
      legend: { // 범례 표시
        data: currentBaseYn === 'Y' ? ['Base'] : ['Default']
      },
      series: currentBaseYn === 'Y' ? baseSeries : defaultSeries
    };
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setBaseYn(prev => prev === 'N' ? 'Y' : 'N')}>
          시리즈 변경 (현재: {baseYn})
        </button>
      </div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div style={{ flex: 1, height: '300px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>스캐터 차트 1</h3>
          {chartsData.chart1.length > 0 ? (
            <ReactECharts option={getScatterOption(chartsData.chart1, baseYn)} style={{ height: '80%', width: '100%' }} />
          ) : (
            <div style={{ display: 'flex', height: '80%', alignItems: 'center', justifyContent: 'center', color: '#999' }}>데이터가 없습니다.</div>
          )}
        </div>
        <div style={{ flex: 1, height: '300px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>스캐터 차트 2</h3>
          {chartsData.chart2.length > 0 ? (
            <ReactECharts option={getScatterOption(chartsData.chart2, baseYn)} style={{ height: '80%', width: '100%' }} />
          ) : (
            <div style={{ display: 'flex', height: '80%', alignItems: 'center', justifyContent: 'center', color: '#999' }}>데이터가 없습니다.</div>
          )}
        </div>
        <div style={{ flex: 1, height: '300px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>스캐터 차트 3</h3>
          {chartsData.chart3.length > 0 ? (
            <ReactECharts option={getScatterOption(chartsData.chart3, baseYn)} style={{ height: '80%', width: '100%' }} />
          ) : (
            <div style={{ display: 'flex', height: '80%', alignItems: 'center', justifyContent: 'center', color: '#999' }}>데이터가 없습니다.</div>
          )}
        </div>
      </div>

      <div style={{ height: '400px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>데이터 그리드</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name (더블클릭 해보세요)</th>
            </tr>
          </thead>
          <tbody>
            {gridData.map((row) => (
              <tr 
                key={row.id} 
                onDoubleClick={() => handleGridDoubleClick(row)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
