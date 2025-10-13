import React, { useState, useEffect } from 'react';
import './ChatBot.css';

const Consult = () => {
  const [messages, setMessages] = useState([
    {
      text: '안녕하세요! 라보야 놀자입니다. 😊\n궁금한 점을 도와드리려고 해요.\n궁금한 점을 작성해주세요!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'bot',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => {
    // YYYY-MM-DD
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  });

  // Vite 프록시 쓰면 빈 문자열, 아니면 .env에 VITE_API_BASE_URL 넣어서 사용
  //const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const baseURL = process.env.REACT_APP_API_BASE_URL || '';

  // (1) 날짜 기준 메시지 조회
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`${baseURL}/api/chatbot/send?date=${date}`);
        if (!res.ok) return;
        const json = await res.json();

        // 응답 형태 유연 파싱 (content/m_content, createdAt/createdDate 모두 대응)
        const arr = (json?.data ?? json) || [];
        const mapped = arr.map((m, idx) => ({
          text: m.content ?? m.m_content ?? '',
          time: new Date(m.createdAt ?? m.createdDate ?? Date.now())
            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          // sender 필드가 있으면 사용, 없으면 임시로 user 처리
          sender: (m.sender && String(m.sender).toLowerCase() === 'bot') ? 'bot' : 'user',
          key: m.id ?? m.message_no ?? idx,
        }));
        setMessages((prev) => [prev[0], ...mapped]);
      } catch (e) {
        console.error('상담 메시지 조회 실패:', e);
      }
    };
    fetchList();
  }, [date, baseURL]);

  // (2) 전송: /chatbot/send
  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { text, time: now, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // 백엔드가 “사용자/봇 공통”이라 했으니 sender 포함해서 보냄
      // (userNo/chatNo/summary/mode는 네 서비스 규격에 맞춰 유지)
      const body = {
        content: text,
        sender: 'USER',   // 백에서 BOT/USER 구분한다면 사용
        mode: 'text',
        summary: '',
        userNo: 1,
        chatNo: 1,
      };

      const res = await fetch(`${baseURL}/api/chatbot/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || '서버 오류');
      }

      // 필요 시 서버가 즉시 봇 응답을 생성해 반환한다면 여기서 파싱
      // (없으면 안내 메시지로 대체)
      const botReply =
        json?.data?.reply ??
        json?.reply ??
        '상담이 접수되었어요. 담당자가 확인 후 답변드릴게요! 😊';

      const botMsg = { text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sender: 'bot' };
      setMessages((prev) => [...prev, botMsg]);

      // 서버 기록이 진실이라 재조회 하고 싶으면 주석 해제
      // await refreshForDate();
    } catch (e) {
      console.error('상담 메시지 전송 실패:', e);
      setMessages((prev) => [
        ...prev,
        { text: '전송 실패 ㅠ 잠시 후 다시 시도해주세요.', time: now, sender: 'bot' },
      ]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 헤더 날짜 표시
  const today = new Date();
  const formattedDate = today.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const weekday = today.toLocaleDateString('ko-KR', { weekday: 'short' });
  const fullDate = `${formattedDate} (${weekday})`;

  return (
    <div className="chatbot-page consult">
      <div className="chatbot-container">
        <div className="chat-card">
          <div className="chat-header">
            상담 챗봇
            <div style={{ marginTop: 8 }}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ fontSize: 12, padding: 4 }}
              />
            </div>
          </div>

          <div className="chat-body">
            <div className="chat-date">{fullDate}</div>
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={msg.key ?? idx} className={`chat-message ${msg.sender}`}>
                  <div className="message-bubble">{msg.text}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-input-box">
            <input
              type="text"
              placeholder={loading ? '전송 중...' : '상담 내용을 입력하세요'}
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

export default Consult;
