import React, { useState, useRef } from 'react';

const DataFetcher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // AbortController를 저장할 ref (렌더링 사이에도 값을 유지)
  const abortControllerRef = useRef(null);

  const fetchData = async () => {
    // 1. 새로운 요청 시작 시 기존 요청이 있다면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. 새로운 AbortController 인스턴스 생성
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // 3. fetch 옵션에 signal 전달
      const response = await fetch('https://jsonplaceholder.typicode.com/photos', {
        signal: controller.signal
      });

      if (!response.ok) throw new Error('데이터를 가져오는데 실패했습니다.');
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      // 4. 에러가 'AbortError'인 경우와 일반 에러 구분
      if (err.name === 'AbortError') {
        console.log('요청이 취소되었습니다.');
        setError('사용자에 의해 조회가 취소되었습니다.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      // 요청이 끝났으므로 ref 초기화
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    // 5. 취소 버튼 클릭 시 abort() 메서드 호출
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>데이터 조회 컨트롤러</h2>
      
      <button onClick={fetchData} disabled={loading}>
        {loading ? '조회 중...' : '조회 시작'}
      </button>
      
      <button onClick={handleCancel} disabled={!loading} style={{ marginLeft: '10px' }}>
        취소
      </button>

      <hr />

      {loading && <p>데이터를 불러오는 중입니다... 잠시만 기다려주세요.</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data && (
        <ul>
          {data.slice(0, 5).map(item => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DataFetcher;