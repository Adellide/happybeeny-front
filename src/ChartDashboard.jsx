// ChartDashboard.jsx
// ECharts 3개를 flex 레이아웃으로 배치하고,
// 각 차트의 확대 버튼 클릭 시 해당 차트만 100% 너비로 확장

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

// ─── 차트별 샘플 옵션 ─────────────────────────────────
const CHART_CONFIGS = [
  {
    id: "chart-a",
    label: "월별 매출",
    defaultWidth: "20%",
    color: "#4f46e5",
    option: {
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: ["1월", "2월", "3월", "4월", "5월", "6월"] },
      yAxis: { type: "value" },
      series: [{ type: "bar", data: [120, 200, 150, 80, 170, 220], itemStyle: { color: "#4f46e5" } }],
    },
  },
  {
    id: "chart-b",
    label: "카테고리 비율",
    defaultWidth: "20%",
    color: "#0891b2",
    option: {
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: [
            { value: 335, name: "반도체" },
            { value: 310, name: "2차전지" },
            { value: 234, name: "바이오" },
            { value: 135, name: "기타" },
          ],
        },
      ],
    },
  },
  {
    id: "chart-c",
    label: "주간 추이",
    defaultWidth: "60%",
    color: "#059669",
    option: {
      tooltip: { trigger: "axis" },
      legend: { data: ["코스피", "코스닥"] },
      xAxis: { type: "category", data: ["월", "화", "수", "목", "금"] },
      yAxis: { type: "value" },
      series: [
        { name: "코스피", type: "line", smooth: true, data: [2500, 2480, 2520, 2510, 2550], itemStyle: { color: "#059669" } },
        { name: "코스닥", type: "line", smooth: true, data: [850, 830, 870, 860, 890], itemStyle: { color: "#f59e0b" } },
      ],
    },
  },
];

// ─── 개별 차트 래퍼 컴포넌트 ─────────────────────────
function ChartPanel({ config, isExpanded, onToggle }) {
  const domRef = useRef(null);
  const instanceRef = useRef(null);

  // ECharts 초기화
  useEffect(() => {
    if (!domRef.current) return;
    const chart = echarts.init(domRef.current);
    chart.setOption(config.option);
    instanceRef.current = chart;
    return () => chart.dispose();
  }, [config.option]);

  // 크기 변경 시 차트 리사이즈
  useEffect(() => {
    const timer = setTimeout(() => {
      instanceRef.current?.resize();
    }, 320); // CSS transition(300ms) 완료 후
    return () => clearTimeout(timer);
  }, [isExpanded]);

  return (
    <div style={{ ...styles.panel, flex: isExpanded ? "0 0 100%" : `0 0 ${config.defaultWidth}` }}>
      {/* 헤더 */}
      <div style={styles.header}>
        <span style={{ ...styles.dot, background: config.color }} />
        <span style={styles.label}>{config.label}</span>
        <button
          style={{ ...styles.toggleBtn, borderColor: config.color, color: config.color }}
          onClick={() => onToggle(config.id)}
          title={isExpanded ? "원래 크기로" : "전체 너비로 확장"}
        >
          {isExpanded ? "◀ 축소" : "▶ 확장"}
        </button>
      </div>

      {/* ECharts 마운트 영역 */}
      <div ref={domRef} style={styles.chartArea} />
    </div>
  );
}

// ─── 메인 대시보드 ────────────────────────────────────
export default function ChartDashboard() {
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>차트 대시보드</h2>
      <p style={styles.hint}>▶ 확장 버튼을 클릭하면 해당 차트가 100% 너비로 펼쳐집니다.</p>

      <div style={styles.row}>
        {CHART_CONFIGS.map((cfg) => (
          <ChartPanel
            key={cfg.id}
            config={cfg}
            isExpanded={expandedId === cfg.id}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 스타일 ───────────────────────────────────────────
const styles = {
  container: {
    padding: "24px",
    fontFamily: "Pretendard, 'Noto Sans KR', sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 4px",
  },
  hint: {
    fontSize: 13,
    color: "#64748b",
    margin: "0 0 16px",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",          // 확장 시 줄바꿈 허용
    gap: "12px",
    alignItems: "flex-start",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    boxSizing: "border-box",
    transition: "flex 0.3s ease",  // 너비 변화 애니메이션
    minWidth: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    flex: 1,
  },
  toggleBtn: {
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: "6px",
    border: "1.5px solid",
    background: "transparent",
    cursor: "pointer",
    transition: "background 0.15s",
    whiteSpace: "nowrap",
  },
  chartArea: {
    width: "100%",
    height: "200px",
  },
};
