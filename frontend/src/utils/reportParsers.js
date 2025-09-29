// "기쁨:55, 화남:15" → [{ name:'기쁨', value:55 }, ...]
export function parseEmotionSummary(str) {
  if (!str) return [];
  return str.split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(pair => {
      const [name, val] = pair.split(':').map(x => x.trim());
      const num = Number(val);
      return { name, value: isNaN(num) ? 0 : num };
    });
}

// "친구, 유치원, ..." → [{ text:'친구', value:30 }, ...] (워드클라우드 가중치 임의)
export function parseKeywordSummary(str) {
  if (!str) return [];
  const arr = str.split(',').map(s => s.trim()).filter(Boolean);
  const base = 30;
  return arr.map((text, i) => ({
    text,
    value: base - i * 2 > 8 ? base - i * 2 : 8,
  }));
}
