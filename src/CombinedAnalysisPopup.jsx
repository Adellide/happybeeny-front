import React, { useState, useCallback, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { generateScatterData, generateResidualData, calcRegression, SERIES_OPTIONS } from "../utils/chartUtils";
import DetailGrid from "./DetailGrid";

// =========================================================================
// 1. 메인 산점도 차트 컴포넌트 (MainScatterChart)
// =========================================================================
function MainScatterChart({ data, viewMode = "default", xLabel = "날짜", yLabel = "판매량" }) {
  const option = useMemo(() => {

const groupedData = [{name:'정상', data: [[6.72,70.56],[2.28,91.1],[6.96,48.41]]}, {name:'EMPXJ-이상', data: [[3.44,80.24],[5.68,65.32]]}];
    const series = groupedData.map((group) => ({
      name: group.name,
      type: "scatter",
      data: group.data,
      symbolSize: 12,
      emphasis: { focus: "series" },
    }));

    // 모든 좌표 포인트를 하나로 합쳐서 선형 회귀 계산에 사용
    const allPoints = groupedData.flatMap(g => g.data);
    if (allPoints.length === 0) return {};

    const xVals = allPoints.map(p => p[0]);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);

    const n = allPoints.length;
    let xSum = 0, ySum = 0, xySum = 0, xxSum = 0;
    allPoints.forEach(([x, y]) => {
      xSum += x;
      ySum += y;
      xySum += x * y;
      xxSum += x * x;
    });

    const yMean = ySum / n;
    const denominator = n * xxSum - xSum * xSum;
    let slope = 0, intercept = yMean || 0, r2 = 1;

    if (denominator !== 0) {
      slope = (n * xySum - xSum * ySum) / denominator;
      intercept = (ySum - slope * xSum) / n;

      let ssTot = 0, ssRes = 0;
      allPoints.forEach(([x, y]) => {
        ssTot += (y - yMean) ** 2;
        const predicted = slope * x + intercept;
        ssRes += (y - predicted) ** 2;
      });
      r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    }

    const regressionLineData = [
      [minX, parseFloat((slope * minX + intercept).toFixed(2))],
      [maxX, parseFloat((slope * maxX + intercept).toFixed(2))]
    ];

    series.push({
      name: "회귀선",
      type: "line",
      data: regressionLineData,
      lineStyle: { color: "#ff6b6b", width: 2, type: "dashed" },
      itemStyle: { color: "#ff6b6b" },
      symbol: "none",
      smooth: false,
      z: 10,
    });

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 600,
      grid: { top: 40, right: 120, bottom: 50, left: 60 },
      tooltip: {
        trigger: "item",
        backgroundColor: "#1a1e2a",
        borderColor: "#252a38",
        textStyle: { color: "#e8eaf0", fontSize: 13, fontFamily: "Space Mono" },
        formatter: (p) => {
          if (p.seriesName === "회귀선") {
            return `<b>회귀선</b><br/>X: <b>${p.data[0]}</b><br/>예측 Y: <b>${p.data[1]}</b>`;
          }
          return `<b>${p.seriesName}</b><br/>X: <b>${p.data[0]}</b><br/>Y: <b>${p.data[1]}</b>`;
        },
      },
      legend: {
        type: "scroll",
        orient: "vertical",
        right: 10,
        top: 40,
        textStyle: { color: "#e8eaf0" },
        data: series.map((s) => s.name).filter((name) => name !== "회귀선"),
      },
      xAxis: {
        type: "value",
        name: xLabel,
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { color: "#7a8099", fontSize: 11, fontFamily: "Space Mono" },
        axisLine: { lineStyle: { color: "#252a38" } },
        splitLine: { show: false },
        axisLabel: { color: "#7a8099", fontSize: 10, fontFamily: "Space Mono" },
      },
      yAxis: {
        type: "value",
        name: yLabel,
        nameTextStyle: { color: "#7a8099", fontSize: 11, fontFamily: "Space Mono" },
        axisLine: { lineStyle: { color: "#252a38" } },
        splitLine: { lineStyle: { color: "#1a1e2a" } },
        axisLabel: { color: "#7a8099", fontSize: 10, fontFamily: "Space Mono" },
      },
      graphic: [
        {
          type: "text",
          left: 70,
          top: 8,
          style: {
            text: `R² = ${r2.toFixed(4)}   y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
            fill: "#6c63ff",
            fontSize: 12,
            fontFamily: "Space Mono",
            fontWeight: "bold",
          },
        },
      ],
      series: series,
    };
  }, [data, viewMode, xLabel, yLabel]);

  return (
    <div className="chart-cell chart-main">
      <div className="chart-label">판매량 분석 산점도</div>
      {option ? (
        <ReactECharts option={option} className="chart-canvas" style={{ height: "100%", width: "100%" }} notMerge={true} />
      ) : (
        <div className="chart-canvas" />
      )}
    </div>
  );
}

// =========================================================================
// 2. 잔차 차트 컴포넌트 (ResidualChart)
// =========================================================================
function ResidualChart({ data, xLabel = "X" }) {
  const option = useMemo(() => {
    if (!data) return {};
    const { residuals, seriesOpt = {} } = data;

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 600,
      grid: { top: 40, right: 16, bottom: 50, left: 54 },
      tooltip: {
        trigger: "item",
        backgroundColor: "#1a1e2a",
        borderColor: "#252a38",
        textStyle: { color: "#e8eaf0", fontSize: 11, fontFamily: "Space Mono" },
        formatter: (p) => `${xLabel}: <b>${p.data[0]}</b><br/>Residual: <b>${p.data[1]}</b>`,
      },
      xAxis: {
        type: "value",
        name: xLabel,
        nameLocation: "end",
        nameTextStyle: { color: "#7a8099", fontSize: 10, fontFamily: "Space Mono" },
        axisLine: { lineStyle: { color: "#252a38" } },
        splitLine: { lineStyle: { color: "#1a1e2a" } },
        axisLabel: { color: "#7a8099", fontSize: 9, fontFamily: "Space Mono" },
      },
      yAxis: {
        type: "value",
        name: "Residual",
        nameTextStyle: { color: "#7a8099", fontSize: 10, fontFamily: "Space Mono" },
        axisLine: { lineStyle: { color: "#252a38" } },
        splitLine: { lineStyle: { color: "#1a1e2a", type: "dashed" } },
        axisLabel: { color: "#7a8099", fontSize: 9, fontFamily: "Space Mono" },
      },
      markLine: {},
      series: [
        {
          name: "Residual",
          type: "scatter",
          data: residuals,
          symbolSize: seriesOpt.symbolSize || 12,
          itemStyle: {
            color: (params) => params.data[1] >= 0 ? "#4fffb0" : "#ff6b6b",
            opacity: seriesOpt.opacity || 0.8,
          },
          markLine: {
            silent: true,
            lineStyle: { color: "#7a8099", type: "dashed", width: 1 },
            data: [{ yAxis: 0 }],
            label: { show: false },
          },
        },
      ],
    };
  }, [data, xLabel]);

  return (
    <div className="chart-cell">
      <div className="chart-label">Residual vs Fitted</div>
      {data ? (
        <ReactECharts option={option} className="chart-canvas" style={{ height: "100%", width: "100%" }} notMerge={true} />
      ) : (
        <div className="chart-canvas" />
      )}
    </div>
  );
}

// =========================================================================
// 3. 분포 차트 (Q-Q Plot) 컴포넌트 (DistributionChart)
// =========================================================================
function DistributionChart({ data, xLabel = "X" }) {
  const option = useMemo(() => {
    if (!data) return {};
    const { raw, seriesOpt = {} } = data;

    const xVals = raw.map(([x]) => x).sort((a, b) => a - b);
    const n = xVals.length;
    const mean = xVals.reduce((s, v) => s + v, 0) / n;
    const std = Math.sqrt(xVals.reduce((s, v) => s + (v - mean) ** 2, 0) / n);

    function invNorm(p) {
      const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
      const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
      const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
      const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
      const pLow = 0.02425; const pHigh = 1 - pLow;
      if (p < pLow) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) / ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
      } else if (p <= pHigh) {
        const q = p - 0.5; const r = q * q;
        return (((((a[1]*r+a[2])*r+a[3])*r+a[4])*r+a[5])*r+a[6])*q / (((((b[1]*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1);
      } else {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) / ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
      }
    }

    const qqData = xVals.map((x, i) => {
      const p = (i + 0.5) / n;
      const theoretical = mean + std * invNorm(p);
      return [parseFloat(theoretical.toFixed(2)), parseFloat(x.toFixed(2))];
    });

    const minT = qqData[0][0]; const maxT = qqData[qqData.length - 1][0];
    const diagLine = [[minT, minT], [maxT, maxT]];

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 600,
      grid: { top: 40, right: 16, bottom: 50, left: 54 },
      tooltip: {
        trigger: "item",
        backgroundColor: "#1a1e2a",
        borderColor: "#252a38",
        textStyle: { color: "#e8eaf0", fontSize: 11, fontFamily: "Space Mono" },
        formatter: (p) => {
          if (p.seriesIndex === 0) return `Theoretical: <b>${p.data[0]}</b><br/>Sample: <b>${p.data[1]}</b>`;
          return "Reference line";
        },
      },
      xAxis: { type: "value", name: "Theoretical", nameLocation: "end", nameTextStyle: { color: "#7a8099", fontSize: 10, fontFamily: "Space Mono" }, axisLine: { lineStyle: { color: "#252a38" } }, splitLine: { lineStyle: { color: "#1a1e2a" } }, axisLabel: { color: "#7a8099", fontSize: 9, fontFamily: "Space Mono" } },
      yAxis: { type: "value", name: "Sample", nameTextStyle: { color: "#7a8099", fontSize: 10, fontFamily: "Space Mono" }, axisLine: { lineStyle: { color: "#252a38" } }, splitLine: { lineStyle: { color: "#1a1e2a" } }, axisLabel: { color: "#7a8099", fontSize: 9, fontFamily: "Space Mono" } },
      series: [
        { name: "Q-Q", type: "scatter", data: qqData, symbolSize: seriesOpt.symbolSize || 12, itemStyle: { color: seriesOpt.color || "#3b82f6", opacity: seriesOpt.opacity || 0.8 } },
        { name: "Reference", type: "line", data: diagLine, lineStyle: { color: "#6c63ff", width: 1.5, type: "dashed" }, symbol: "none", itemStyle: { color: "#6c63ff" } },
      ],
    };
  }, [data, xLabel]);

  return (
    <div className="chart-cell">
      <div className="chart-label">Q-Q Plot (Normality)</div>
      {data ? (
        <ReactECharts option={option} className="chart-canvas" style={{ height: "100%", width: "100%" }} notMerge={true} />
      ) : (
        <div className="chart-canvas" />
      )}
    </div>
  );
}

// =========================================================================
// 상수 및 데이터 구성 로직 (팝업 내부에서 사용됨)
// =========================================================================
const SAMPLE_MAIN_DATA = [
  { 종류: "참치김밥", 상세종류: "참치김밥", 판매량: 1300, 날짜: 20260302, 비교: "정상" },
  { 종류: "쇠고기김밥", 상세종류: "쇠고기김밥", 판매량: 1600, 날짜: 20260303, 비교: "쇠고기김밥" },
  { 종류: "꼬마김밥", 상세종류: "꼬마김밥", 판매량: 1200, 날짜: 20260301, 비교: "정상" },
  { 종류: "쇠고기김밥", 상세종류: "쇠고기김밥", 판매량: 1100, 날짜: 20260305, 비교: "정상" }
];

function buildChartData(row, seriesOpt) {
  const raw = generateScatterData(80, 1.1, 10, 12);
  const reg = calcRegression(raw);
  const residuals = generateResidualData(raw, reg.slope, reg.intercept);
  const xDist = raw.map(([x]) => x);
  return { raw, reg, residuals, xDist, seriesOpt, row };
}

const DETAIL_COLUMNS = [
  { key: "subId", label: "#", width: 50 },
  { key: "group", label: "Group", width: 100 },
  { key: "xVal", label: "X", width: 90 },
  { key: "yVal", label: "Y", width: 90 },
  { key: "fitted", label: "Fitted", width: 90 },
  { key: "residual", label: "Residual", width: 90 },
  { key: "leverage", label: "Leverage", width: 90 },
  { key: "cooks", label: "Cook's D", width: 90 },
];

function buildDetailRows(raw, reg) {
  const n = raw.length;
  const xMean = raw.reduce((s, [x]) => s + x, 0) / n;
  const sxx = raw.reduce((s, [x]) => s + (x - xMean) ** 2, 0);
  const groups = ["A", "B", "C", "D"];

  return raw.map(([x, y], i) => {
    const fitted = parseFloat((reg.slope * x + reg.intercept).toFixed(3));
    const residual = parseFloat((y - fitted).toFixed(3));
    const leverage = parseFloat((1 / n + (x - xMean) ** 2 / sxx).toFixed(4));
    const cooks = parseFloat((residual ** 2 * leverage / (2 * (1 - leverage) ** 2)).toFixed(4));
    return {
      subId: i + 1, group: groups[i % 4], xVal: parseFloat(x.toFixed(2)), yVal: parseFloat(y.toFixed(2)),
      fitted, residual, leverage, cooks,
    };
  });
}

// =========================================================================
// 4. 통합된 부모 팝업 컴포넌트 (CombinedAnalysisPopup)
// =========================================================================
export default function CombinedAnalysisPopup({ rowData, onClose }) {
  const [seriesKey, setSeriesKey] = useState("default");
  const [chartData, setChartData] = useState(null);

  const handleSeriesChange = useCallback((key) => {
    setSeriesKey(key);
    if (chartData) setChartData(prev => ({ ...prev, seriesOpt: SERIES_OPTIONS[key] }));
  }, [chartData]);

  const handleDetailDoubleClick = useCallback((detailRow) => {
    const data = buildChartData(rowData, SERIES_OPTIONS[seriesKey]);
    setChartData(data);
  }, [rowData, seriesKey]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    const data = buildChartData(rowData, SERIES_OPTIONS[seriesKey]);
    setChartData(data);
    setInitialized(true);
  }

  const detailRows = chartData ? buildDetailRows(chartData.raw, chartData.reg) : [];

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-box">
        <div className="popup-header">
          <div className="popup-header-left">
            <span className="popup-tag">ANALYSIS</span>
            <span className="popup-title">{rowData?.name}</span>
            <span className="popup-meta">{rowData?.xVar} × {rowData?.yVar} &nbsp;·&nbsp; n={rowData?.samples}</span>
          </div>
          <button className="popup-close" onClick={onClose}>✕</button>
        </div>

        <div className="popup-controls">
          <div className="rg-wrapper">
            <span className="rg-label">Series Style</span>
            <div className="rg-options">
              <label className={`rg-item ${seriesKey === "default" ? "active" : ""}`}>
                <input type="radio" name="series-option" value="default" checked={seriesKey === "default"} onChange={() => handleSeriesChange("default")} />
                <span className="rg-dot" style={{ background: SERIES_OPTIONS["default"]?.color || "#3b82f6" }} />
                <span className="rg-text">기본</span>
              </label>
              <label className={`rg-item ${seriesKey === "special" ? "active" : ""}`}>
                <input type="radio" name="series-option" value="special" checked={seriesKey === "special"} onChange={() => handleSeriesChange("special")} />
                <span className="rg-dot" style={{ background: SERIES_OPTIONS["special"]?.color || "#ef4444" }} />
                <span className="rg-text">특이</span>
              </label>
              <label className={`rg-item ${seriesKey === "compare" ? "active" : ""}`}>
                <input type="radio" name="series-option" value="compare" checked={seriesKey === "compare"} onChange={() => handleSeriesChange("compare")} />
                <span className="rg-dot" style={{ background: SERIES_OPTIONS["compare"]?.color || "#10b981" }} />
                <span className="rg-text">비교</span>
              </label>
            </div>
          </div>
          {chartData && (
            <div className="r2-badge">
              R² = <strong>{chartData.reg.r2.toFixed(4)}</strong>
            </div>
          )}
        </div>

        <div className="popup-charts" style={{ display: "flex", gap: "20px", alignItems: "stretch", minHeight: "400px" }}>
          {chartData ? (
            <>
              <div style={{ flex: 2, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <MainScatterChart data={SAMPLE_MAIN_DATA} viewMode={seriesKey} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <ResidualChart data={chartData} xLabel={rowData?.xVar} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <DistributionChart data={chartData} xLabel={rowData?.xVar} />
                </div>
              </div>
            </>
          ) : (
            <div className="chart-placeholder">하단 그리드를 더블클릭하여 차트를 그려주세요</div>
          )}
        </div>

        <div className="popup-grid-area">
          <div className="popup-grid-header">
            <span>Detail Records</span>
            <span className="grid-hint">더블클릭하여 차트 갱신</span>
          </div>
          <DetailGrid
            columns={DETAIL_COLUMNS}
            rows={detailRows}
            onRowDoubleClick={handleDetailDoubleClick}
          />
        </div>
      </div>
    </div>
  );
}
