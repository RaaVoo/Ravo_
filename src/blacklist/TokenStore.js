// TokenStore.js 코드는 '토큰 블랙리스트 저장소'
// Set 객체 : 중복없이 값을 지ㅣ
// TokenStore.js (ESM 방식)

const blacklistedTokens = new Set();

/**
 * 토큰을 블랙리스트에 추가하는 함수
 * @param {string} token 
 */
export function addToken(token) {
  blacklistedTokens.add(token);
}

/**
 * 토큰이 블랙리스트에 있는지 확인하는 함수
 * @param {string} token 
 * @returns {boolean}
 */
export function isBlacklisted(token) {
  return blacklistedTokens.has(token);
}