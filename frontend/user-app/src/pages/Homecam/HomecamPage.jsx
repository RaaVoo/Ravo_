import React, { useState, useEffect } from 'react';
import './HomecamPage.css';
import { FaStop, FaPause } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import HlsPlayer from './HlsPlayer';

import { useUser } from '../../context/UserContext';    // user_no 받아오기 (251006 추가)

const HLS_URL  = process.env.REACT_APP_HLS_URL  || '';
const API_BASE = process.env.REACT_APP_API_BASE || '';
const api = (p) =>
  `${API_BASE}`.replace(/\/+$/,'') + '/' + `${p}`.replace(/^\/+/,'');

console.log('API_BASE =', API_BASE); // 테스트

// 🔒 최소 녹화 시간(초) — 30분
//const MIN_SECONDS = 30 * 60;

const HomecamPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);

  const [showModal, setShowModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);       // 시작/일시정지 등 일반 작업
  const [isGenerating, setIsGenerating] = useState(false); // 보고서 생성 로딩 모달 전용

  const [currentId, setCurrentId] = useState(null);
  const navigate = useNavigate();

  // 잠깐 추가 (251006)
  const { user } = useUser();                   // 현재 로그인 한 사용자
  //const userNo = user?.user_no || user?.id;     
  const userNo =
    (() => {
      const v = user?.userNo ?? localStorage.getItem('userNo');
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    })();
  // user_no 뽑아옴 (여기까지 잠깐 추가)

  // 버튼 공통 비활성화 플래그
  const isBusy = isLoading || isGenerating;

  // ⏱ 타이머
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

  // ▶️ 녹화 시작
  const handleStart = async () => {
    if (isBusy) return;
    try {
      setIsLoading(true);

      // 잠깐 추가 (251006)
      if (!userNo) {
       alert('로그인 정보가 없습니다. 다시 로그인해 주세요.');
       return;
     }    // 여기까지

      const r_start = new Date().toISOString();
      const payload = {
        //user_no: 1, // TODO: 로그인 사용자로 대체
        user_no: userNo, // TODO: 로그인 사용자로 대체 (251006)
        r_start,
        record_title: `홈캠 ${new Date().toLocaleString()}`,
        cam_url: HLS_URL || undefined,
        cam_status: 'active',
      };

      const res = await fetch(api('/homecam/save'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',         // 잠깐 추가 (251006)
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);

      const id = data.record_no;
      setCurrentId(id);
      setIsRecording(true);
      setIsPaused(false);
      setTime(0);

      // (선택) 디버그 확인
      try {
        //const sRes = await fetch(api('/homecam/_debug/sessions'));
        const sRes = await fetch(api('/homecam/_debug/sessions'), { credentials: 'include' });    // 세션 관련 에러
        const sJson = await sRes.json();
        const active = Array.isArray(sJson?.active) ? sJson.active.map(String) : [];
        if (!active.includes(String(id))) {
          alert('녹화 세션을 찾지 못했습니다. 서버가 재시작되었는지 확인해주세요.');
        }
      } catch {}
    } catch (e) {
      console.error(e);
      alert(`녹화를 시작할 수 없습니다.\n${e.message || e}`);
      // 시작 단계는 로컬 상태를 바꾸기 전이므로 별도 롤백 없음
    } finally {
      setIsLoading(false);
    }
  };

  // ⏸ 일시정지/재개 (실패 시 롤백)
  const handlePause = async () => {
    if (!currentId) {
      alert('녹화 세션이 없습니다. 다시 시작해 주세요.');
      return;
    }
    if (isBusy) return;

    const prevPaused = isPaused;
    const nextPaused = !isPaused;
    const nextStatus = nextPaused ? 'paused' : 'active';

    setIsPaused(nextPaused);
    try {
      setIsLoading(true);
      const res = await fetch(api(`/homecam/${currentId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',     // 세션 관련 에러 때문에 잠깐 추가 (251017)
        body: JSON.stringify({ cam_status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(e);
      alert(`상태 변경 중 오류가 발생했습니다.\n${e.message || e}`);
      // ⛑️ 롤백: UI를 변경 전 상태로 복구
      setIsPaused(prevPaused);
    } finally {
      setIsLoading(false);
    }
  };

  // ⏹ 정지 → 확인 모달
  const handleStop = () => {
    if (!currentId) {
      alert('녹화 세션이 없습니다.');
      return;
    }
    if (isBusy) return;

    setIsRecording(false);
    setIsPaused(false);
    setShowModal(true);
  };

  const handleModalClose = () => setShowModal(false);

  // ✅ 종료 저장(보고서 생성) — 실패 시 상태 롤백 + 모달 자동 재오픈
  const handleCreateReport = async () => {
    if (!currentId) {
      alert('녹화 세션이 없습니다.');
      return;
    }
    if (isBusy) return;

    // 🔒 나중에 최소 녹화시간 제한을 켜려면 ↓ 주석 해제
    /*
    if (time < MIN_SECONDS) {
      alert('녹화 30분 미만은 보고서를 생성할 수 없습니다.');
      return;
    }
    */

    setShowModal(false);
    setIsGenerating(true);

    // 롤백용 이전 상태 기록
    const prevState = {
      wasRecording: isRecording,
      wasPaused: isPaused,
      id: currentId,
    };

    try {
      // (선택) 서버 상태 inactive
      await fetch(api(`/homecam/${currentId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',     // 세션 관련 에러 때문에 잠깐 추가 (251017)
        body: JSON.stringify({ cam_status: 'inactive' }),
      }).catch(() => {});

      // 종료 메타 저장
      const r_end = new Date().toISOString();
      const res2 = await fetch(api(`/homecam/${currentId}/end`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',     // 세션 관련 에러 때문에 잠깐 추가 (251017)
        body: JSON.stringify({ r_end }),
      });
      const d2 = await res2.json().catch(() => ({}));
      if (!res2.ok) throw new Error(d2?.message || d2?.error || `HTTP ${res2.status}`);

      // 성공 → 초기화 및 이동
      setTime(0);
      setCurrentId(null);
      navigate('/homecam/camlist');
      // ✅ 나중에 보고서 상세 페이지로 바로 이동하고 싶을 때 사용
// navigate(`/report/${d2.report_no}`); 
// ⚠️ 백엔드에서 생성된 report_no(또는 record_no → report 매핑)가 있어야 함
    } catch (e) {
      console.error(e);
      alert(`저장/종료 중 오류가 발생했습니다.\n${e.message || e}`);

      // ⛑️ 롤백: UI 상태 복구 + 서버 상태도 되돌리기 시도
      if (prevState.id) {
        try {
          await fetch(api(`/homecam/${prevState.id}/status`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cam_status: prevState.wasPaused ? 'paused' : 'active' }),
          });
        } catch {}
      }
      setIsRecording(true);
      setIsPaused(prevState.wasPaused);

      // 🔁 실패 시 모달 자동 재오픈(재시도 UX)
      setShowModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // “예” 버튼 비활성화 옵션 (나중에 켤 때 주석 해제해서 사용)
  // const isUnderMin = time < MIN_SECONDS;

  return (
    <div className="homecam-page">
      <h2 className="homecam-title">홈캠 보기</h2>

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
            <button
              className="record-btn"
              onClick={handleStop}
              title="정지"
              disabled={isBusy}
            >
              <FaStop />
            </button>
            <button
              className="pause-btn"
              onClick={handlePause}
              title={isPaused ? '재개' : '일시정지'}
              disabled={!currentId || isBusy}
            >
              <FaPause />
            </button>
          </>
        ) : (
          <button
            className="record-btn"
            onClick={handleStart}
            title="녹화 시작"
            disabled={isBusy}
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
              <button
                className="yes-btn"
                onClick={handleCreateReport}
                disabled={
                  !currentId || isBusy
                  // || isUnderMin   // 🔒 30분 미만 비활성화: 필요해지면 주석 해제
                }
                // title={isUnderMin ? '30분 이상 녹화해야 생성할 수 있어요' : '보고서 생성'}
              >
                예
              </button>
              <button className="no-btn" onClick={handleModalClose}>
                아니오
              </button>
            </div>

            <p className="modal-warning">
              * 녹화 영상 30분 미만은 생성이 불가능합니다.
            </p>
          </div>
        </div>
      )}

      {/* 보고서 생성 중 모달 — “예”를 눌렀을 때만 보임 */}
      {isGenerating && (
        <div className="modal-overlay">
          <div className="report-modal">
            <p className="modal-title">보고서 생성 중입니다…</p>
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
