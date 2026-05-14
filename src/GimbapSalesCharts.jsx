import React, { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";

// ─── 1. 샘플 데이터 생성기 ──────────────────────────────
const GIMBAP_TYPES = ["참치김밥", "치즈김밥", "야채김밥", "돈까스김밥"];
const DATES = ["10-01", "10-02", "10-03", "10-04", "10-05", "10-06", "10-07"];

const generateSampleData = () => {
  const data = [];
  DATES.forEach((date) => {
    GIMBAP_TYPES.forEach((type) => {
      // 김밥 종류별로 기준값을 다르게 주어 분포의 차이를 만듭니다
      const baseAmount =
        type === "참치김밥" ? 120 :
        type === "치즈김밥" ? 90 :
        type === "야채김밥" ? 70 : 150;
      
      // 기준값에서 ±30 정도의 랜덤 변동 추가
      const amount = Math.max(0, Math.floor(baseAmount + (Math.random() * 60 - 30)));
      data.push({ date, type, amount });
    });
  });
  return data;
};

// ─── 2. 통계 계산 헬퍼 함수 (Boxplot 용) ────────────────
// 주어진 배열에서 백분위수(Percentile)를 계산합니다
const getPercentile = (sortedData, p) => {
  const index = (sortedData.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  if (upper >= sortedData.length) return sortedData[lower];
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
};

// 배열을 받아 [최소값, Q1, 중앙값, Q3, 최대값] 을 반환합니다.
const calculateBoxplotValues = (values) => {
  if (values.length === 0) return [0, 0, 0, 0, 0];
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const q1 = getPercentile(sorted, 0.25);
  const median = getPercentile(sorted, 0.5);
  const q3 = getPercentile(sorted, 0.75);
  
  return [min, q1, median, q3, max];
};

// ─── 3. 선형 회귀(Linear Regression) 및 R² 계산 헬퍼 함수 ──
const calculateRegressionAndR2 = (dataPoints, categories) => {
  const n = dataPoints.length;
  if (n === 0) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  // ECharts category(문자열) 기반이므로 X축을 0, 1, 2... 인덱스로 매핑하여 계산합니다.
  const numericData = dataPoints.map((dp) => {
    const xIdx = categories.indexOf(dp[0]);
    return [xIdx, dp[1]];
  });

  numericData.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  // 기울기(slope)와 y절편(intercept) 계산
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² (결정계수) 계산
  const yMean = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  numericData.forEach(([x, y]) => {
    ssTot += Math.pow(y - yMean, 2);
    const predicted = slope * x + intercept;
    ssRes += Math.pow(y - predicted, 2);
  });
  const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

  // 차트에 그릴 추세선의 시작과 끝 좌표 (category 이름 매핑)
  const startX = categories[0];
  const endX = categories[categories.length - 1];
  const startY = slope * 0 + intercept;
  const endY = slope * (categories.length - 1) + intercept;

  return { slope, intercept, rSquared, startX, endX, startY, endY };
};

export default function GimbapSalesCharts() {
  const scatterRef = useRef(null);
  const boxplotRef = useRef(null);

  // 데이터 초기화
  const salesData = useMemo(() => generateSampleData(), []);

  // ─── 상단 차트: 스캐터 (Scatter) ───────────────────────
  useEffect(() => {
    if (!scatterRef.current) return;
    const chart = echarts.init(scatterRef.current);

    // 김밥 종류별로 Series 구성
    const seriesData = GIMBAP_TYPES.map((type) => {
      // [날짜, 판매량] 형태의 데이터 배열
      const dataPoints = salesData
        .filter((d) => d.type === type)
        .map((d) => [d.date, d.amount]);

      const reg = calculateRegressionAndR2(dataPoints, DATES);

      return {
        name: type,
        type: "scatter",
        symbolSize: 12,
        data: dataPoints,
        markLine: reg ? {
          animation: false,
          symbol: ["none", "none"],
          lineStyle: { type: "solid", width: 2, opacity: 0.8 },
          label: {
            show: true,
            position: "end",
            formatter: `R²: ${reg.rSquared.toFixed(2)}`
          },
          data: [
            [
              { coord: [reg.startX, reg.startY] },
              { 
                coord: [reg.endX, reg.endY],
                // markLine 전용 툴팁 메시지
                name: `<strong>${type} 추세선</strong><br/>y = ${reg.slope.toFixed(2)}x ${reg.intercept >= 0 ? "+" : "-"} ${Math.abs(reg.intercept).toFixed(2)}<br/>R² = ${reg.rSquared.toFixed(4)}`
              }
            ]
          ]
        } : undefined
      };
    });

    const option = {
      title: { text: "일자별 김밥 판매량 (Scatter)", left: "center" },
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          if (params.componentType === "markLine") return params.name;
          return `${params.seriesName}<br/>날짜: ${params.value[0]}<br/>판매량: ${params.value[1]}개`;
        },
      },
      legend: { top: 30, data: GIMBAP_TYPES },
      // 우측 R² 라벨이 안 짤리도록 여백(right)을 10%로 확장
      grid: { left: "5%", right: "10%", bottom: "10%", top: "25%", containLabel: true },
      xAxis: {
        type: "category",
        name: "판매 날짜",
        data: DATES,
        boundaryGap: true,
      },
      yAxis: {
        type: "value",
        name: "판매량",
      },
      series: seriesData,
    };

    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(scatterRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [salesData]);

  // ─── 하단 차트: 박스플롯 (Boxplot) ───────────────────────
  useEffect(() => {
    if (!boxplotRef.current) return;
    const chart = echarts.init(boxplotRef.current);

    // 김밥 종류별 [최소값, Q1, 중앙값, Q3, 최대값] 계산
    const boxplotData = GIMBAP_TYPES.map((type) => {
      const amounts = salesData
        .filter((d) => d.type === type)
        .map((d) => d.amount);
      return calculateBoxplotValues(amounts);
    });

    // 스캐터(개별 점) 데이터 생성: x축이 category일 때 점들이 겹치지 않게 약간의 Jitter(가로 노이즈)를 줍니다.
    const scatterDataForBoxplot = salesData.map((d) => {
      const baseIdx = GIMBAP_TYPES.indexOf(d.type);
      // -0.15 ~ 0.15 사이의 랜덤 값을 더해 좌우로 분산시킵니다.
      const jitter = (Math.random() - 0.5) * 0.3; 
      return {
        name: d.type,
        value: [baseIdx + jitter, d.amount],
        date: d.date,
      };
    });

    const option = {
      title: { text: "김밥 종류별 판매량 분포 (Boxplot)", left: "center" },
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          // 스캐터 점에 마우스를 올렸을 때의 툴팁 포맷
          if (params.seriesType === "scatter") {
            return `<strong>${params.data.name}</strong><br/>날짜: ${params.data.date}<br/>판매량: ${params.data.value[1]}개`;
          }
          // 박스플롯에 마우스를 올렸을 때의 툴팁 포맷
          const { name, value } = params;
          return `
            <strong>${name}</strong><br/>
            최대값(Max): ${value[5]}<br/>
            3사분위(Q3): ${value[4]}<br/>
            중앙값(Med): ${value[3]}<br/>
            1사분위(Q1): ${value[2]}<br/>
            최소값(Min): ${value[1]}
          `;
        },
      },
      grid: { left: "5%", right: "5%", bottom: "10%", top: "20%", containLabel: true },
      xAxis: [
        {
          type: "category",
          name: "김밥 종류",
          data: GIMBAP_TYPES,
        },
        {
          type: "value",
          show: false, // Jitter용 보조 X축 (숨김 처리)
          min: -0.5,
          max: GIMBAP_TYPES.length - 0.5,
        }
      ],
      yAxis: {
        type: "value",
        name: "판매량",
      },
      series: [
        {
          name: "판매량 분포",
          type: "boxplot",
          xAxisIndex: 0,
          data: boxplotData,
          itemStyle: {
            color: "#6366f1",
            borderColor: "#4338ca",
          },
        },
        {
          name: "개별 판매 데이터",
          type: "scatter",
          xAxisIndex: 1, // 보조 X축을 사용하여 점을 분산 배치
          symbolSize: 6,
          itemStyle: {
            color: "#f59e0b", // 주황색 점
            opacity: 0.8,
          },
          data: scatterDataForBoxplot,
        }
      ],
    };

    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(boxplotRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [salesData]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", height: "800px", padding: "16px" }}>
      <div ref={scatterRef} style={{ flex: 1, minHeight: 0, border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", background: "#fff" }} />
      <div ref={boxplotRef} style={{ flex: 1, minHeight: 0, border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", background: "#fff" }} />
    </div>
  );
}
