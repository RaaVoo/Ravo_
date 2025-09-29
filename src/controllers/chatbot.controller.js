// controllers/chatbot.controller.js
import {
  sendChatbotMessage,
  getAllChatbotMessages,
  getChatbotMessagesByDate
} from '../services/consult.service.js';

// POST /chatbot/send  (저장만 수행; 봇 응답은 파이썬이 저장)
export const chatbotSendController = async (req, res) => {
  try {
    const { content, userNo, mode } = req.body || {};
    if (!content || !userNo) {
      return res.status(400).json({ success: false, message: 'content, userNo는 필수입니다.' });
    }
    // mode가 안 오면 기본 CONSULT로
    const saved = await sendChatbotMessage({
      content,
      userNo,
      mode: mode || 'CONSULT',
      summary: null
    });
    return res.status(201).json({ success: true, data: saved });
  } catch (e) {
    console.error('chatbotSendController error:', e);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
};

// GET /chatbot/send?date=YYYY-MM-DD  (date 없으면 전체)
export const chatbotGetController = async (req, res) => {
  try {
    const { date } = req.query || {};
    const rows = date
      ? await getChatbotMessagesByDate(date)
      : await getAllChatbotMessages();

    // 상담챗봇 메시지만 필터링
    const filtered = rows.filter(r => r.m_mode === 'CONSULT' || r.m_mode === 'BOT');

    return res.status(200).json({ success: true, data: filtered });
  } catch (e) {
    console.error('chatbotGetController error:', e);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
};

