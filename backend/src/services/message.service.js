import { saveMessage } from '../repositories/message.repository.js'; //메시지 전송
import { MessageDTO } from '../dtos/message.dto.js'; //메시지 전송
import { findAllMessages } from '../repositories/message.repository.js'; //메시지 조회
import { markMessageAsRead } from '../repositories/message.repository.js'; //메시지 읽음 처리
import { softDeleteMessageById } from '../repositories/message.repository.js'; //메시지 삭제
import { getChatDateList } from '../repositories/message.repository.js'; //대화 목록 조회
import { getMessagesByDate } from '../repositories/message.repository.js'; //대화 상세 조회
import { softDeleteMessagesByDate } from '../repositories/message.repository.js'; //특정 날짜 대화 삭제
import { searchMessages } from '../repositories/message.repository.js'; //대화 내용 검색

//메시지 전송
export const sendMessage = async (data) => {
  const messageDTO = new MessageDTO(data);
  return await saveMessage(messageDTO);
};

//메시지 조회
export const getAllMessages = async () => {
  return await findAllMessages();
};

//메시지 읽음 처리
export const readMessage = async (messageId) => {
  return await markMessageAsRead(messageId);
};

//메시지 삭제(소프트 딜리트)
export const deleteMessage = async (messageId) => {
  return await softDeleteMessageById(messageId);
};

//대화 목록 조회
export const fetchChatDateList = async () => {
  return await getChatDateList();
};

//대화 상세 조회(특정 날짜 대화 모아보기기)
export const fetchMessagesByDate = async (date) => {
  return await getMessagesByDate(date);
};

//특정 날짜 대화 삭제
export const deleteMessagesByDate = async (date) => {
  return await softDeleteMessagesByDate(date);
};

//대화 내용 검색
export const searchChatMessages = async (query) => {
  return await searchMessages(query);
};

