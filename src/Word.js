import React, { useState, useEffect } from 'react';
import './Word.css';

const MAX_LEVEL = 5;

const LEVELS = [
  {
    title: "레벨 1 (쉬움)",
    text: "오늘 날씨가 _ _ 요.",
    answer: ["좋","아"],
    letters: ["좋","아","나","다","행","복","비","눈","맑","흐","덥","춥"]
  },
  {
    title: "레벨 2",
    text: "저는 _ _ 을 좋아해요.",
    answer: ["커","피"],
    letters: ["커","피","차","물","빵","밥","국","면","맛","집","달","콤"]
  },
  {
    title: "레벨 3",
    text: "성공의 비결은 _ _ _ _ 입니다.",
    answer: ["꾸","준","함"],
    letters: ["꾸","준","함","인","내","노","력","열","정","성","실","꿈","희"]
  },
  {
    title: "레벨 4",
    text: "책을 읽으면 _ _ _ _ 이(가) 넓어져요.",
    answer: ["시","야"],
    letters: ["시","야","견","문","지","식","마","음","생","각","세","상","길","빛"]
  },
  {
    title: "레벨 5 (어려움)",
    text: "어려움 속에서도 _ _ _ _ 을(를) 잃지 마세요.",
    answer: ["희","망"],
    letters: ["희","망","용","기","자","신","감","끈","기","인","내","미","래","빛","꿈"]
  }
];

function Word() {
  const [level, setLevelState] = useState(1);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [solvedState, setSolvedState] = useState("playing");

  const setLevel = (n) => {
    const newLevel = Math.max(1, Math.min(MAX_LEVEL, n));
    setLevelState(newLevel);
    setSolvedState("playing");
    const L = LEVELS[newLevel - 1];
    const blankCount = (L.text.match(/_/g) || []).length;
    setSlots(Array(blankCount).fill(""));
    setSelectedSlot(0);
  };

  useEffect(() => {
    setLevel(1);
  }, []);

  const renderSentence = () => {
    const L = LEVELS[level - 1];
    const parts = L.text.split('_');
    const elements = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
      if (i < parts.length - 1) {
        const className = `blank ${selectedSlot === i ? 'selected' : ''} ${solvedState === 'correct' && slots[i] === L.answer[i] ? 'correct' : ''} ${solvedState === 'wrong' && slots[i] !== L.answer[i] ? 'wrong' : ''}`;
        elements.push(
          <span
            key={`blank-${i}`}
            className={className}
            onClick={() => setSelectedSlot(i)}
          >
            {slots[i] || '□'}
          </span>
        );
      }
    }
    return elements;
  };

  const renderPad = () => {
    const L = LEVELS[level - 1];
    const letters = [...new Set(L.letters)].slice(0, 21);
    const keys = letters.map((ch, idx) => (
      <div key={idx} className="key" onClick={() => inputChar(ch)}>
        {ch}
      </div>
    ));
    keys.push(
      <div key="del" className="key wide" onClick={() => inputChar('')}>
        지우기
      </div>
    );
    keys.push(
      <div key="next" className="key wide" onClick={() => moveSlot(1)}>
        다음칸
      </div>
    );
    return keys;
  };

  const moveSlot = (delta) => {
    const count = slots.length;
    setSelectedSlot((prev) => (prev + delta + count) % count);
  };

  const inputChar = (ch) => {
    if (solvedState !== "playing") return;
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[selectedSlot] = ch;
      return newSlots;
    });
    if (ch && selectedSlot < slots.length - 1) {
      setSelectedSlot(selectedSlot + 1);
    }
  };

  const isComplete = () => slots.every(v => v && v.length > 0);

  const isCorrect = () => {
    const ans = LEVELS[level - 1].answer;
    if (ans.length !== slots.length) return false;
    for (let i = 0; i < ans.length; i++) {
      if (slots[i] !== ans[i]) return false;
    }
    return true;
  };

  useEffect(() => {
    if (isComplete()) {
      if (isCorrect()) {
        setSolvedState("correct");
      } else {
        setSolvedState("wrong");
      }
    }
  }, [slots]);

  const handleRestart = () => setLevel(level);
  const handleClear = () => {
    if (solvedState !== "playing") return;
    setSlots(slots.map(() => ""));
    setSelectedSlot(0);
  };
  const handleBack = () => window.location.href = "index.html";
  const handleRetry = () => setLevel(level);
  const handleNext = () => {
    if (solvedState !== "correct") return;
    setLevel(level + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') { e.preventDefault(); moveSlot(1); }
      if (e.key === 'ArrowLeft') moveSlot(-1);
      if (e.key === 'ArrowRight') moveSlot(1);
      if (e.key === 'Backspace' || e.key === 'Delete') inputChar('');
      if (e.key && e.key.length === 1 && !/\s/.test(e.key)) {
        inputChar(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlot, solvedState, slots]);

  const L = LEVELS[level - 1];
  const statusText = solvedState === "correct" ? (level >= MAX_LEVEL ? `<span class="ok">정답!</span> 레벨 5까지 모두 완료하셨어요 🎉` : `<span class="ok">정답!</span> 다음 레벨로 진행할 수 있어요.`) : solvedState === "wrong" ? `<span class="bad">오답!</span> 틀린 칸이 표시됐어요. '다시풀기'를 눌러 재시작하세요.` : "모든 빈칸을 채우면 자동으로 정답을 판정합니다.";

  return (
    <div className="wrap">
      <div className="toprow">
        <div>
          <h1>낱말게임 (빈칸 채우기)</h1>
          <div className="hint">빈칸(□)을 클릭한 뒤 글자를 입력하세요. (키보드도 가능)</div>
        </div>
        <div className="badge">레벨 {level} / {MAX_LEVEL}</div>
      </div>

      <div className="card">
        <p className="promptTitle">문제 - {L.title}</p>
        <div className="sentence">
          {renderSentence()}
        </div>

        <div className="bar">
          <button onClick={handleRestart}>현재 레벨 처음부터</button>
          <button onClick={handleClear}>전체 지우기</button>
          <button onClick={handleBack}>메인으로</button>
        </div>

        <div className="pad">
          {renderPad()}
        </div>

        <div className="bottomMenu">
          <div className="status" dangerouslySetInnerHTML={{ __html: statusText }}></div>
          <div className="actions">
            <button onClick={handleRetry} disabled={solvedState !== "wrong"}>틀렸으면 다시풀기</button>
            <button onClick={handleNext} disabled={solvedState !== "correct" || level >= MAX_LEVEL}>
              {level >= MAX_LEVEL ? "최종 단계 완료 🎉" : "다 맞추면 다음레벨"}
            </button>
          </div>
        </div>

        <div className="hint">
          • 키보드 입력: 한 글자 입력 / Backspace(Delete)로 지우기 / Tab으로 다음 빈칸 이동<br/>
          • 레벨 1 → 5로 갈수록 빈칸 수가 늘어나고 단어가 어려워집니다.
        </div>
      </div>
    </div>
  );
}

export default Word;