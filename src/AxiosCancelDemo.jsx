import { useState, useRef } from "react";

// Axios CDN을 사용하기 위해 window.axios 대신 직접 fetch + AbortController 로
// Axios의 CancelToken 패턴과 AbortController 두 가지를 모두 시뮬레이션합니다.
// (Artifact 환경에서는 npm 패키지를 직접 import 할 수 없어 동일한 패턴을 fetch로 재현)

const STAGES = {
  IDLE: "idle",
  LOADING: "loading",
  DONE: "done",
  CANCELLED: "cancelled",
  ERROR: "error",
};

const MOCK_RESULTS = [
  { id: 1, symbol: "005930", name: "삼성전자", price: "78,500", change: "+1.2%" },
  { id: 2, symbol: "000660", name: "SK하이닉스", price: "189,000", change: "-0.8%" },
  { id: 3, symbol: "035420", name: "NAVER", price: "214,500", change: "+2.1%" },
  { id: 4, symbol: "051910", name: "LG화학", price: "312,000", change: "-1.4%" },
  { id: 5, symbol: "006400", name: "삼성SDI", price: "267,000", change: "+0.6%" },
];

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ── 실제 프로젝트에서의 Axios 코드 스니펫 (표시용) ──────────────
const CODE_SNIPPET = `// ① AbortController 방식 (Axios v1.x 권장)
const controller = new AbortController();

axios.get('/api/stocks', {
  signal: controller.signal,
});

// 취소할 때
controller.abort();

// ② CancelToken 방식 (Axios v0.x ~ v1.x 레거시)
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios.get('/api/stocks', {
  cancelToken: source.token,
});

// 취소할 때
source.cancel('사용자가 요청을 취소했습니다.');

// ③ 에러 처리
try {
  const res = await axios.get('/api/stocks', { signal });
  setData(res.data);
} catch (err) {
  if (axios.isCancel(err)) {
    console.log('요청 취소됨:', err.message);
  } else {
    console.error('오류:', err);
  }
}`;

export default function App() {
  const [stage, setStage] = useState(STAGES.IDLE);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  const startFetch = async () => {
    // AbortController 생성 (= Axios의 signal 옵션에 전달하는 것과 동일)
    const controller = new AbortController();
    abortRef.current = controller;

    setStage(STAGES.LOADING);
    setProgress(0);
    setResults([]);
    startRef.current = Date.now();

    // 경과 시간 타이머
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1));
    }, 100);

    try {
      // 프로그레스 시뮬레이션 (실제 Axios에서는 onDownloadProgress 콜백 사용)
      for (let i = 0; i <= 90; i += 10) {
        if (controller.signal.aborted) throw new DOMException("cancelled", "AbortError");
        setProgress(i);
        await sleep(300);
      }

      // 최종 데이터 로드 (실제 코드: const res = await axios.get(url, { signal }))
      if (controller.signal.aborted) throw new DOMException("cancelled", "AbortError");
      await sleep(500);
      setProgress(100);
      setResults(MOCK_RESULTS);
      setStage(STAGES.DONE);
    } catch (err) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        setStage(STAGES.CANCELLED);
      } else {
        setStage(STAGES.ERROR);
      }
    } finally {
      clearInterval(timerRef.current);
    }
  };

  const cancelFetch = () => {
    if (abortRef.current) {
      abortRef.current.abort(); // ← axios의 source.cancel() 또는 controller.abort()
    }
  };

  const reset = () => {
    setStage(STAGES.IDLE);
    setProgress(0);
    setResults([]);
    setElapsed(0);
  };

  const statusColor = {
    [STAGES.IDLE]: "#64748b",
    [STAGES.LOADING]: "#3b82f6",
    [STAGES.DONE]: "#10b981",
    [STAGES.CANCELLED]: "#f59e0b",
    [STAGES.ERROR]: "#ef4444",
  };

  const statusLabel = {
    [STAGES.IDLE]: "대기 중",
    [STAGES.LOADING]: `조회 중... ${elapsed}s`,
    [STAGES.DONE]: `완료 (${elapsed}s)`,
    [STAGES.CANCELLED]: "취소됨",
    [STAGES.ERROR]: "오류 발생",
  };

  return (
    <div style={styles.root}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.logo}>📡</span>
          <h1 style={styles.title}>Axios Cancel Demo</h1>
        </div>
        <p style={styles.subtitle}>AbortController · CancelToken 패턴 시뮬레이션</p>
      </div>

      {/* 컨트롤 패널 */}
      <div style={styles.card}>
        <div style={styles.statusRow}>
          <span style={styles.statusDot(statusColor[stage])} />
          <span style={{ ...styles.statusText, color: statusColor[stage] }}>
            {statusLabel[stage]}
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
              background:
                stage === STAGES.CANCELLED
                  ? "#f59e0b"
                  : stage === STAGES.DONE
                  ? "#10b981"
                  : "linear-gradient(90deg, #3b82f6, #6366f1)",
              transition: stage === STAGES.CANCELLED ? "none" : "width 0.3s ease",
            }}
          />
        </div>
        <div style={styles.progressLabel}>{progress}%</div>

        {/* 버튼 */}
        <div style={styles.btnRow}>
          {stage === STAGES.IDLE || stage === STAGES.DONE || stage === STAGES.CANCELLED || stage === STAGES.ERROR ? (
            <button style={styles.btnPrimary} onClick={stage === STAGES.IDLE ? startFetch : reset}>
              {stage === STAGES.IDLE ? "🔍 조회 시작" : "🔄 다시 시도"}
            </button>
          ) : null}

          {stage === STAGES.LOADING && (
            <button style={styles.btnDanger} onClick={cancelFetch}>
              ✕ 취소
            </button>
          )}
        </div>
      </div>

      {/* 결과 테이블 */}
      {results.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>조회 결과</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                {["종목코드", "종목명", "현재가", "등락률"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={row.id} style={{ animationDelay: `${i * 80}ms`, ...styles.tr }}>
                  <td style={styles.td}>{row.symbol}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{row.name}</td>
                  <td style={{ ...styles.td, fontFamily: "monospace" }}>{row.price}</td>
                  <td style={{
                    ...styles.td,
                    color: row.change.startsWith("+") ? "#10b981" : "#ef4444",
                    fontWeight: 700,
                  }}>
                    {row.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 취소 메시지 */}
      {stage === STAGES.CANCELLED && (
        <div style={styles.cancelBanner}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <strong>요청이 취소되었습니다</strong>
            <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.8 }}>
              axios.isCancel(err) → <code>true</code> | AbortController.signal.aborted → <code>true</code>
            </p>
          </div>
        </div>
      )}

      {/* 코드 스니펫 토글 */}
      <div style={styles.card}>
        <button style={styles.codeToggle} onClick={() => setShowCode((v) => !v)}>
          {showCode ? "▲" : "▼"} 실제 Axios 코드 보기
        </button>
        {showCode && (
          <pre style={styles.pre}>{CODE_SNIPPET}</pre>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f172a; font-family: 'Noto Sans KR', sans-serif; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        tr { animation: fadeIn 0.3s ease both; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0f172a",
    padding: "32px 16px",
    maxWidth: 640,
    margin: "0 auto",
    color: "#e2e8f0",
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  logo: { fontSize: 28 },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    paddingLeft: 38,
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 16,
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  statusDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
    boxShadow: `0 0 8px ${color}`,
    flexShrink: 0,
  }),
  statusText: {
    fontSize: 14,
    fontWeight: 600,
  },
  progressTrack: {
    height: 8,
    background: "#0f172a",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  progressLabel: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "right",
    marginBottom: 16,
  },
  btnRow: {
    display: "flex",
    gap: 10,
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  btnDanger: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif",
    animation: "pulse 1s ease infinite",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 14,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    fontSize: 11,
    color: "#64748b",
    borderBottom: "1px solid #334155",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  tr: {
    borderBottom: "1px solid #1e293b",
  },
  td: {
    padding: "10px 10px",
    color: "#cbd5e1",
    fontSize: 14,
  },
  cancelBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "#451a03",
    border: "1px solid #92400e",
    borderRadius: 10,
    padding: "14px 18px",
    marginBottom: 16,
    color: "#fde68a",
  },
  codeToggle: {
    background: "none",
    border: "none",
    color: "#60a5fa",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    padding: 0,
    marginBottom: 0,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  pre: {
    marginTop: 14,
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "16px",
    fontSize: 12,
    lineHeight: 1.7,
    color: "#7dd3fc",
    fontFamily: "'JetBrains Mono', monospace",
    overflowX: "auto",
    whiteSpace: "pre",
  },
};
