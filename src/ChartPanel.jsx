import React from "react";
import { Card, Button, Tooltip } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";

/**
 * ChartPanel
 * ------------------------------------------------------------------
 * chartId로 Zustand 스토어에서 자신의 설정(xAxisKey, yAxisKeys, chartType)만
 * 구독합니다. 다른 차트의 설정 변경은 이 컴포넌트를 리렌더링하지 않습니다.
 *
 * - 상단: X축 선택 / Y축(다중) 선택 / 차트 타입 선택
 * - 차트 좌측: ECharts 내장 toolbox (프린트/확대/복원)
 */
export default function ChartPanel({
  chartId, 
  option,
  onRemove,
  onChartReady,
}) {
  return (
    <Card
      size="small"
      title={`차트 · ${chartId}`}
      extra={
        onRemove && (
          <Tooltip title="차트 삭제">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => onRemove(chartId)}
            />
          </Tooltip>
        )
      }
    >
      <ReactECharts
        option={option}
        onChartReady={onChartReady}
        style={{ height: 360, width: "100%" }}
        notMerge
        lazyUpdate
      />
    </Card>
  );
}
