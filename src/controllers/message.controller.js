import { sendMessage } from '../services/message.service.js'; //메시지 전송
import { getAllMessages } from '../services/message.service.js'; //메시지 조회
import { readMessage } from '../services/message.service.js'; //메시지 읽음 처리
import { deleteMessage } from '../services/message.service.js'; //메시지 삭제
import { fetchChatDateList } from '../services/message.service.js'; //대화 목록 조회
import { fetchMessagesByDate } from '../services/message.service.js'; //대화 상세 조회
import { deleteMessagesByDate } from '../services/message.service.js'; //특정 날짜 대화 삭제
import { searchChatMessages } from '../services/message.service.js'; //대화 내용 검색

//메시지 전송
export const sendMessageController = async (req, res) => {
  try {
    const { content, mode, summary, userNo, chatNo } = req.body;

    // 누락된 필드 체크
    const missingFields = [];
    if (!content) missingFields.push("content");
    if (!mode) missingFields.push("mode");
    if (!userNo) missingFields.push("userNo");
    if (!chatNo) missingFields.push("chatNo");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `필수 항목 누락: ${missingFields.join(", ")}`
      });
    }

    const result = await sendMessage({ content, mode, summary, userNo, chatNo });
    res.status(201).json({ success: true, data: result });

  } catch (error) {
    console.error('메시지 전송 오류:', error);
    res.status(500).json({ success: false, message: '서버 내부 오류입니다.' });
  }
};


//메시지 조회
export const getMessagesController = async (req, res) => {
  try {
    const messages = await getAllMessages();
    const filtered = messages.filter(m => m.m_mode === 'VOICE');
    res.status(200).json({ success: true, data: filtered });
  } catch (error) {
    console.error('메시지 조회 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류입니다.' });
  }
};

//메시지 읽음 처리
export const markMessageReadController = async (req, res) => {
  try {
    const messageId = req.params.message_no;

    if (!messageId) {
      return res.status(400).json({ success: false, message: 'message_no가 필요합니다.' });
    }

    const success = await readMessage(messageId);

    if (!success) {
      return res.status(404).json({ success: false, message: '해당 메시지를 찾을 수 없습니다.' });
    }

    res.status(200).json({ success: true, message: '메시지가 읽음 처리되었습니다.' });

  } catch (error) {
    console.error('읽음 처리 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류입니다.' });
  }
};

//메시지 삭제(소프트 딜리트)
export const deleteMessageController = async (req, res) => {
  try {
    const messageId = req.params.message_no;

    if (!messageId) {
      return res.status(400).json({ success: false, message: 'message_no가 필요합니다.' });
    }

    const success = await deleteMessage(messageId);

    if (!success) {
      return res.status(404).json({ success: false, message: '해당 메시지를 찾을 수 없습니다.' });
    }

    res.status(200).json({ success: true, message: '메시지가 삭제되었습니다.' });

  } catch (error) {
    console.error('메시지 삭제 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류입니다.' });
  }
};

//대화 목록 조회
export const getChatDateListController = async (req, res) => {
  try {
    const dateList = await fetchChatDateList();
    res.status(200).json({ success: true, data: dateList });
  } catch (error) {
    console.error('대화 날짜 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류입니다.' });
  }
};

//대화 상세 조회
export const getChatDetailByDateController = async (req, res) => {
  try {
    const date = req.params.date;

    if (!date) {
      return res.status(400).json({ success: false, message: 'date가 필요합니다.' });
    }

    const messages = await fetchMessagesByDate(date);
    const filtered = messages.filter(m => m.m_mode === 'VOICE');

    if (!filtered || filtered.length === 0) {
      return res.status(404).json({ success: false, message: '해당 날짜에 대화가 없습니다.' });
    }

    res.status(200).json({ success: true, data: filtered });

  } catch (error) {
    console.error('대화 상세 조회 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류입니다.' });
  }
};

//특정 날짜 대화 삭제
export const deleteChatByDateController = async (req, res) => {
  try {
    const date = req.params.date;

    if (!date) {
      return res.status(400).json({ success: false, message: 'date가 필요합니다.' });
    }

    const deletedCount = await deleteMessagesByDate(date);

    if (deletedCount === 0) {
      return res.status(404).json({ success: false, message: '해당 날짜에 삭제할 메시지가 없습니다.' });
    }

    res.status(200).json({
      success: true,
      message: `총 ${deletedCount}개의 메시지를 삭제했습니다.`,
    });

  } catch (error) {
    console.error('대화 삭제 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류입니다.' });
  }
};

//대화 내용 검색
export const searchChatMessagesController = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ success: false, message: 'query 파라미터가 필요합니다.' });
    }

    const results = await searchChatMessages(query);
    const filtered = results.filter(m => m.m_mode === 'VOICE');

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });

  } catch (error) {
    console.error('대화 검색 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류입니다.' });
  }
};

//요약 메시지만 조회
export const getSummaryMessagesController = async (req, res) => {
  try {
    const messages = await getAllMessages();
    const summaries = messages.filter(m => m.m_mode === 'SUMMARY');

    if (!summaries.length) {
      return res.status(404).json({
        success: false,
        message: '요약 메시지가 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      count: summaries.length,
      data: summaries
    });
  } catch (error) {
    console.error('요약 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류입니다.'
    });
  }
};
