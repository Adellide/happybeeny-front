import React, { useEffect, useState } from 'react';
import './App.css';

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
    <div className="App">
      <header className="App-header">
        <h1>🚀 안녕 지민아 이제 공부하자 !!!</h1>
        <p>클라우드타입 API + 네온 DB 실시간 연결</p>
        
        {loading ? (
          <p>데이터 로딩 중...</p>
        ) : (
          <div className="message-list">
            {messages.map((msg) => (
              <div key={msg.id} className="message-item">
                <span className="date">[{new Date(msg.created_at).toLocaleDateString()}]</span>
                <span className="content">{msg.content}</span>
              </div>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;