import React, { useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";

const DIM_OPACITY = 0.08;

/**
 * 공통 ECharts 컴포넌트
 *
 * Props:
 *   option      - ECharts option 객체 (필수)
 *   style       - 컨테이너 style (기본: { width: "100%", height: "100%" })
 *   className   - 컨테이너 className
 *   theme       - echarts 테마명
 *   onChartReady(instance) - 차트 인스턴스 콜백 (외부에서 인스턴스 필요할 때)
 *   dimOnLegend - legend 클릭 시 opacity dimming 활성화 여부 (기본: true)
 */
export default function EChartBase({
  option,
  style,
  className,
  theme,
  onChartReady,
  dimOnLegend = true,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);       // echarts 인스턴스
  const highlightedRef = useRef(null); // 현재 하이라이트된 시리즈명

  const getMergedOption = useCallback((option) => {
    if (!option) return option;

    return {
      ...option,
      // 공통 기본값이나 추가 기능을 이곳에서 병합할 수 있습니다.
      tooltip: option.tooltip ?? { trigger: "axis" },
    };
  }, []);

  const handleLegendChanged = useCallback((params) => {
    const chart = chartRef.current;
    if (!chart) return;

    const clicked = params.name;
    const isReset = highlightedRef.current === clicked;
    highlightedRef.current = isReset ? null : clicked;

    const raw = chart.getOption();
    // getOption() 은 각 항목을 배열로 래핑해서 반환
    const seriesArr = Array.isArray(raw.series?.[0])
      ? raw.series[0]
      : (raw.series ?? []);

    if (!seriesArr.length) return;

    chart.setOption(
      {
        series: seriesArr.map((s) => {
          const active = isReset || s.name === clicked;
          return {
            ...s,
            // scatter / bar / line / pie 공통
            itemStyle: { ...(s.itemStyle ?? {}), opacity: active ? 1 : DIM_OPACITY },
            // line 계열 선 자체
            lineStyle: { ...(s.lineStyle ?? {}), opacity: active ? 1 : DIM_OPACITY },
            // area
            areaStyle: s.areaStyle
              ? { ...s.areaStyle, opacity: active ? (s.areaStyle.opacity ?? 0.6) : DIM_OPACITY }
              : s.areaStyle,
            // markLine (추세선 등)
            markLine: s.markLine
              ? {
                  ...s.markLine,
                  lineStyle: {
                    ...(s.markLine.lineStyle ?? {}),
                    opacity: active ? (s.markLine.lineStyle?.opacity ?? 0.8) : DIM_OPACITY,
                  },
                  label: {
                    ...(s.markLine.label ?? {}),
                    color: active ? undefined : "rgba(0,0,0,0.15)",
                  },
                }
              : s.markLine,
          };
        }),
      },
      false
    );

    // ECharts 기본 토글(숨기기) 동작 방지 → 항상 전체 선택 유지
    chart.dispatchAction({ type: "legendAllSelect" });
  }, []);

  // ── 초기화: 마운트 시 한 번만 ──────────────────────────────────────
  useEffect(() => {
    const chart = echarts.init(containerRef.current, theme ?? null);
    chartRef.current = chart;
    onChartReady?.(chart);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]); // theme 바뀌면 재초기화

  // ── option 변경 시 setOption ────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !option) return;
    const mergedOption = getMergedOption(option);
    chart.setOption(mergedOption, { notMerge: false, lazyUpdate: true });
  }, [option, getMergedOption]);

  // ── legend dimming 이벤트 등록 ──────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !dimOnLegend) return;

    chart.on("legendselectchanged", handleLegendChanged);
    return () => chart.off("legendselectchanged", handleLegendChanged);
  }, [dimOnLegend, handleLegendChanged]); // dimOnLegend prop 바뀌면 재등록

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
