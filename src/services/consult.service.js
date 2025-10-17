// services/consult.service.js
import {
  saveMessage,
  findAllMessages,
  getMessagesByDate,
} from '../repositories/message.repository.js';
import { MessageDTO } from '../dtos/message.dto.js';

// 상담챗봇: 메시지 저장 (chat_no 없이)
export const sendChatbotMessage = async ({ content, userNo, mode = 'CONSULT', summary = null, chat_flag }) => {
  const dto = new MessageDTO({
    content,
    mode,
    summary,
    userNo,
    // chatNo 없음
    chatFlag: chat_flag,
  });
  return await saveMessage(dto);
};

// 전체 조회 (createdDate ASC 정렬은 레포지토리에서 처리됨)
export const getAllChatbotMessages = async () => {
  const rows = await findAllMessages();
  // 상담챗봇만 반환하고 싶다면 아래 주석 해제
  return rows.filter(r => r.m_mode === 'CONSULT' || r.m_mode === 'BOT');
};

// 날짜별 조회
export const getChatbotMessagesByDate = async (date) => {
  const rows = await getMessagesByDate(date);
  // 상담챗봇만 반환하고 싶다면 아래 주석 해제
  // return rows.filter(r => r.m_mode === 'CONSULT');
  return rows;
};
