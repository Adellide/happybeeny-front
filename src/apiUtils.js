// apiUtils.js - 공통 API 유틸리티

import axios from "axios";

/**
 * 현재 pending 중인 요청 키를 관리하는 Set
 * 키 형식: "URL::JSON.stringify(params)"
 */
const pendingRequests = new Set();

/**
 * URL + params 를 조합해 요청 고유 키를 생성
 */
function makeKey(url, params) {
  return `${url}::${JSON.stringify(params)}`;
}

/**
 * AbortController 신호를 지원하는 공통 GET 조회 함수.
 * 동일한 URL + params 조합이 이미 pending 중이면 요청을 스킵하고 null 을 반환합니다.
 *
 * @param {string} url - 요청할 API URL
 * @param {object} [params={}] - 쿼리 파라미터 (선택)
 * @param {AbortSignal} [signal] - AbortController 의 signal (취소용, 선택)
 * @returns {Promise<any|null>} - 응답 데이터 또는 중복 요청 시 null
 *
 * @example
 * const controller = new AbortController();
 * const data = await getData('/api/users', { page: 1 }, controller.signal);
 * if (data === null) console.log('이미 조회 중입니다.');
 * controller.abort(); // 요청 취소
 */
export async function getData(url, params = {}, signal) {
  const key = makeKey(url, params);

  // 동일한 요청이 진행 중이면 스킵
  if (pendingRequests.has(key)) {
    console.warn(`[getData] 이미 진행 중인 요청입니다: ${key}`);
    return null;
  }

  pendingRequests.add(key);

  try {
    const response = await axios.get(url, { params, signal });
    return response.data;
  } finally {
    // 성공 / 실패 / 취소 모두 pending 에서 제거
    pendingRequests.delete(key);
  }
}
