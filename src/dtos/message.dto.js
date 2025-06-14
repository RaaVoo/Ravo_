export class MessageDTO {
    constructor({ content, mode, summary, userNo, chatNo }) {
      this.m_content = content;
      this.m_mode = mode;
      this.m_summary = summary || null;
      this.user_no = userNo;
      this.chat_no = chatNo;
    }
  }
  