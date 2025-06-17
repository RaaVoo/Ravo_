export class MessageDTO {
  constructor({ id, content, mode, summary, userNo, chatNo }) {
    this.id = id;
    this.m_content = content;
    this.m_mode = mode;
    this.m_summary = summary || null;
    this.user_no = userNo;
    this.chat_no = chatNo;
  }
}
