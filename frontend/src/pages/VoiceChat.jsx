import React, { useState } from 'react';
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

  const handleSend = () => {
    if (input.trim() !== '') {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const userMessage = {
        text: input,
        time: now,
        sender: 'user',
      };

      const botResponse = {
        text: '문의해주셔서 감사합니다. 담당자가 곧 답변드릴게요! 😊',
        time: now,
        sender: 'bot',
      };

      setMessages([...messages, userMessage, botResponse]);
      setInput('');
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
          <div className="chat-header">
            1:1 문의하기
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
              placeholder="내용을 입력하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>
              <img src="/icons/send.svg" alt="send" className="send-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
