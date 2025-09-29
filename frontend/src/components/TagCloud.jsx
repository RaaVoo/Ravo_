import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * words: string[] | { text: string, count?: number }[]
 * width, height: 컨테이너 크기
 * minFontSize, maxFontSize: 빈도에 따른 폰트 스케일
 */
export default function TagCloud({
  words = [],
  width = 700,
  height = 400,
  minFontSize = 14,
  maxFontSize = 48,
  padding = 8,                      // 칩들끼리 여유
  chipPadding = { x: 12, y: 8 },    // 칩 내부 여백
  fontFamily = "'Noto Sans KR', sans-serif",
  colors = ['#E3F2FD', '#E1F5FE', '#E8F5E9', '#FFFDE7', '#F3E5F5'],
  onClickWord,
}) {
  const canvasRef = useRef(null);
  const [placed, setPlaced] = useState([]); // [{text, x, y, fontSize, w, h, bg}]

  // 측정용 캔버스 준비
  useEffect(() => {
    canvasRef.current = document.createElement('canvas').getContext('2d');
  }, []);

  // 입력 정규화: 문자열 배열 or {text,count} 배열 → [{text,count}]
  const items = useMemo(() => {
    if (!words || !words.length) return [];
    if (typeof words[0] === 'string') {
      const map = {};
      for (const w of words) {
        const key = String(w).trim();
        if (!key) continue;
        map[key] = (map[key] || 0) + 1;
      }
      return Object.entries(map).map(([text, count]) => ({ text, count }));
    }
    return words
      .map(w => ({ text: String(w.text ?? '').trim(), count: Number(w.count || 1) }))
      .filter(w => w.text);
  }, [words]);

  // 폰트 스케일 계산
  const { minCount, maxCount } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const it of items) { min = Math.min(min, it.count); max = Math.max(max, it.count); }
    if (!isFinite(min)) min = 1;
    if (!isFinite(max)) max = 1;
    return { minCount: min, maxCount: max };
  }, [items]);

  const scaleFont = (count) => {
    if (minCount === maxCount) return (minFontSize + maxFontSize) / 2;
    const t = (count - minCount) / (maxCount - minCount);
    return Math.round(minFontSize + t * (maxFontSize - minFontSize));
  };

  // 텍스트 폭/높이 측정
  const measure = (text, fontSize) => {
    const ctx = canvasRef.current;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const w = ctx.measureText(text).width + chipPadding.x * 2;
    const h = fontSize * 1.2 + chipPadding.y * 2;
    return { w, h };
  };

  // 사각형 충돌
  const intersects = (a, b, gap = padding) => {
    return !(
      a.x + a.w + gap <= b.x ||
      b.x + b.w + gap <= a.x ||
      a.y + a.h + gap <= b.y ||
      b.y + b.h + gap <= a.y
    );
  };

  // 색상 해시
  const colorOf = (text) => {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return colors[h % colors.length];
  };

  // 배치: 큰 폰트 먼저, 중심에서 바깥으로 스파이럴
  useEffect(() => {
    if (!canvasRef.current) return;
    const sorted = [...items].sort((a, b) => b.count - a.count);
    const placedRects = [];
    const result = [];

    const cx = width / 2, cy = height / 2;

    for (const it of sorted) {
      const fontSize = scaleFont(it.count);
      const { w, h } = measure(it.text, fontSize);

      let angle = 0;
      let radius = 0;
      let placedOk = false;

      for (let tries = 0; tries < 2000; tries++) {
        const x = Math.round(cx + radius * Math.cos(angle) - w / 2);
        const y = Math.round(cy + radius * Math.sin(angle) - h / 2);
        const rect = { x, y, w, h };

        // 컨테이너 안쪽인지 & 충돌 없는지
        if (
          x >= 0 && y >= 0 && x + w <= width && y + h <= height &&
          !placedRects.some(p => intersects(rect, p))
        ) {
          placedRects.push(rect);
          result.push({
            text: it.text,
            x, y, w, h,
            fontSize,
            bg: colorOf(it.text),
          });
          placedOk = true;
          break;
        }
        angle += 0.35;
        radius += 0.9; // 스텝
      }

      // 실패 시: 화면 잘리지 않는 범위로 한 번 더 시도(랜덤)
      if (!placedOk) {
        const x = Math.max(0, Math.min(width - w, Math.round(Math.random() * (width - w))));
        const y = Math.max(0, Math.min(height - h, Math.round(Math.random() * (height - h))));
        placedRects.push({ x, y, w, h });
        result.push({ text: it.text, x, y, w, h, fontSize, bg: colorOf(it.text) });
      }
    }

    setPlaced(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, width, height, minFontSize, maxFontSize, padding, chipPadding.x, chipPadding.y, fontFamily, colors]);

  return (
    <div
      className="rnwc-container"
      style={{ width, height, position: 'relative', overflow: 'hidden', borderRadius: 16 }}
      aria-label="word cloud"
    >
      {placed.map(({ text, x, y, fontSize, w, h, bg }) => (
        <div
          key={`${text}-${x}-${y}`}
          className="rnwc-chip"
          style={{
            left: x,
            top: y,
            width: w,
            height: h,
            position: 'absolute',
            background: bg,
            borderRadius: 14,
            boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize,
            fontFamily,
            color: '#2b2b2b',
            cursor: onClickWord ? 'pointer' : 'default',
            userSelect: 'none',
          }}
          onClick={() => onClickWord && onClickWord(text)}
          title={text}
        >
          {text}
        </div>
      ))}
    </div>
  );
}
