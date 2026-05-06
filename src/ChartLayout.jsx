import React, { useState } from 'react';

const ChartLayout = () => {
  // 현재 어떤 차트가 전체 화면인지 관리 (null이면 기본 20:20:60 비율)
  const [expandedChart, setExpandedChart] = useState(null);

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

  /* ????
useEffect(() => {
  myChart.resize();
}, [expandedId]);
  */
  return (
    <div style={{ display: 'flex', width: '100%', height: '400px', overflow: 'hidden', gap: expandedChart ? '0' : '10px' }}>
      
      {/* Chart 1 Container */}
      <div style={{ ...containerStyle, width: getWidth('echart1') }}>
        <div style={chartBoxStyle}>
          Chart 1
          <button onClick={() => toggleExpand('echart1')}>
            {expandedChart === 'echart1' ? '축소' : '확대'}
          </button>
        </div>
      </div>

      {/* Chart 2 Container */}
      <div style={{ ...containerStyle, width: getWidth('echart2') }}>
        <div style={chartBoxStyle}>
          Chart 2
          <button onClick={() => toggleExpand('echart2')}>
            {expandedChart === 'echart2' ? '축소' : '확대'}
          </button>
        </div>
      </div>

      {/* Chart 3 Container */}
      <div style={{ ...containerStyle, width: getWidth('echart3') }}>
        <div style={chartBoxStyle}>
          Chart 3
          <button onClick={() => toggleExpand('echart3')}>
            {expandedChart === 'echart3' ? '축소' : '확대'}
          </button>
        </div>
      </div>

    </div>
  );
};

// 공통 스타일
const containerStyle = {
  transition: 'all 0.5s ease', // 부드러운 애니메이션 효과
  overflow: 'hidden',
  display: 'flex'
};

const chartBoxStyle = {
  width: '100%',
  height: '100%',
  border: '1px solid #ccc',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '300px' // 내용이 깨지지 않게 최소 너비 설정 (선택사항)
};

export default ChartLayout;