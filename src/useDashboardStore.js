import { create } from "zustand";

/**
 * useDashboardStore
 * ------------------------------------------------------------------
 * 차트가 여러 개로 늘어나는 구조를 지원하기 위해, 각 차트의 UI 설정을
 * chartId를 키로 하는 맵(charts) 형태로 관리합니다.
 *
 * 이렇게 하면:
 *  - 차트 A의 축/타입이 바뀌어도 차트 B는 리렌더링되지 않음 (selector로 구독)
 *  - 차트 추가/삭제가 스토어 레벨에서 한 곳에서 관리됨
 *  - 그리드에서 선택한 필터(selectedRowKeys 등)도 같이 전역으로 공유 가능
 *
 * 서버에서 가져온 원본 데이터 자체는 이 스토어에 두지 않습니다.
 * (React Query가 서버 상태를 담당 — 캐싱/재요청/로딩 상태 관리)
 */

const createChartConfig = (overrides = {}) => ({
  xAxisKey: null,
  yAxisKeys: [],
  chartType: "line", // line | bar | area | pie | scatter
  ...overrides,
});

let chartIdCounter = 1;
const nextChartId = () => `chart-${chartIdCounter++}`;

export const useDashboardStore = create((set, get) => ({
  // ------------------------------------------------------------------
  // 차트 설정 맵: { [chartId]: { xAxisKey, yAxisKeys, chartType } }
  // ------------------------------------------------------------------
  charts: {
    [nextChartId()]: createChartConfig(),
  },

  // 차트 순서를 별도로 유지 (추가된 순서대로 렌더링하기 위함)
  chartOrder: [],

  // 그리드에서 사용자가 체크박스 등으로 선택한 행 (선택 사항 — 필요 시 차트 필터링에 활용)
  selectedRowIds: [],

  // ------------------------------------------------------------------
  // 차트 추가/삭제
  // ------------------------------------------------------------------
  addChart: (initialConfig = {}) =>
    set((state) => {
      const id = nextChartId();
      return {
        charts: { ...state.charts, [id]: createChartConfig(initialConfig) },
        chartOrder: [...state.chartOrder, id],
      };
    }),

  removeChart: (chartId) =>
    set((state) => {
      const { [chartId]: _removed, ...rest } = state.charts;
      return {
        charts: rest,
        chartOrder: state.chartOrder.filter((id) => id !== chartId),
      };
    }),

  // ------------------------------------------------------------------
  // 개별 차트 설정 변경
  // ------------------------------------------------------------------
  setXAxisKey: (chartId, xAxisKey) =>
    set((state) => ({
      charts: {
        ...state.charts,
        [chartId]: { ...state.charts[chartId], xAxisKey },
      },
    })),

  setYAxisKeys: (chartId, yAxisKeys) =>
    set((state) => ({
      charts: {
        ...state.charts,
        [chartId]: { ...state.charts[chartId], yAxisKeys },
      },
    })),

  setChartType: (chartId, chartType) =>
    set((state) => ({
      charts: {
        ...state.charts,
        [chartId]: { ...state.charts[chartId], chartType },
      },
    })),

  setChartCount: (count) =>
    set((state) => {
      const currentCount = state.chartOrder.length;
      if (count === currentCount || count < 1) {
        return {}; // 변경 없거나 유효하지 않은 숫자면 무시
      }

      let newCharts = { ...state.charts };
      let newChartOrder = [...state.chartOrder];

      if (count > currentCount) {
        // 차트 추가
        const firstChartId = state.chartOrder[0] || Object.keys(state.charts)[0];
        const baseConfig = firstChartId ? state.charts[firstChartId] : {};
        for (let i = 0; i < count - currentCount; i++) {
          const id = nextChartId();
          newCharts[id] = createChartConfig(baseConfig);
          newChartOrder.push(id);
        }
      } else {
        // 차트 삭제 (뒤에서부터)
        const chartsToRemove = newChartOrder.splice(count);
        chartsToRemove.forEach((id) => delete newCharts[id]);
      }
      return { charts: newCharts, chartOrder: newChartOrder };
    }),

  setSelectedRowIds: (ids) => set({ selectedRowIds: ids }),

  // 초기 chartOrder 세팅 (앱 시작 시 최초 차트 하나를 order에 반영)
  initChartOrder: () =>
    set((state) => {
      if (state.chartOrder.length) return {};
      return { chartOrder: Object.keys(state.charts) };
    }),
}));
