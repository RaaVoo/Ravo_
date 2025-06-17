// TokenStore.js 코드는 '토큰 블랙리스트 저장소'
// Set 객체 : 중복없이 값을 지ㅣ
const blacklistedTokens = new Set();

function addToken(token) {
    blacklistedTokens.add(token);
}

function isBlacklisted(token) {
    return blacklistedTokens.has(token);
}

module.exports = { addToken, isBlacklisted };