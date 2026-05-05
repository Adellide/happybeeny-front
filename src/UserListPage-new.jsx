// UserListPage.jsx - getData 호출 + AbortController 취소 샘플

import { useState, useEffect, useRef } from "react";
import { getData } from "./apiUtils";

export default function UserListPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [aborted, setAborted] = useState(false);

  // 현재 진행 중인 요청의 AbortController 를 ref 로 보관
  const controllerRef = useRef(null);

  // ─── 조회 ─────────────────────────────────────────────
  const fetchUsers = async () => {
    // 이전 요청이 아직 살아 있으면 먼저 취소
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setAborted(false);

    try {
      // getData(url, params, signal) 호출
      const data = await getData(
        "https://jsonplaceholder.typicode.com/users",
        {},
        controller.signal
      );

      // null 이면 동일 URL+params 가 이미 pending 중 → 상태 초기화 후 종료
      if (data === null) {
        setLoading(false);
        return;
      }

      setUsers(data);
    } catch (err) {
      if (axios.isCancel?.(err) || err.name === "CanceledError" || err.name === "AbortError") {
        // AbortController 로 취소된 경우
        setAborted(true);
      } else {
        setError(err.message ?? "알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  // ─── 취소 ─────────────────────────────────────────────
  const cancelFetch = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  };

  // 언마운트 시 진행 중인 요청 자동 취소
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  // ─── 렌더링 ───────────────────────────────────────────
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>유저 목록 조회</h1>

      <div style={styles.buttonRow}>
        <button
          style={{ ...styles.button, ...styles.primaryButton }}
          onClick={fetchUsers}
          disabled={loading}
        >
          {loading ? "조회 중..." : "조회"}
        </button>

        <button
          style={{
            ...styles.button,
            ...styles.cancelButton,
            opacity: loading ? 1 : 0.4,
            cursor: loading ? "pointer" : "default",
          }}
          onClick={cancelFetch}
          disabled={!loading}
        >
          취소
        </button>
      </div>

      {/* 상태 메시지 */}
      {aborted && <p style={styles.abortMsg}>⚠️ 요청이 취소되었습니다.</p>}
      {error   && <p style={styles.errorMsg}>❌ 오류: {error}</p>}

      {/* 결과 테이블 */}
      {users.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>이름</th>
              <th style={styles.th}>이메일</th>
              <th style={styles.th}>전화번호</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={styles.tr}>
                <td style={styles.td}>{user.id}</td>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && users.length === 0 && !aborted && !error && (
        <p style={styles.emptyMsg}>조회 버튼을 눌러 데이터를 불러오세요.</p>
      )}
    </div>
  );
}

// ─── 인라인 스타일 ─────────────────────────────────────
const styles = {
  container: {
    maxWidth: 760,
    margin: "40px auto",
    padding: "0 20px",
    fontFamily: "Pretendard, 'Noto Sans KR', sans-serif",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
    color: "#1a1a2e",
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  primaryButton: {
    background: "#4f46e5",
    color: "#fff",
  },
  cancelButton: {
    background: "#ef4444",
    color: "#fff",
  },
  abortMsg: { color: "#d97706", fontWeight: 600 },
  errorMsg:  { color: "#dc2626", fontWeight: 600 },
  emptyMsg:  { color: "#6b7280" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 8,
    fontSize: 14,
  },
  th: {
    background: "#4f46e5",
    color: "#fff",
    padding: "10px 14px",
    textAlign: "left",
  },
  tr: { borderBottom: "1px solid #e5e7eb" },
  td: { padding: "10px 14px", color: "#374151" },
};
