import React, { useEffect, useMemo, useState } from 'react';

const SOLUTION = [
  [5,3,4, 6,7,8, 9,1,2],
  [6,7,2, 1,9,5, 3,4,8],
  [1,9,8, 3,4,2, 5,6,7],

  [8,5,9, 7,6,1, 4,2,3],
  [4,2,6, 8,5,3, 7,9,1],
  [7,1,3, 9,2,4, 8,5,6],

  [9,6,1, 5,3,7, 2,8,4],
  [2,8,7, 4,1,9, 6,3,5],
  [3,4,5, 2,8,6, 1,7,9],
];

const LEVELS = [
  [
    [5,3,0, 0,7,0, 0,0,0], [6,0,0, 1,9,5, 0,0,0], [0,9,8, 0,0,0, 0,6,0],
    [8,0,0, 0,6,0, 0,0,3], [4,0,0, 8,0,3, 0,0,1], [7,0,0, 0,2,0, 0,0,6],
    [0,6,0, 0,0,0, 2,8,0], [0,0,0, 4,1,9, 0,0,5], [0,0,0, 0,8,0, 0,7,9],
  ],
  [
    [5,0,0, 0,7,0, 9,0,0], [0,7,0, 1,0,5, 0,0,8], [1,0,8, 0,0,0, 5,6,0],
    [0,5,0, 7,0,0, 0,2,0], [4,0,6, 0,5,0, 7,0,1], [0,1,0, 0,0,4, 0,5,0],
    [0,6,1, 0,0,0, 2,0,4], [2,0,0, 4,0,9, 0,3,0], [0,0,5, 0,8,0, 0,0,9],
  ],
  [
    [0,0,4, 0,7,0, 0,0,0], [6,0,0, 1,0,0, 0,4,0], [0,9,0, 0,0,2, 5,0,0],
    [8,0,0, 0,6,0, 0,0,3], [0,2,0, 8,0,3, 0,9,0], [7,0,0, 0,2,0, 0,0,6],
    [0,0,1, 5,0,0, 0,8,0], [0,8,0, 0,0,9, 0,0,5], [0,0,0, 0,8,0, 1,0,0],
  ],
  [
    [0,0,0, 6,7,0, 0,0,0], [0,7,0, 0,0,5, 0,0,8], [1,0,0, 0,0,0, 5,0,0],
    [0,0,9, 0,6,0, 0,0,0], [4,0,0, 0,0,0, 0,0,1], [0,0,0, 0,2,0, 8,0,0],
    [0,0,1, 0,0,0, 0,0,4], [2,0,0, 4,0,0, 0,3,0], [0,0,0, 0,8,6, 0,0,0],
  ],
  [
    [0,0,0, 0,7,0, 0,0,0], [0,0,2, 0,0,0, 0,0,8], [1,0,0, 0,0,2, 0,0,0],
    [0,5,0, 0,0,0, 0,0,3], [0,0,0, 8,0,3, 0,0,0], [7,0,0, 0,0,0, 0,5,0],
    [0,0,0, 5,0,0, 0,0,4], [2,0,0, 0,0,0, 6,0,0], [0,0,0, 0,8,0, 0,0,0],
  ],
];

const MAX_LEVEL = 5;

function clone(board) {
  return board.map((row) => row.slice());
}

function keyOf(r, c) {
  return `${r},${c}`;
}

function computeGivens(board) {
  const s = new Set();
  board.forEach((row, r) => {
    row.forEach((v, c) => {
      if (v !== 0) s.add(keyOf(r, c));
    });
  });
  return s;
}

function sameBox(r1, c1, r2, c2) {
  return Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3);
}

function findConflicts(board) {
  const bad = new Set();

  const addConflict = (r, c) => bad.add(keyOf(r, c));

  for (let r = 0; r < 9; r++) {
    const seen = new Map();
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (!v) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push({ r, c });
    }
    seen.forEach((arr) => {
      if (arr.length > 1) arr.forEach((p) => addConflict(p.r, p.c));
    });
  }

  for (let c = 0; c < 9; c++) {
    const seen = new Map();
    for (let r = 0; r < 9; r++) {
      const v = board[r][c];
      if (!v) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push({ r, c });
    }
    seen.forEach((arr) => {
      if (arr.length > 1) arr.forEach((p) => addConflict(p.r, p.c));
    });
  }

  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Map();
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const v = board[r][c];
          if (!v) continue;
          if (!seen.has(v)) seen.set(v, []);
          seen.get(v).push({ r, c });
        }
      }
      seen.forEach((arr) => {
        if (arr.length > 1) arr.forEach((p) => addConflict(p.r, p.c));
      });
    }
  }

  return bad;
}

function isComplete(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  return true;
}

function isCorrect(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== SOLUTION[r][c]) return false;
    }
  }
  return true;
}

function Sudoku() {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState(clone(LEVELS[0]));
  const [selected, setSelected] = useState({ r: 0, c: 0 });
  const [solvedState, setSolvedState] = useState('playing');
  const [statusText, setStatusText] = useState('칸을 채우면 자동으로 정답 여부를 판정합니다.');

  const puzzle = useMemo(() => clone(LEVELS[level - 1]), [level]);
  const givens = useMemo(() => computeGivens(puzzle), [puzzle]);
  const conflicts = useMemo(() => findConflicts(board), [board]);

  useEffect(() => {
    setBoard(clone(puzzle));
    setSelected({ r: 0, c: 0 });
    setSolvedState('playing');
    setStatusText('칸을 채우면 자동으로 정답 여부를 판정합니다.');
  }, [puzzle]);

  useEffect(() => {
    if (!isComplete(board)) {
      if (solvedState !== 'playing') setSolvedState('playing');
      return;
    }

    if (isCorrect(board)) {
      setSolvedState('correct');
      if (level >= MAX_LEVEL) {
        setStatusText('정답! 레벨 5까지 모두 완료하셨어요 🎉');
      } else {
        setStatusText('정답! 다음 레벨로 진행할 수 있어요.');
      }
    } else {
      setSolvedState('wrong');
      setStatusText('오답! ‘다시 풀기’를 눌러 현재 레벨을 다시 시작하세요.');
    }
  }, [board, level, solvedState]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const { r, c } = selected;

      if (!Number.isFinite(r) || !Number.isFinite(c)) return;

      const move = (dr, dc) => {
        const nr = Math.max(0, Math.min(8, r + dr));
        const nc = Math.max(0, Math.min(8, c + dc));
        setSelected({ r: nr, c: nc });
      };

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        return move(-1, 0);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        return move(1, 0);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        return move(0, -1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        return move(0, 1);
      }

      if (/^[1-9]$/.test(e.key)) {
        setCellValue(Number(e.key));
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setCellValue(0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, solvedState, givens]);

  const setCellValue = (value) => {
    const { r, c } = selected;
    if (givens.has(keyOf(r, c))) return;
    if (solvedState !== 'playing') return;

    setBoard((prev) => {
      const next = clone(prev);
      next[r][c] = value;
      return next;
    });
  };

  const restartLevel = () => {
    setLevel((prev) => Math.max(1, Math.min(MAX_LEVEL, prev)));
  };

  const clearBoard = () => {
    if (solvedState !== 'playing') return;
    setBoard((prev) => {
      const next = clone(prev);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!givens.has(keyOf(r, c))) next[r][c] = 0;
        }
      }
      return next;
    });
  };

  const retryLevel = () => {
    setLevel((prev) => Math.max(1, Math.min(MAX_LEVEL, prev)));
  };

  const nextLevel = () => {
    if (solvedState !== 'correct') return;
    setLevel((prev) => Math.min(MAX_LEVEL, prev + 1));
  };

  const onCellClick = (r, c) => {
    setSelected({ r, c });
  };

  const levelBadge = `레벨 ${level} / ${MAX_LEVEL}`;

  return (
    <div className="wrap">
      <style>{`
        .wrap { max-width: 560px; margin: 24px auto; }
        h1 { margin: 0 0 10px; font-size: 22px; }
        .toprow { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
        .badge { padding: 6px 10px; border:1px solid #ddd; border-radius: 999px; background:#fff; }
        .bar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin: 10px 0 14px; }
        button { padding: 8px 10px; border: 1px solid #ccc; background:#fff; border-radius:10px; cursor:pointer; }
        button:hover { background:#f5f5f5; }
        button:disabled { opacity: .45; cursor:not-allowed; }
        .grid { display:grid; grid-template-columns: repeat(9, 44px); grid-template-rows: repeat(9, 44px); gap: 2px; user-select:none; touch-action: manipulation; border: 2px solid #444; padding: 2px; border-radius: 12px; background:#fafafa; }
        .cell { width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; border: 1px solid #cfcfcf; background:#fff; font-size: 18px; cursor:pointer; border-radius: 8px; color: #000; }
        .cell.given { font-weight: 800; background:#f3f6ff; cursor: default; color: #000; }
        .cell.selected { outline: 3px solid #3b82f6; outline-offset: -3px; }
        .cell.peer { background:#eef6ff; }
        .cell.conflict { background:#ffe8e8; border-color:#ff6b6b; color: #000; }
        .cell.correctFlash { animation: okflash .6s ease-in-out 1; }
        @keyframes okflash { 0%{transform:scale(1)} 50%{transform:scale(1.05)} 100%{transform:scale(1)} }
        .cell.bR { border-right: 2px solid #444; }
        .cell.bB { border-bottom: 2px solid #444; }

        .pad { display:grid; grid-template-columns: repeat(5, 1fr); gap:8px; margin-top: 8px; }
        .num { padding: 10px 0; text-align:center; border:1px solid #d8d8d8; border-radius:12px; cursor:pointer; background:#fff; }
        .num:hover { background:#f5f5f5; }
        .hint { color:#666; font-size: 13px; margin-top: 10px; line-height: 1.5; }
        .bottomMenu { margin-top: 14px; padding: 12px; border: 1px solid #e5e5e5; border-radius: 14px; background: #fff; display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between; }
        .status { font-size: 14px; color:#333; line-height: 1.4; flex: 1 1 auto; min-width: 200px; }
        .actions { display:flex; gap:8px; flex-wrap:wrap; }
        .ok { color:#0f766e; font-weight:700; }
        .bad { color:#b91c1c; font-weight:700; }
      `}</style>
      <div className="toprow">
        <h1>스도쿠 (최대 5단계)</h1>
        <div className="badge">{levelBadge}</div>
      </div>

      <div className="bar">
        <button onClick={restartLevel}>현재 레벨 처음부터</button>
        <button onClick={clearBoard}>입력 지우기</button>
      </div>

      <div className="grid" aria-label="Sudoku grid">
        {board.map((row, r) =>
          row.map((v, c) => {
            const isGiven = givens.has(keyOf(r, c));
            const isSelected = selected.r === r && selected.c === c;
            const isPeer = r === selected.r || c === selected.c || sameBox(r, c, selected.r, selected.c);
            const isConflict = conflicts.has(keyOf(r, c));
            const classNames = ['cell'];
            if (isGiven) classNames.push('given');
            if (isSelected) classNames.push('selected');
            if (isPeer) classNames.push('peer');
            if (isConflict) classNames.push('conflict');
            if (c === 2 || c === 5) classNames.push('bR');
            if (r === 2 || r === 5) classNames.push('bB');

            return (
              <div
                key={`${r}-${c}`}
                className={classNames.join(' ')}
                onClick={() => onCellClick(r, c)}
              >
                {v !== 0 ? v : ''}
              </div>
            );
          })
        )}
      </div>

      <div style={{ height: 12 }} />

      <div className="pad" aria-label="Number pad">
        {[1,2,3,4,5,6,7,8,9,0].map((n) => (
          <div key={n} className="num" onClick={() => setCellValue(n)}>
            {n === 0 ? '지우기' : n}
          </div>
        ))}
      </div>

      <div className="bottomMenu">
        <div className="status">{statusText}</div>
        <div className="actions">
          <button onClick={retryLevel} disabled={solvedState === 'playing'}>다시 풀기</button>
          <button onClick={nextLevel} disabled={solvedState !== 'correct' || level >= MAX_LEVEL}>다 맞추면 다음 레벨</button>
        </div>
      </div>

      <div className="hint">
        • 칸 클릭 → 숫자패드 또는 키보드(1~9, Backspace/Delete).<br />
        • 같은 행/열/3×3 중복은 빨간색으로 표시됩니다.<br />
        • 모든 칸을 채우면 자동으로 정답/오답을 판정하고, 하단 메뉴가 활성화됩니다.
      </div>
    </div>
  );
}

export default Sudoku;