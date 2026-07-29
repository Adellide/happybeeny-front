import React, { useEffect, useMemo, useRef } from "react";
import { Space, Alert, Row, Col, Select, Typography, Button, Card } from "antd";

import { useQuery } from "@tanstack/react-query"; // useQuery import 추가
import * as echarts from "echarts/core";
import { useDashboardStore } from "../store/useDashboardStore";
import { inferFieldTypes, aggregateByAxis, aggregateForPie } from "../utils/dataUtils";
import DataGridPanel from "./DataGridPanel";
import ChartPanel from "./ChartPanel";

const { Text } = Typography;

// useWaferMeasurements 훅의 기능을 대체할 모의 데이터 페칭 함수
const fetchWaferMeasurements = async () => {
  // 실제 API 호출 대신 500ms 지연 후 샘플 데이터 반환
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { waferId: "W001", processStep: "Etch", temperature: 25.5, pressure: 100, defectCount: 5 },
    { waferId: "W002", processStep: "Deposit", temperature: 30.1, pressure: 120, defectCount: 2 },
    { waferId: "W003", processStep: "Etch", temperature: 26.0, pressure: 105, defectCount: 7 },
    { waferId: "W004", processStep: "Clean", temperature: 22.3, pressure: 95, defectCount: 1 },
    { waferId: "W005", processStep: "Deposit", temperature: 31.5, pressure: 125, defectCount: 3 },
    { waferId: "W006", processStep: "Clean", temperature: 23.0, pressure: 98, defectCount: 0 },
    { waferId: "W007", processStep: "Etch", temperature: 25.8, pressure: 102, defectCount: 6 },
    { waferId: "W008", processStep: "Deposit", temperature: 30.8, pressure: 118, defectCount: 4 },
    { waferId: "W009", processStep: "Clean", temperature: 22.8, pressure: 97, defectCount: 0 },
    { waferId: "W010", processStep: "Etch", temperature: 26.2, pressure: 103, defectCount: 8 },
  ];
};

const CHART_TYPE_OPTIONS = [
  { label: "라인", value: "line" },
  { label: "바", value: "bar" },
  { label: "영역", value: "area" },
  { label: "파이", value: "pie" },
  { label: "스캐터", value: "scatter" },
];

/**
 * Dashboard
 * ------------------------------------------------------------------
 * 상단: 그리드 (React Query로 가져온 서버 데이터)
 * 하단: 차트 패널 N개 (Zustand chartOrder 순서대로 렌더링, 개수 가변)
 */
export default function Dashboard() {
  // useWaferMeasurements 훅 대신 useQuery를 직접 사용
  const { data: rowData, isLoading, isError, error } = useQuery({
    queryKey: ["waferMeasurements"],
    queryFn: fetchWaferMeasurements,
  });

  const chartOrder = useDashboardStore((state) => state.chartOrder);
  const chartConfig = useDashboardStore((state) => state.charts[state.chartOrder[0]]);
  const removeChart = useDashboardStore((state) => state.removeChart);
  const initChartOrder = useDashboardStore((state) => state.initChartOrder);
  const setXAxisKey = useDashboardStore((state) => state.setXAxisKey);
  const setYAxisKeys = useDashboardStore((state) => state.setYAxisKeys);
  const setChartType = useDashboardStore((state) => state.setChartType);
  const setChartCount = useDashboardStore((state) => state.setChartCount);

  useEffect(() => {
    initChartOrder();
  }, [initChartOrder]);

  // 차트 인스턴스들을 관리하기 위한 ref
  const chartRefs = useRef({});

  // 차트 인스턴스들이 준비되면 connect API로 그룹화하여 액션을 동기화
  useEffect(() => {
    const instances = Object.values(chartRefs.current).filter(Boolean);
    if (instances.length > 1) {
      echarts.connect(instances);
    }
    // 차트 개수가 변경될 때 기존 연결을 해제
    return () => {
      if (instances.length > 1) {
        echarts.disconnect(instances);
      }
    };
  }, [chartOrder.length]);

  // 차트 인스턴스를 ref에 등록하는 콜백
  const handleChartReady = (chartId, instance) => {
    chartRefs.current[chartId] = instance;
  };


  const { categoricalKeys, numericKeys } = useMemo(
    () => inferFieldTypes(rowData ?? []),
    [rowData]
  );

  const xAxisOptions = useMemo(
    () => categoricalKeys.map((key) => ({ label: key, value: key })),
    [categoricalKeys]
  );
  const yAxisOptions = useMemo(
    () => numericKeys.map((key) => ({ label: key, value: key })),
    [numericKeys]
  );

  // 최초 렌더 시 기본 축 설정 (스토어에 값이 없으면 첫 후보로 자동 지정)
  const effectiveXAxisKey = chartConfig?.xAxisKey ?? categoricalKeys[0];
  const effectiveYAxisKeys = chartConfig?.yAxisKeys?.length
    ? chartConfig.yAxisKeys
    : numericKeys.slice(0, 2);
  const chartType = chartConfig?.chartType ?? "line";

  const handleXAxisChange = (value) => chartOrder.forEach(id => setXAxisKey(id, value));
  const handleYAxisChange = (value) => chartOrder.forEach(id => setYAxisKeys(id, value));
  const handleChartTypeChange = (value) => chartOrder.forEach(id => setChartType(id, value));

  const chartOption = useMemo(() => {
    const xKey = effectiveXAxisKey;
    const yKeys = effectiveYAxisKeys;

    // ChartPanel에서 toolbox를 제거하고, Dashboard에서 dataZoom을 직접 제어
    const dataZoom = [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 8,
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100,
      },
    ];

    // const toolbox = {
    //   orient: "vertical",
    //   left: 6,
    //   top: "middle",
    //   itemSize: 14,
    //   feature: {
    //     dataZoom: {
    //       show: true,
    //       title: { zoom: "확대", back: "확대 취소" },
    //       yAxisIndex: "none",
    //     },
    //     restore: { show: true, title: "초기화" },
    //     saveAsImage: { show: true, title: "이미지 저장" },
    //   },
    // };

    if (chartType === "pie") {
      const yKey = yKeys[0];
      const pieData = yKey ? aggregateForPie(rowData, xKey, yKey) : [];
      return {
        tooltip: { trigger: "item" },
        legend: { top: "bottom" },
        series: [
          {
            name: yKey ?? "",
            type: "pie",
            radius: ["35%", "65%"],
            itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
            label: { formatter: "{b}: {d}%" },
            data: pieData,
          },
        ],
      };
    }

    const { categories, seriesData } = aggregateByAxis(rowData, xKey, yKeys);
    const isArea = chartType === "area";

    if (chartType === "scatter") {
      return {
        tooltip: { trigger: "item" },
        legend: { data: yKeys, top: 0 },
        xAxis: { type: "category", data: categories },
        dataZoom,
        yAxis: { type: "value" },
        series: yKeys.map((key) => ({
          name: key,
          type: "scatter",
          symbolSize: 12,
          data: seriesData[key] ?? [],
        })),
        grid: { left: 60, right: 30, top: 60, bottom: 60 },
      };
    }

    return {
      tooltip: { trigger: "axis" },
      legend: { data: yKeys, top: 0 },
      xAxis: { type: "category", data: categories, boundaryGap: chartType === "bar" },
      yAxis: { type: "value" },
      dataZoom,
      series: yKeys.map((key) => ({
        name: key, type: isArea ? "line" : chartType, smooth: isArea, areaStyle: isArea ? {} : undefined, data: seriesData[key] ?? [],
      })),
      grid: { left: 60, right: 30, top: 60, bottom: 60 },
    };
  }, [rowData, effectiveXAxisKey, effectiveYAxisKeys, chartType]);

  // --- 통합 툴박스 핸들러 ---
  const handleSaveAllCharts = () => {
    Object.entries(chartRefs.current).forEach(([id, instance]) => {
      if (!instance) return;
      const dataUrl = instance.getDataURL({ pixelRatio: 2, backgroundColor: "#fff" });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${id}.png`;
      link.click();
    });
  };

  const handlePrintAllCharts = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write("<html><head><title>차트 인쇄</title></head><body style='display:flex; flex-wrap:wrap; gap:16px;'>");
    Object.values(chartRefs.current).forEach(instance => {
      if (!instance) return;
      const dataUrl = instance.getDataURL({ pixelRatio: 2, backgroundColor: "#fff" });
      printWindow.document.write(`<img src="${dataUrl}" style="width:48%;" />`);
    });
    printWindow.document.write('<script>window.onload = () => { window.print(); window.close(); }</script></body></html>');
    printWindow.document.close();
  };

  const handleRestoreAllCharts = () => {
    Object.values(chartRefs.current).forEach(instance => {
      instance?.dispatchAction({ type: 'restore' });
    });
  };

  if (isError) {
    return (
      <Alert
        type="error"
        message="데이터를 불러오지 못했습니다"
        description={error?.message}
        showIcon
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <DataGridPanel rowData={rowData} loading={isLoading} />

      <Card size="small">
        <Space size={16} wrap>
          <Space direction="vertical" size={4}>
            <Text type="secondary">X축</Text>
            <Select
              style={{ width: 160 }}
              value={effectiveXAxisKey}
              onChange={handleXAxisChange}
              options={xAxisOptions}
              disabled={!rowData?.length}
            />
          </Space>

          <Space direction="vertical" size={4}>
            <Text type="secondary">Y축 (시리즈)</Text>
            <Select
              mode="multiple"
              allowClear
              style={{ minWidth: 220 }}
              placeholder="표시할 항목 선택"
              value={effectiveYAxisKeys}
              onChange={handleYAxisChange}
              options={yAxisOptions}
              maxTagCount="responsive"
              disabled={!rowData?.length || chartType === "pie"}
            />
          </Space>

          <Space direction="vertical" size={4}>
            <Text type="secondary">차트 타입</Text>
            <Select
              style={{ width: 140 }}
              value={chartType}
              onChange={handleChartTypeChange}
              options={CHART_TYPE_OPTIONS}
              disabled={!rowData?.length}
            />
          </Space>

          <Space direction="vertical" size={4}>
            <Text type="secondary">차트 개수</Text>
            <Select
              style={{ width: 100 }}
              value={chartOrder.length}
              onChange={(value) => setChartCount(value)}
              options={[1, 2, 3, 4, 5].map(n => ({ label: `${n}개`, value: n }))}
              disabled={!rowData?.length}
            />
          </Space>

          <Space direction="vertical" size={4}>
            <Text type="secondary">차트 제어</Text>
            <Space>
              <Button onClick={handleRestoreAllCharts} disabled={!rowData?.length}>초기화</Button>
              <Button onClick={handleSaveAllCharts} disabled={!rowData?.length}>전체 이미지 저장</Button>
              <Button onClick={handlePrintAllCharts} disabled={!rowData?.length}>전체 프린트</Button>
            </Space>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {chartOrder.map((chartId) => (
          <Col key={chartId} xs={24} xl={12}>
            <ChartPanel
              chartId={chartId}
              option={chartOption}
              onRemove={removeChart}
              onChartReady={(instance) => handleChartReady(chartId, instance)}
            />
          </Col>
        ))}
      </Row>
    </Space>
  );
}
