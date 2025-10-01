// src/components/VoiceReport.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import './VoiceReport.css';
import TagCloud from './TagCloud';
import { fetchVoiceDetail } from '../../api/voice';
import { parseEmotionSummary, parseKeywordSummary } from '../../utils/reportParsers';

// 색상 팔레트
const COLORS = ['#E57373', '#FFC018', '#00BFFF', '#B39DDB', '#70DB93', '#EE82EE'];

/* ========================= 유틸 함수 ========================= */
// 감정 날씨 (이모지) 규칙
function getEmotionWeather(data = []) {
  const get = (names) =>
    data.filter(d => names.includes(d.name)).reduce((s, d) => s + (Number(d.value) || 0), 0);

  const joy = get(['기쁨']);
  const sadness = get(['슬픔']);
  const anger = get(['분노', '화남']);

  if (joy >= 50) return '맑음 ☀️';
  if (Math.abs(joy - sadness) <= 5) return '흐림 ☁️';
  if (sadness >= 50) return '비 🌧';
  if (anger >= 50) return '번개 ⚡';
  return '보통 🌤';
}

// 감정 분석 줄글 요약 (긍정=기쁨 / 부정=화남·분노·슬픔·불안·우울)
function makeEmotionSummary(childName = 'oo', data = []) {
  const get = (names) =>
    data.filter(d => names.includes(d.name)).reduce((s, d) => s + (Number(d.value) || 0), 0);

  const joy = get(['기쁨']);
  const anger = get(['분노', '화남']);
  const sadness = get(['슬픔']);
  const anxiety = get(['불안']);
  const depression = get(['우울']);
  const pos = joy;
  const neg = anger + sadness + anxiety + depression;

  const entries = [
    { key: '기쁨', val: joy },
    { key: '슬픔', val: sadness },
    { key: '분노', val: anger },
    { key: '불안', val: anxiety },
    { key: '우울', val: depression },
  ].sort((a, b) => b.val - a.val);

  const top = entries[0] || { key: '', val: 0 };

  let overall;
  if (pos - neg >= 10) overall = '감정이 긍정적으로 나타났어요';
  else if (neg - pos >= 10) overall = '감정이 부정적으로 나타났어요';
  else overall = '긍·부정 감정이 비슷하게 나타났어요';

  const valStr = (n) => `${Math.round(n)}%`;
  const s1 = `오늘 ${childName}이는 주로 ‘${top.key}’ 감정을 많이 표현했어요${top.val ? `(약 ${valStr(top.val)})` : ''}.`;
  const s2 = `오늘은 ${overall}.`;

  let s3 = '';
  if (neg - pos >= 10) {
    const topNeg = [
      { key: '분노', val: anger },
      { key: '슬픔', val: sadness },
      { key: '불안', val: anxiety },
      { key: '우울', val: depression },
    ].sort((a, b) => b.val - a.val)[0];
    if (topNeg && topNeg.val > 0) {
      s3 = `특히 ‘${topNeg.key}’ 관련 표현이 상대적으로 두드러졌어요${topNeg.val ? ` (약 ${valStr(topNeg.val)})` : ''}.`;
    }
  }

  return [s1, s2, s3].filter(Boolean).join(' ');
}

// 키워드 데이터 정규화(문자열/배열/객체 모두 지원)
function normalizeKeywords(src) {
  if (Array.isArray(src)) {
    if (!src.length) return {};
    if (typeof src[0] === 'string') {
      return src.reduce((m, w) => {
        const key = String(w).trim();
        if (!key) return m;
        m[key] = (m[key] || 0) + 1;
        return m;
      }, {});
    }
    // [{ text, count }]
    return src.reduce((m, k) => {
      const key = String(k.text ?? '').trim();
      if (!key) return m;
      m[key] = (m[key] || 0) + (Number(k.count) || 1);
      return m;
    }, {});
  }

  if (typeof src === 'string') {
    return src
      .split(/[,\s]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .reduce((m, w) => {
        m[w] = (m[w] || 0) + 1;
        return m;
      }, {});
  }
  return {};
}

function generateKeywordSummary(name, sorted) {
  if (!sorted.length) return `오늘 ${name}이가 사용한 대화에서 뚜렷한 키워드 경향은 확인되지 않았어요.`;

  const top = sorted[0].text;
  const words = sorted.map(k => k.text);

  const hasFriend = words.some(w => /친구/.test(w));
  const sadPhrase = words.find(w => /안놀아줘|왕따|혼자/.test(w));
  const school = words.find(w => /학교|선생님|학원|숙제|발표/.test(w));
  const food = words.find(w => /배고파|밥|간식|먹고/.test(w));
  const emotionCue = words.find(w => /싫다|짜증|속상|무서워|불안/.test(w));

  const lines = [];
  lines.push(`오늘 ${name}이가 가장 많이 언급한 단어는 “${top}”였어요.`);
  if (hasFriend) lines.push(`요즘 ${name}이는 친구 관계에 많은 관심을 가지고 있는 모습이에요.`);
  if (sadPhrase) lines.push(`특히 “${sadPhrase}”라는 말을 반복적으로 사용하며 속상한 감정이 드러났어요.`);
  if (school) lines.push(`학교/학업과 관련된 단어(“${school}”)도 자주 등장했어요.`);
  if (food) lines.push(`식사·간식 관련 표현(“${food}”)도 눈에 띄었어요.`);
  if (emotionCue && !sadPhrase) lines.push(`“${emotionCue}” 같은 감정 단어가 확인되어 정서 점검이 도움이 될 수 있어요.`);
  lines.push(`다음 대화에서는 ${name}이가 느끼는 감정을 먼저 공감하고, 구체적인 상황을 천천히 묻는 방식이 좋아요.`);

  return lines.join(' ');
}

/* ========================= 보조 컴포넌트 ========================= */
function KeywordSection({ className = '', childName = 'oo', keywords = [], summary }) {
  const normalizedMap = normalizeKeywords(keywords);
  const sorted = Object.entries(normalizedMap)
    .sort((a, b) => b[1] - a[1])
    .map(([text, count]) => ({ text, count }));

  const finalSummary = summary?.trim() ? summary : generateKeywordSummary(childName, sorted);

  return (
    <section className={`keyword-section ${className}`}>
      <h3 className="section-title">✨ 키워드</h3>

      <div className="keyword-chip-grid">
        {sorted.length ? (
          sorted.map(({ text }) => (
            <div className="keyword-chip" key={text} title={text}>
              <span className="keyword-chip-text">{text}</span>
              {/* count 배지 숨김: 필요하면 {count>1 && <span className="keyword-chip-badge">{count}</span>} */}
            </div>
          ))
        ) : (
          <div className="keyword-empty">키워드가 아직 없어요.</div>
        )}
      </div>

      <div className="keyword-summary-card">
        <h4 className="keyword-summary-title">📌 키워드 분석 요약</h4>
        <p className="keyword-summary-text preline">{finalSummary}</p>
      </div>
    </section>
  );
}

/* -------------------- AdviceSection -------------------- */
/** 자동 팁 생성(키워드/감정 기반)은 제거.
 *  백엔드 r_solution을 자연어 체크리스트로 변환해 표기합니다.
 */
function AdviceSection({
  childName = '00',
  pieData = [],
  solutionText = '',   // 백엔드 r_solution
  trendText = '',      // 백엔드 r_trend_summary (있으면)
}) {
  const tips = solutionTextToTips((solutionText || '').trim(), childName);

  return (
    <section className="voice-report-advice-box">
      <h3>💡 어떻게 하면 좋을까요?</h3>

      {tips.length ? (
        <ul className="advice-list">
          {tips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      ) : (
        <p className="preline">—</p>
      )}

      {getTrendSentence(trendText, pieData) && (
        <p className="advice-trend">{getTrendSentence(trendText, pieData)}</p>
      )}
    </section>
  );
}

/* --------- helpers --------- */
// r_solution: "부모 코칭: 아이 감정 반영(공감) → 구체적 계획 → 칭찬 피드백 반복" → 체크리스트 문장 배열
function solutionTextToTips(text, name = '아이') {
  if (!text) return [];
  // 머리말 제거(부모 코칭:, 코칭:, 솔루션:)
  let body = String(text).replace(/^[^:：]*[:：]\s*/, '');
  // 화살표/쉼표/중점/파이프 등으로 분해
  const parts = body.split(/→|->|=>|,|·|\u00B7|\||\/|\n/).map(s => s.trim()).filter(Boolean);

  const toSentence = (p) => {
    if (/감정.*반영|공감/.test(p)) return `${name}의 감정을 먼저 반영하고 공감해 주세요.`;
    if (/구체.*계획|계획/.test(p)) return `다음에 어떻게 해볼지 ${name}와 함께 구체적인 계획을 세워 보세요.`;
    if (/칭찬.*피드백|칭찬|피드백/.test(p)) return `시도 후에는 작은 변화도 꼭 칭찬하고 피드백을 반복해 주세요.`;
    // 일반 항목도 자연스러운 명령형으로 마무리
    return /[.?!]$/.test(p) ? p : `${p}을(를) 실천해 주세요.`;
  };

  return parts.map(toSentence);
}

// 트렌드 문장(백엔드 제공 없으면 간단 자동)
function getTrendSentence(trendText, pieData) {
  if (trendText && String(trendText).trim()) return String(trendText).trim();
  if (!pieData?.length) return '';

  // 간이 안정성 지표(분산 낮을수록 안정)
  const vals = pieData.map(d => Number(d.value) || 0);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / vals.length;
  const stable = variance < 300 ? '안정적' : '변동이 있었';

  return `최근 감정 흐름은 비교적 ${stable}으로 보였고, 대화량도 분석에 충분했어요 ☀️`;
}

/* ========================= 메인 컴포넌트 ========================= */
const VoiceReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data = await fetchVoiceDetail(id);
        setReport(data);
      } catch (e) {
        console.error('[VoiceReport] fetch error', e);
        setErr('상세를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const pieData = useMemo(() => parseEmotionSummary(report?.emotion_summary) || [], [report]);
  const cloudData = useMemo(() => parseKeywordSummary(report?.keyword_summary) || [], [report]);

  const childName = report?.child_name || 'oo';
  const weather = getEmotionWeather(pieData);
  const emotionSummary = pieData.length ? makeEmotionSummary(childName, pieData) : '';

  if (isLoading) return <div className="voice-report-container">로딩 중...</div>;
  if (err) return <div className="voice-report-container">{err}</div>;
  if (!report) return null;

  return (
    <div className="voice-report-container">
      {/* 헤더 */}
      <section className="voice-report-header">
        <div className="voice-report-date">{report.r_date || report.date || '-'}</div>
        <h1 className="voice-report-title">오늘의 감정 날씨: {weather}</h1>
      </section>

      {/* 차트 */}
      <section className="voice-report-chart">
        <div className="voice-report-child-info">
          <span role="img" aria-label="child">👶</span>{' '}
          아이 이름: {childName} {report.child_age ? `(${report.child_age}세)` : ''}
        </div>

        <div className="voice-report-pie-wrapper">
          <PieChart width={400} height={350}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              dataKey="value"
              label={({ name }) => name}
              labelLine={false}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>

          <div className="voice-report-legend-wrapper">
            <h3 className="legend-title">
              <span role="img" aria-label="chart">📊</span> 감정 비율
            </h3>
            <div className="voice-report-legend-text">
              {pieData.map((entry, idx) => (
                <span
                  key={idx}
                  className="legend-item"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                >
                  {entry.name} {Math.round(entry.value)}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 감정 분석 요약 (줄글) */}
      <section className="voice-report-summary-box">
        <h3>❤️ 감정 분석 요약</h3>
        {emotionSummary ? (
          <p className="preline">{emotionSummary}</p>
        ) : (
          <p>감정 요약이 없습니다.</p>
        )}
      </section>

      {/* 대화 요약 & 키워드 */}
      <section className="voice-report-dialogue-summary">
        <h3>💬 오늘의 대화 주제는 이거였어요!</h3>
        <div className="voice-report-keywords">
          <TagCloud
            words={cloudData}          // ['친구','안놀아줘', ...] 또는 [{text:'친구', count:12}]
            width={700}
            height={400}
            minFontSize={14}
            maxFontSize={48}
            onClickWord={(w) => console.log('clicked:', w)}
          />
        </div>

        <KeywordSection
          className="voice-report-keyword-summary"
          childName={childName}
          keywords={report.keywords || report.keyword_summary || []}
          summary={report.keyword_brief}
        />
      </section>

      {/* 총평 */}
      <section className="voice-report-overall-summary">
        <h3>📝 오늘의 총평</h3>
        <p className="preline">{report.r_overall_review || '—'}</p>
      </section>

      {/* 어떻게 하면 좋을까요? */}
      <AdviceSection
        childName={childName}
        pieData={pieData}
        solutionText={report.r_solution}
        trendText={report.r_trend_summary}
      />

      {/* 버튼 */}
      <section className="voice-report-buttons">
        <button className="btn" onClick={() => alert(report.r_content || '대화 내용이 없습니다.')}>
          💬 대화내용 모아보기
        </button>
        <button className="btn" onClick={() => (window.location.href = '/report/voice')}>
          📋 과거 보고서 목록
        </button>
        <button className="btn" onClick={() => window.print()}>
          🖨 인쇄하기
        </button>
      </section>
    </div>
  );
};

export default VoiceReport;
