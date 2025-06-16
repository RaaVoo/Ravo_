import { pool } from '../config/db.js';

//메시지 전송
export const saveMessage = async (messageDTO) => {
  const query = `
    INSERT INTO chat (
      createdDate,
      modifiedDate,
      m_content,
      m_mode,
      m_read,
      m_del,
      m_summary,
      user_no
    ) VALUES (NOW(), NOW(), ?, ?, 'N', 'N', ?, ?)
  `;

  const values = [
    messageDTO.m_content,
    messageDTO.m_mode,
    messageDTO.m_summary,
    messageDTO.user_no
  ];

  const [result] = await pool.execute(query, values);

  return {
    id: result.insertId,
    ...messageDTO,
    m_read: 'N',
    m_del: 'N',
    createdDate: new Date()
  };
};

export const findAllMessages = async () => {
  const query = `
    SELECT 
      id,
      createdDate,
      m_content,
      m_mode,
      m_read,
      m_del,
      m_summary,
      user_no
    FROM chat
    ORDER BY id ASC
  `;
  const [rows] = await pool.execute(query);
  return rows;
};

  

// 메시지 읽음 처리
export const markMessageAsRead = async (messageId) => {
  const query = `
    UPDATE chat
    SET m_read = 'Y'
    WHERE id = ?
  `;
  const [result] = await pool.execute(query, [messageId]);
  return result.affectedRows > 0;
};

//메시지 삭제(소프트 딜리트)
export const softDeleteMessageById = async (messageId) => {
  const query = `
    UPDATE chat
    SET m_del = 'Y'
    WHERE id = ?
  `;
  const [result] = await pool.execute(query, [messageId]);
  return result.affectedRows > 0;
};

//대화 목록 조회
export const getChatDateList = async () => {
  const query = `
    SELECT DATE(createdDate) as chat_date
    FROM chat
    WHERE m_del = 'N'
    GROUP BY DATE(createdDate)
    ORDER BY chat_date DESC
  `;

  const [rows] = await pool.execute(query);
  return rows.map(row => row.chat_date); // 날짜만 배열로 반환
};

//대화 상세 조회(특정 날짜 대화 모아보기)
export const getMessagesByDate = async (date) => {
  const query = `
    SELECT *
    FROM chat
    WHERE DATE(createdDate) = ? AND m_del = 'N'
    ORDER BY createdDate ASC
  `;
  const [rows] = await pool.execute(query, [date]);
  return rows;
};

//특정 날짜 대화 몽땅 삭제
export const softDeleteMessagesByDate = async (date) => {
  const query = `
    UPDATE chat
    SET m_del = 'Y'
    WHERE DATE(createdDate) = ? AND m_del = 'N'
  `;
  const [result] = await pool.execute(query, [date]);
  return result.affectedRows; // 삭제된 행 수 반환
};

//대화 내용 검색
export const searchMessages = async (query) => {
  const sql = `
    SELECT createdDate, m_content, m_mode, m_read, m_summary, user_no
    FROM chat
    WHERE m_del = 'N'
      AND (
        m_content LIKE CONCAT('%', ?, '%') OR
        DATE_FORMAT(createdDate, '%Y-%m-%d') LIKE CONCAT('%', ?, '%')
      )
    ORDER BY createdDate DESC
  `;
  const [rows] = await pool.execute(sql, [query, query]);
  return rows;
};
