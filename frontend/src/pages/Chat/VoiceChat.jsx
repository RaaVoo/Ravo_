import React, { useState, useEffect } from 'react';
import './VoiceChat.css';

const ChatBot = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [manualMode, setManualMode] = useState(true);

  const [messages, setMessages] = useState([
    {
      text: '아이와 대화를 시작해 보세요.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'bot',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);


  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoadedOnce, setSummaryLoadedOnce] = useState(false);
const loadSummary = async () => {
  setSummaryLoading(true);
  setSummaryError("");
  try {
    // 1) 캐시 무효화
    const res = await fetch(`/messages/summary?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Pragma": "no-cache",
        "Cache-Control": "no-store",
      },
    });
    const data = await res.json();
    if (!data?.success) throw new Error(data?.message || "요약 불러오기 실패");

    // 2) 배열 안전 추출
    const list = Array.isArray(data?.data) ? data.data : [];

    // 3) createdDate 기준으로 오름차순 정렬 (가장 마지막이 최신)
    //    서버가 DESC로 주는 경우도 대비해서 항상 정렬
    list.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));

    // 4) 최신 1개 선택 + 필드 혼용 방어 + 따옴표 제거
    const last = list[list.length - 1];
    const raw = last?.m_content ?? last?.content ?? "";
    const unquoted = typeof raw === "string" ? raw.replace(/^"(.*)"$/, "$1") : "";

    setSummaryText(unquoted || "아직 저장된 요약이 없어요.");
    setSummaryLoadedOnce(true);
  } catch (e) {
    setSummaryError(e.message || "네트워크 오류");
  } finally {
    setSummaryLoading(false);
  }
};


// 요약 토글 열릴 때 한 번만 로드
useEffect(() => {
  if (showSummary && !summaryLoadedOnce) {
    loadSummary();
  }
}, [showSummary]);


const baseURL = "";

// 🧩 (1) 페이지 처음 로드 시, 서버에서 메시지 목록 가져오기
useEffect(() => {
  fetch(`/messages`)
    .then((res) => res.json())
    .then((data) => {
      if (data?.success && Array.isArray(data.data)) {
        const loadedMessages = data.data.map((msg) => {
          // ✅ chat_flag 기준으로 발화자 결정
          let sender = "bot"; // 기본: 왼쪽 (아이)
          if (msg.chatFlag === "AI" || msg.chatFlag === "PARENTS") {
            sender = "user"; // 오른쪽 (AI 또는 부모)
          }

          return {
            text: msg.m_content,
            time: new Date(msg.createdDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            sender,
          };
        });

        loadedMessages.sort((a,b)=> (a.time > b.time ? 1 : -1));

        // ✅ 기존 메시지 배열에 합치기
        setMessages((prev) => [prev[0], ...loadedMessages]);
      }
    })
    .catch((err) => console.error("메시지 불러오기 실패:", err));


    // ✅ (2) 수동모드 상태 불러오기
  fetch('/chatbot/mode?key=global')
    .then((res) => res.json())
    .then((data) => {
      setManualMode(!!data.manual); // 수동모드면 true, 자동이면 false
    })
    .catch((err) => console.error("모드 상태 불러오기 실패:", err));
}, [baseURL]);


  // 모드 변경
const handleToggleManual = async () => {
  const next = !manualMode;
  setManualMode(next);
  try {
    await fetch('/chatbot/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'global', manual: next }), // key는 파이썬에서 get_manual_mode()에 쓴 그 값
    });
  } catch (err) {
    console.error('모드 전환 실패:', err);
  }
};




  // 🧩 (2) 메시지 전송 함수 — /messages/send 사용
const userNo = Number(localStorage.getItem('userNo') || 1); // 항상 1 (아이 계정)

// 부모가 수동모드에서 메시지 보낼 때
const handleSend = async () => {
  if (!input.trim()) return;

  // 화면에 먼저 반영 (오른쪽 말풍선)
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  setMessages(prev => [...prev, { text: input, time: now, sender: 'user' }]);

  try {
    const res = await fetch('/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: input,
        mode: 'VOICE',        // 음성 메시지
        summary: '',          // 감정요약 없음
        userNo: userNo,       // 항상 1로 고정
        chatNo: 1,
        chatFlag: 'PARENTS',  // ✅ 수동모드에서는 부모로 저장
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('부모 메시지 저장 실패:', res.status, text);
    }

    // 👇 파이썬에서 수동모드로 감지 후 아이에게 읽어주는 부분은 그대로 유지
  } catch (e) {
    console.error('부모 메시지 전송 실패:', e);
  } finally {
    setInput('');
  }
};



  // 엔터키로도 전송 가능
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const weekday = today.toLocaleDateString('ko-KR', { weekday: 'short' });
  const fullDate = `${formattedDate} (${weekday})`;

  return (
    <div className="chatbot-page">
      <div className="chatbot-container">
        <div className="chat-card">
          <div className="chat-header">라보와 이야기해요
              <div className="chat-header-buttons">
                <button
                className={`summary-btn ${showSummary ? 'active' : ''}`}
                onClick={() => setShowSummary(v => !v)}
                  >
                  ■ 요약보기
                </button>

                <button
                className={`manual-btn ${manualMode ? 'active' : ''}`}
                onClick={handleToggleManual} 
                title="수동모드 전환"
                >
                ■ 수동모드
                </button>

                <button
                className="voice-btn"
                onClick={() => console.log('voice-click')}
                title="음성 입력"
                aria-label="음성 입력"
                >
                🎤
                </button>
              </div>
          </div>

          {/* 요약 패널 */}
          <div className={`summary-panel ${showSummary ? 'open' : ''}`} role="region" aria-label="오늘의 대화 요약">
            <div className="summary-panel-inner">
              <div className="summary-title">오늘의 대화 요약</div>

              {summaryError ? (
                <p className="summary-error">⚠ {summaryError}</p>
              ) : summaryLoading ? (
                <p className="summary-loading">불러오는 중...</p>
              ) : (
                <p className="summary-text">{summaryText || "아직 저장된 요약이 없어요."}</p>
              )}

              <div className="summary-actions">
                <button className="summary-refresh" onClick={loadSummary} disabled={summaryLoading}>
                  {summaryLoading ? "불러오는 중..." : "새로고침"}
                </button>
              </div>
            </div>
          </div>

          <div className="chat-body">
            <div className="chat-date">{fullDate}</div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`}>
                  <div className="message-bubble">{msg.text}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-input-box">
            <input
              type="text"
              placeholder={loading ? '전송 중...' : '내용을 입력하세요'}
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button onClick={handleSend} disabled={loading || input.trim() === ''}>
              <img src="/icons/send.svg" alt="send" className="send-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
