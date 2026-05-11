import React, { useState, useEffect } from 'react';
import ScatterRegressionChart from './ScatterRegressionChart.jsx';

const ChartLayout = () => {
  // 현재 어떤 차트가 전체 화면인지 관리 (null이면 기본 20:20:60 비율)
  const [expandedChart, setExpandedChart] = useState(null);
  const [chartData, setChartData] = useState([]);

  // 컴포넌트 마운트 시 API에서 데이터를 받아온다고 가정
  useEffect(() => {
    // 실제 구현 시: fetch('/api/scatter-data').then(res => res.json()).then(setData)
    const mockApiData = [
      [152, 51], [156, 53], [160, 54], [163, 59], [165, 62],
      [168, 65], [170, 68], [172, 72], [175, 75], [178, 76],
      [180, 82], [182, 85], [185, 89], [188, 92], [190, 95]
    ];
    setChartData(mockApiData);
  }, []);

  const toggleExpand = (chartId) => {
    // 이미 확대된 차트를 다시 누르면 원래대로, 아니면 해당 차트 확대
    setExpandedChart(expandedChart === chartId ? null : chartId);
  };

  // 차트별 기본 너비 설정
  const baseWidths = {
    echart1: '20%',
    echart2: '20%',
    echart3: '60%',
  };

  // 너비 계산 로직
  const getWidth = (chartId) => {
    if (expandedChart === null) return baseWidths[chartId];
    return expandedChart === chartId ? '100%' : '0%';
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '500px', overflow: 'hidden', gap: expandedChart ? '0' : '12px', padding: '12px' }}>
      
      {/* Chart 1 Container */}
      <div style={{ ...containerStyle, width: getWidth('echart1') }}>
        <div style={chartBoxStyle}>
          <div style={headerStyle}>
            <span style={titleStyle}>차트 1</span>
            <button style={btnStyle} onClick={() => toggleExpand('echart1')}>
              {expandedChart === 'echart1' ? '◀ 축소' : '▶ 확대'}
            </button>
          </div>
          <div style={contentStyle}>
            <ScatterRegressionChart data={chartData} />
          </div>
        </div>
      </div>

      {/* Chart 2 Container */}
      <div style={{ ...containerStyle, width: getWidth('echart2') }}>
        <div style={chartBoxStyle}>
          <div style={headerStyle}>
            <span style={titleStyle}>차트 2</span>
            <button style={btnStyle} onClick={() => toggleExpand('echart2')}>
              {expandedChart === 'echart2' ? '◀ 축소' : '▶ 확대'}
            </button>
          </div>
          <div style={contentStyle}>
            <ScatterRegressionChart data={chartData} />
          </div>
        </div>
      </div>

      {/* Chart 3 Container */}
      <div style={{ ...containerStyle, width: getWidth('echart3') }}>
        <div style={chartBoxStyle}>
          <div style={headerStyle}>
            <span style={titleStyle}>차트 3</span>
            <button style={btnStyle} onClick={() => toggleExpand('echart3')}>
              {expandedChart === 'echart3' ? '◀ 축소' : '▶ 확대'}
            </button>
          </div>
          <div style={contentStyle}>
            <ScatterRegressionChart data={chartData} />
          </div>
        </div>
      </div>

    </div>
  );
};

// 공통 스타일
const containerStyle = {
  transition: 'width 0.5s ease', // 너비 변경 애니메이션 효과
  overflow: 'hidden',
  display: 'flex'
};

const chartBoxStyle = {
  width: '100%',
  height: '100%',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  background: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  minWidth: '280px' // 줄어들 때 차트가 찌그러지지 않도록 최소 너비 유지
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid #e2e8f0',
  background: '#f8fafc',
  borderTopLeftRadius: '12px',
  borderTopRightRadius: '12px',
};

const titleStyle = {
  fontWeight: 600,
  fontSize: '14px',
  color: '#334155'
};

const btnStyle = {
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#4f46e5',
  border: '1.5px solid #4f46e5',
  borderRadius: '6px',
  background: 'transparent',
  cursor: 'pointer'
};

const contentStyle = {
  flex: 1,
  width: '100%',
  minHeight: 0 // 플렉스 자식 내에서 차트가 넘치지 않고 리사이즈되도록 허용
};

export default ChartLayout;