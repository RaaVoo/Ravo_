// frontend/src/components/VideoReport.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVideoDetail, deleteVideoReport } from '../../api/video';
import './VideoReport.css';

const Video_report = () => {
  const { video_no } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetchVideoDetail(video_no);

        // 백엔드 필드명 매핑 가드(레코드 필드명이 다를 수 있어 대비)
        const mapped = {
          id: res.video_no ?? res.record_no ?? video_no,
          title: res.title ?? '(제목 없음)',
          date: res.r_date ?? res.created_at ?? null,
          video_url: res.video_url ?? res.thumbnail_url ?? '',
          summary: res.summary ?? '',
          highlights: Array.isArray(res.highlights) ? res.highlights : [],
          behavior_stats: res.behavior_stats ?? {},
        };
        setData(mapped);
      } catch (e) {
        console.error(e);
        setErr('상세 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [video_no]);

  const handleDelete = async () => {
    if (!window.confirm('해당 보고서를 삭제할까요?')) return;
    try {
      await deleteVideoReport(video_no);
      navigate('/video/reports');
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className="video-report-container">로딩중...</div>;
  if (err) return <div className="video-report-container">{err}</div>;
  if (!data) return null;

  const isVideo = /\.(mp4|webm|ogg)$/i.test(data.video_url || '');
  const displayDate = data.date ? new Date(data.date).toLocaleDateString() : '-';

  return (
    <div className="video-report-container">
      {/* 헤더 */}
      <section className="video-report-header">
        <div className="video-report-date">{displayDate}</div>
        <h1 className="video-report-title">
          {data.title}{' '}
          <span role="img" aria-label="thinking face">🤨</span>
        </h1>
      </section>

      {/* 영상/이미지 프리뷰 */}
      {data.video_url && (
        <section className="video-report-image-wrapper">
          {isVideo ? (
            <video src={data.video_url} controls className="video-report-image" />
          ) : (
            <img
              src={data.video_url}
              alt="오늘의 눈여겨 볼 장면"
              className="video-report-image"
            />
          )}
        </section>
      )}

      {/* 행동 분석 요약 */}
      <section className="video-report-summary-box">
        <h3><span role="img" aria-label="pushpin">📌</span> 행동 분석 요약</h3>
        <p className="whitespace-pre-wrap">
          {data.summary || '요약이 없습니다.'}
        </p>
      </section>

      {/* 총평 & 하이라이트/솔루션 */}
      <section className="video-report-overall-summary">
        <h3><span role="img" aria-label="memo">📝</span> 오늘의 총평</h3>
        {/* 필요 시 data.overall 같은 추가 필드가 있으면 여기에 표시 */}
        <p>관찰된 행동과 표정에 근거한 총평을 여기에 표시하세요.</p>

        <div className="video-report-friend-solution">
          <h4><span role="img" aria-label="light bulb">💡</span> 라보의 친구 솔루션</h4>
          <ul>
            {(data.highlights || []).map((h, i) => (
              <li key={i}>
                {h.start != null && h.end != null
                  ? `[${h.start}s ~ ${h.end}s] ${h.label ?? ''}`
                  : (h.label ?? '')}
              </li>
            ))}
          </ul>
          <p>아이의 하루가 더 편안해지길 응원합니다 🌈</p>
        </div>
      </section>

      {/* 하단 버튼 */}
      <section className="video-report-buttons">
        <button className="btn" onClick={() => navigate('/video/reports')}>
          📋 과거 보고서 목록
        </button>
        <button className="btn" onClick={() => window.print()}>
          🖨 인쇄하기
        </button>
        <button className="btn danger" onClick={handleDelete}>
          삭제
        </button>
      </section>
    </div>
  );
};

export default Video_report;