// src/utils/weather.js
// ✅ 감정 비율(pieData)로 날씨를 계산해 공통으로 쓰기

export const WEATHER = {
  SUNNY: 'sunny',
  CLOUDY: 'cloudy',
  RAIN: 'rain',
  THUNDER: 'thunder',
};

// 아이콘 경로(프로젝트의 /public/icons/ 에 파일이 있어야 함)
export const WEATHER_ICON = {
  [WEATHER.SUNNY]: '/icons/sun.svg',
  [WEATHER.CLOUDY]: '/icons/cloud.svg',
  [WEATHER.RAIN]: '/icons/rain.svg',
  [WEATHER.THUNDER]: '/icons/thunder.svg',
};

export const WEATHER_PRETTY_KO = {
  [WEATHER.SUNNY]: '맑음',
  [WEATHER.CLOUDY]: '흐림',
  [WEATHER.RAIN]: '비',
  [WEATHER.THUNDER]: '번개',
};

/**
 * pieData: [{ name: '기쁨'|'슬픔'|'분노'|'화남'|'불안'|'우울'..., value: number }, ...]
 * 반환값: 'sunny' | 'cloudy' | 'rain' | 'thunder' | 'fair'
 */
export function getEmotionWeatherKey(pieData = []) {
  const get = (names) =>
    pieData
      .filter(d => names.includes(d.name))
      .reduce((s, d) => s + (Number(d.value) || 0), 0);

  const joy = get(['기쁨']);
  const sadness = get(['슬픔']);
  const anger = get(['분노', '화남']);

  if (joy >= 50) return WEATHER.SUNNY;
  if (Math.abs(joy - sadness) <= 5) return WEATHER.CLOUDY;
  if (sadness >= 50) return WEATHER.RAIN;
  if (anger >= 50) return WEATHER.THUNDER;
  return WEATHER.SUNNY;
}
