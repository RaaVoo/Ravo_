import React, { useState, useEffect } from 'react';
import './HomecamPage.css';
import { FaStop, FaPause } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import HlsPlayer from './HlsPlayer';

// ✅ 프론트 .env (개발 서버 프록시를 쓰면 API_BASE는 빈 문자열 "")
const HLS_URL  = process.env.REACT_APP_HLS_URL  || '';
const API_BASE = process.env.REACT_APP_API_BASE || '';

// ★ API URL 안전하게 합치기(슬래시 중복/누락 방지)
const api = (p) =>
  `${API_BASE}`.replace(/\/+$/,'') + '/' + `${p}`.replace(/^\/+/,'');

const HomecamPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const navigate = useNavigate();

  // 타이머
  useEffect(() => {
    let timer;
    if (isRecording && !isPaused) {
      timer = setInterval(() => setTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // 녹화 시작
  const handleStart = async () => {
    if (isLoading) return;              // ★ 중복 클릭 방지
    try {
      setIsLoading(true);

      const r_start = new Date().toISOString();
      const payload = {
        user_no: 1, // TODO: 로그인 사용자로 대체
        r_start,
        record_title: `홈캠 ${new Date().toLocaleString()}`,
        cam_url: HLS_URL || undefined,  // 선택(없어도 서버 기본값 사용)
        cam_status: 'active',
      };

      const res = await fetch(api('/homecam/save'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);

      const id = data.record_no;
      setCurrentId(id);
      setIsRecording(true);
      setIsPaused(false);
      setTime(0);

      // ★ 디버그: 세션이 살아있는지 1회 확인(없으면 즉시 경고)
      try {
        const sRes = await fetch(api('/homecam/_debug/sessions'));
        const sJson = await sRes.json();
        const active = Array.isArray(sJson?.active) ? sJson.active.map(String) : [];
        if (!active.includes(String(id))) {
          alert('녹화 세션을 찾지 못했습니다. 서버가 재시작되었는지 확인해주세요.');
        }
      } catch { /* 디버그 엔드포인트 없는 환경은 무시 */ }

    } catch (e) {
      console.error(e);
      alert(`녹화를 시작할 수 없습니다.\n${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 일시정지/재개
  const handlePause = async () => {
    if (!currentId) {
      alert('녹화 세션이 없습니다. 다시 시작해 주세요.');
      return;
    }
    const nextPaused = !isPaused;
    const nextStatus = nextPaused ? 'paused' : 'active';
    setIsPaused(nextPaused);

    try {
      const res = await fetch(api(`/homecam/${currentId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cam_status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(e);
      alert(`상태 변경 중 오류가 발생했습니다.\n${e.message || e}`);
      setIsPaused(!nextPaused); // 롤백
    }
  };

  // 정지 → 모달 열기
  const handleStop = () => {
    if (!currentId) {
      alert('녹화 세션이 없습니다.');
      return;
    }
    setIsRecording(false);
    setIsPaused(false);
    setShowModal(true);
  };

  const handleModalClose = () => setShowModal(false);

  // 종료 저장(보고서 생성)
  const handleCreateReport = async () => {
    if (!currentId) {
      alert('녹화 세션이 없습니다.');
      return;
    }
    if (isLoading) return;              // ★ 중복 방지

    setShowModal(false);
    setIsLoading(true);

    try {
      // (선택) 상태 inactive
      await fetch(api(`/homecam/${currentId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cam_status: 'inactive' }),
      }).catch(() => {});

      // 종료 메타 업데이트
      const r_end = new Date().toISOString();
      const res2 = await fetch(api(`/homecam/${currentId}/end`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r_end }),
      });
      const d2 = await res2.json().catch(() => ({}));
      if (!res2.ok) throw new Error(d2?.message || d2?.error || `HTTP ${res2.status}`);

      // ★ 끝난 뒤 초기화 및 목록으로 이동
      setTime(0);
      setCurrentId(null);
      navigate('/homecam/camlist');
    } catch (e) {
      console.error(e);
      alert(`저장/종료 중 오류가 발생했습니다.\n${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="homecam-page">
      <h2 className="homecam-title">홈캠 보기</h2>

      {/* ✅ HLS 플레이어 영역 */}
      <div className="video-box">
        {HLS_URL ? (
          <HlsPlayer src={HLS_URL} />
        ) : (
          <div className="no-stream">
            환경변수 <code>REACT_APP_HLS_URL</code> 이 설정되지 않았습니다.
          </div>
        )}
      </div>

      <div className="button-group">
        {isRecording ? (
          <>
            <button className="record-btn" onClick={handleStop} title="정지" disabled={isLoading}>
              <FaStop />
            </button>
            <button
              className="pause-btn"
              onClick={handlePause}
              title={isPaused ? '재개' : '일시정지'}
              disabled={!currentId || isLoading}
            >
              <FaPause />
            </button>
          </>
        ) : (
          <button
            className="record-btn"
            onClick={handleStart}
            title="녹화 시작"
            disabled={isLoading}
          >
            <img src="/icons/stop.svg" alt="Record" className="record-icon-img" />
          </button>
        )}
      </div>

      {isRecording ? (
        <>
          <p className="record-status">
            <span className="dot" /> {isPaused ? '일시정지됨' : '녹화 중입니다.'}
          </p>
          <p className="timer">⏱ REC {formatTime(time)}</p>
        </>
      ) : (
        <p className="record-status gray">지금은 녹화가 되고 있지 않습니다.</p>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="report-modal">
            <button className="close-btn" onClick={handleModalClose}>
              <img src="/icons/close.svg" alt="닫기" className="close-icon-img" />
            </button>
            <p className="modal-title">보고서를 생성하시겠습니까?</p>
            <div className="modal-buttons">
              <button className="yes-btn" onClick={handleCreateReport} disabled={!currentId || isLoading}>
                예
              </button>
              <button className="no-btn" onClick={handleModalClose}>
                아니오
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="modal-overlay">
          <div className="report-modal">
            <p className="modal-title">처리 중입니다…</p>
            <div className="loading-bar">
              <div className="progress"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomecamPage;
