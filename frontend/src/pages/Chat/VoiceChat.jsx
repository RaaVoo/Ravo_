import React, { useState, useEffect } from 'react';
import './VoiceChat.css';

const ChatBot = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [manualMode, setManualMode] = useState(true);
  const [messages, setMessages] = useState([
    {
      text: '아이와 대화를 시작해 보세요.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'user',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);


const baseURL = "";

  // 🧩 (1) 페이지 처음 로드 시, 서버에서 메시지 목록 가져오기
// Chat.jsx (useEffect 안)
useEffect(() => {
  fetch(`/messages`)
    .then((res) => res.json())
    .then((data) => {
      if (data?.success && Array.isArray(data.data)) {
        const loadedMessages = data.data.map((msg) => {
          let sender = "bot"; // 기본은 왼쪽(아이)
          if (msg.user_no === 2 || msg.user_no === 3) sender = "user"; // AI 또는 부모는 오른쪽

          return {
            text: msg.m_content,
            time: new Date(msg.createdDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            sender,
          };
        });

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
  // const handleSend = async () => {
  //   if (input.trim() === '') return;
  //   setLoading(true);

  //   const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  //   const userMessage = { text: input, time: now, sender: 'user' };
  //   setMessages((prev) => [...prev, userMessage]);

  //   try {
  //     const body = {
  //       content: input,
  //       mode: 'text',
  //       summary: '',
  //       userNo: 1,
  //       chatNo: 1, // 지금은 고정값, 나중에 세션 구분 추가 가능
  //     };

  //     const res = await fetch(`/messages/send`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(body),
  //     });

  //     const data = await res.json();

  //     if (data?.success) {
  //       const botResponse = {
  //         text: '문의가 접수되었어요. 담당자가 확인 후 답변드릴게요! 😊',
  //         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //         sender: 'bot',
  //       };
  //       setMessages((prev) => [...prev, botResponse]);
  //     } else {
  //       throw new Error(data.message || '서버 오류');
  //     }
  //   } catch (err) {
  //     console.error('메시지 전송 실패:', err);
  //     setMessages((prev) => [
  //       ...prev,
  //       { text: '전송 실패 ㅠㅠ 잠시 후 다시 시도해주세요.', time: now, sender: 'bot' },
  //     ]);
  //   } finally {
  //     setInput('');
  //     setLoading(false);
  //   }
  // };
  // VoiceChat.jsx
const userNo = Number(localStorage.getItem('userNo') || 0); // 로그인한 부모의 user_no

const handleSend = async () => {
  if (!input.trim()) return;

  // 화면에 먼저 반영
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  setMessages(prev => [...prev, { text: input, time: now, sender: 'user' }]);

  try {
    const res = await fetch('/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: input,
        mode: 'VOICE',        // ✅ 음성 채팅이므로 VOICE로 고정
        summary: '',          // 필요시 'neutral'
        userNo: 3,               // ✅ 부모의 user_no
        chatNo: 1
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('부모 메시지 저장 실패:', res.status, text);
    }

    // 수동모드라면: “부모가 답했다” 신호 → (파이썬 폴링 방식이면) 별도 처리 없음
    // 만약 listen 플래그 방식을 썼다면 여기서 '/chatbot/listen {allow:true}' 호출

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
