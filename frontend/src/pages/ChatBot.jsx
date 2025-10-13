import React, { useState, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      text: '안녕하세요! 라보야 놀자입니다. 😊\n궁금한 점을 도와드리려고 해요.\n궁금한 점을 작성해주세요!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'bot',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // ⚙️ 서버 주소 (Vite 프록시 쓰면 빈 문자열로 둬도 됨)
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';

  // 🧩 (1) 페이지 처음 로드 시, 서버에서 메시지 목록 가져오기
  useEffect(() => {
    fetch(`${baseURL}/api/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          const loadedMessages = data.data.map((msg) => ({
            text: msg.m_content,
            time: new Date(msg.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'user', // sender 구분 없으니까 일단 user로 처리
          }));
          setMessages((prev) => [prev[0], ...loadedMessages]);
        }
      })
      .catch((err) => console.error('메시지 불러오기 실패:', err));
  }, []);

  // 🧩 (2) 메시지 전송 함수 — /messages/send 사용
  const handleSend = async () => {
    if (input.trim() === '') return;
    setLoading(true);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { text: input, time: now, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const body = {
        content: input,
        mode: 'text',
        summary: '',
        userNo: 1,
        chatNo: 1, // 지금은 고정값, 나중에 세션 구분 추가 가능
      };

      const res = await fetch(`${baseURL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data?.success) {
        const botResponse = {
          text: '문의가 접수되었어요. 담당자가 확인 후 답변드릴게요! 😊',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'bot',
        };
        setMessages((prev) => [...prev, botResponse]);
      } else {
        throw new Error(data.message || '서버 오류');
      }
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setMessages((prev) => [
        ...prev,
        { text: '전송 실패 ㅠㅠ 잠시 후 다시 시도해주세요.', time: now, sender: 'bot' },
      ]);
    } finally {
      setInput('');
      setLoading(false);
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
          <div className="chat-header">1:1 문의하기</div>

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
