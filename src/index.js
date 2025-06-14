import express from 'express';
import bodyParser from 'body-parser';
import { sendMessageController } from './controllers/message.controller.js'; //메시지 전송
import { getMessagesController } from './controllers/message.controller.js'; //메시지 조회
import { markMessageReadController } from './controllers/message.controller.js'; //메시지 읽음 처리
import { deleteMessageController } from './controllers/message.controller.js'; //메시지 삭제
import { getChatDateListController } from './controllers/message.controller.js'; //대화 목록 조회
import { getChatDetailByDateController } from './controllers/message.controller.js'; //대화 상세 조회
import { deleteChatByDateController } from './controllers/message.controller.js'; //특정 날짜 대화 삭제
import { searchChatMessagesController } from './controllers/message.controller.js'; //대화 내용 검색



const app = express();
app.use(bodyParser.json());

app.post('/messages/send', sendMessageController); //메시지 전송
app.get('/messages', getMessagesController); //메시지 조회
app.patch('/messages/:message_no/read', markMessageReadController); //메시지 읽음 처리
app.delete('/messages/:message_no', deleteMessageController); //메시지 삭제(소프트 딜리트)
app.get('/messages/chatlist/search', searchChatMessagesController); //대화 내용 검색
app.get('/messages/chatlist', getChatDateListController); //대화 목록 조회
app.get('/messages/chatlist/:date', getChatDetailByDateController); //대화 상세 조회
app.delete('/messages/chatlist/:date', deleteChatByDateController); //특정 날짜 대화 삭제







const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});