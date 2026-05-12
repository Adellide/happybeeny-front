import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

/**
 * 최소제곱법(Least Squares Method)을 이용한 선형 회귀(y = mx + c) 계산 함수
 */
function calculateLinearRegression(data) {
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = data.length;

  data.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  // 기울기(m)와 y절편(c) 계산
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // x값의 최솟값과 최댓값을 구해서 회귀선의 시작점과 끝점을 생성
  const xValues = data.map((d) => d[0]);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  // 시작 좌표, 끝 좌표 반환
  const lineData = [
    [minX, slope * minX + intercept],
    [maxX, slope * maxX + intercept],
  ];

  return { slope, intercept, lineData };
}

export default function ScatterRegressionChart({ data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;
    
    // 차트 인스턴스 초기화
    const chartInstance = echarts.init(chartRef.current);

    // 회귀선 데이터 계산
    const { slope, intercept, lineData } = calculateLinearRegression(data);
    const formulaText = `y = ${slope.toFixed(2)}x ${intercept >= 0 ? "+" : "-"} ${Math.abs(intercept).toFixed(2)}`;

    // 사선을 그리기 위한 최소/최대 좌표 계산
    const xValues = data.map(d => d[0]);
    const yValues = data.map(d => d[1]);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // ECharts 옵션 설정
    const option = {
      title: {
        text: "스캐터 차트와 선형 회귀선",
        left: "center",
        textStyle: { color: "#1e293b", fontSize: 18 }
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" }
      },
      legend: {
        bottom: 10,
        data: ["데이터(Scatter)", "추세선(Regression)"]
      },
      grid: {
        left: "10%",
        right: "15%", // 수식 라벨을 위해 오른쪽 여백 확보
        bottom: "15%",
        top: "15%",
        show: false,  // 전체 그리드 테두리 감추기
      },
      xAxis: {
        type: "value",
        scale: true,
        // 축 선(테두리)과 눈금 숨기기
        axisLine: { show: false },
        axisTick: { show: false },
        // 내부 그리드 격자선(점선) 표시
        splitLine: { 
          show: true,
          lineStyle: { type: "dashed", color: "#e2e8f0" } 
        }
      },
      yAxis: {
        type: "value",
        scale: true,
        // 축 선(테두리)과 눈금 숨기기
        axisLine: { show: false },
        axisTick: { show: false },
        // 내부 그리드 격자선(점선) 표시
        splitLine: { 
          show: true,
          lineStyle: { type: "dashed", color: "#e2e8f0" } 
        }
      },
      series: [
        {
          name: "데이터(Scatter)",
          type: "scatter",
          data: data,
          itemStyle: { color: "#3b82f6", opacity: 0.7 },
          symbolSize: 8,
          markLine: {
            data: [
              // 1. 기존: Y축 평균선
              { 
                type: "average", 
                valueIndex: 1, 
                name: "Y축 평균",
                lineStyle: { type: "dashed", color: "#f59e0b", width: 2 },
                label: { formatter: '평균: {c}', position: 'insideEndTop' }
              },
              // 2. 추가: 좌상단(minX, maxY)에서 우하단(maxX, minY)으로 그어지는 사선
              [
                { 
                  coord: [minX, maxY], 
                  name: '사선 시작점',
                  lineStyle: { type: "solid", color: "#10b981", width: 2 } // 초록색 실선
                },
                { 
                  coord: [maxX, minY], 
                  name: '사선 끝점',
                  label: { formatter: '좌상→우하', position: 'insideEndBottom', color: '#10b981' }
                }
              ]
            ]
          }
        },
        {
          name: "추세선(Regression)",
          type: "line",
          data: lineData,
          showSymbol: false,
          lineStyle: { color: "#ef4444", width: 2, type: "solid" },
          markPoint: {
            itemStyle: { color: "transparent" },
            label: {
              show: true,
              position: "right",
              formatter: formulaText,
              color: "#ef4444",
              fontSize: 13,
              fontWeight: "bold"
            },
            data: [{ coord: lineData[1] }]
          }
        }
      ]
    };

    chartInstance.setOption(option);
    
    // 반응형 리사이즈 핸들러
    const handleResize = () => chartInstance.resize();
    window.addEventListener("resize", handleResize);
    // ResizeObserver를 통해 부모(ChartLayout 컨테이너)의 크기 변화를 감지하여 차트 자동 리사이즈
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chartInstance.dispose();
    };
  }, [data]); // data가 변경될 때마다 차트를 다시 그리도록 설정

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "200px" }}>
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
