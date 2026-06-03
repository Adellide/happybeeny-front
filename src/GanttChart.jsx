import ReactGantt from "@dhx/react-gantt";
import "@dhx/react-gantt/dist/react-gantt.css";

// 0.0~1.0 Hr → Date 변환 헬퍼
const hrToDate = (hr) => {
  const minutes = Math.round(hr * 60);
  return new Date(2024, 0, 1, 0, minutes);
};

const config = {
  // ── 타임라인 스케일 ──────────────────────────────
  scales: [
    {
      unit: "hour",
      step: 1,
      format: "Time(Hr)",           // 윗줄
    },
    {
      unit: "minute",
      step: 12,                     // 1시간 ÷ 5칸 = 0.0, 0.2, 0.4, 0.6, 0.8
      format: (date) =>
        (date.getMinutes() / 60).toFixed(1),  // 아랫줄
    },
  ],
  scale_height: 56,                 // 헤더 2줄 전체 높이
  row_height: 40,
  bar_height: 26,

  start_date: new Date(2024, 0, 1, 0, 0),
  end_date:   new Date(2024, 0, 1, 1, 0),

  // ── 왼쪽 컬럼 ────────────────────────────────────
  grid_width: 400,
  columns: [
    {
      name: "baseId",
      label: "기본ID",
      width: 80,
      align: "center",
      template: (task) => task.baseId,
    },
    {
      name: "head",
      label: "Head",
      width: 80,
      align: "center",
      template: (task) => task.head,
    },
    {
      name: "text",
      label: "Base Nm",
      width: 120,
      align: "center",
    },
    {
      name: "x",
      label: "X",
      width: 60,
      align: "center",
      template: (task) => task.x,
    },
    {
      name: "y",
      label: "Y",
      width: 60,
      align: "center",
      template: (task) => task.y,
    },
  ],
};

// ── DY colspan 헤더를 onGanttReady로 DOM 조작 ──────
const onGanttReady = (ganttInstance) => {
  ganttInstance.attachEvent("onGanttReady", () => {
    const headerCells = document.querySelectorAll(
      ".gantt_grid_head_cell"
    );
    if (!headerCells || headerCells.length < 5) return;

    const scaleHeight = config.scale_height;    // 56px
    const rowH = scaleHeight / 2;               // 28px

    // 기본ID, Head, Base Nm → 세로 전체 차지
    [0, 1, 2].forEach((i) => {
      headerCells[i].style.height = `${scaleHeight}px`;
      headerCells[i].style.lineHeight = `${scaleHeight}px`;
    });

    // X, Y 헤더 → 아래 절반으로 이동
    const xCell = headerCells[3];
    const yCell = headerCells[4];

    [xCell, yCell].forEach((cell) => {
      cell.style.position = "relative";
      cell.style.top = `${rowH}px`;
      cell.style.height = `${rowH}px`;
      cell.style.lineHeight = `${rowH}px`;
    });

    // DY 셀 삽입 (X + Y 위에 absolute로 덮기)
    const gridHeader = xCell.closest(".gantt_grid_scale");
    if (gridHeader) {
      const dyCell = document.createElement("div");
      dyCell.className = "gantt_grid_head_cell";
      dyCell.textContent = "DY";
      dyCell.style.cssText = `
        position: absolute;
        top: 0;
        left: ${xCell.offsetLeft}px;
        width: ${xCell.offsetWidth + yCell.offsetWidth}px;
        height: ${rowH}px;
        line-height: ${rowH}px;
        text-align: center;
        border-bottom: 1px solid #cecece;
        border-left: 1px solid #cecece;
        box-sizing: border-box;
        background: #fff;
        z-index: 2;
      `;
      gridHeader.style.position = "relative";
      gridHeader.appendChild(dyCell);
    }
  });
};

export default function GanttChart() {
  const tasks = [
    {
      id: 1,
      text: "요구사항 분석",
      baseId: "Task 1",
      head: "H1",
      x: 10,
      y: 10,
      start_date: hrToDate(0.0),
      end_date: hrToDate(0.8),
      type: "task",
    },
  ];

  return (
    <div style={{ width: "100%", height: "300px" }}>
      <ReactGantt
        tasks={tasks}
        config={config}
        onGanttReady={onGanttReady}
      />
    </div>
  );
}