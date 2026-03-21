import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Sudoku from './Sudoku';
import Word from './Word';

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 클라우드타입에 배포된 내 API 주소를 여기에 넣으세요!
  const API_URL = "https://port-0-happybeeny-start-mmzs145m514a7c3e.sel3.cloudtype.app/"; 

  useEffect(() => {
    fetch(API_URL)
      .then(response => response.json())
      .then(json => {
        if (json.success) {
          setMessages(json.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("데이터 가져오기 실패:", err);
        setLoading(false);
      });
  }, []);

  return (
    <BrowserRouter> {/* 2. 전체를 감싸는 울타리 */}
    <div className="App">
      <header className="App-header">
        <h1>🚀 안녕 지민아 이제 공부하자 !!!</h1>
        <p>클라우드타입 API + 네온 DB 실시간 연결</p>
        
        <div style={{marginBottom: '20px'}}>
          <Link to="/" style={{color: '#61dafb', marginRight: '15px', textDecoration: 'none'}}>홈</Link>
          <Link to="/Sudoku" style={{color: '#61dafb', marginRight: '15px', textDecoration: 'none'}}>스도쿠</Link>
          <Link to="/Word" style={{color: '#61dafb', textDecoration: 'none'}}>영단어</Link>
        </div>
        
        <Routes>
          <Route path="/" element={
            loading ? (
              <p>데이터 로딩 중...</p>
            ) : (
              <div className="message-list">
                {messages.map((msg, index) => (
                  <div key={index} className="message-item">
                    <span className="date">[{new Date(msg.now).toLocaleDateString()}]</span>
                    <span className="content">{JSON.stringify(msg)}</span>
                  </div>
                ))}
              </div>
            )
          } />
          <Route path="/Sudoku" element={<Sudoku />} />
          <Route path="/Word" element={<Word />} />
        </Routes>
      </header>
    </div>
    </BrowserRouter>
  );
}

export default App;