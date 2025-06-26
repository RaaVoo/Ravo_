// 자녀 추가 기능 관련된 코드
import { pool } from '../config/db.js';

export const addChildHandler = async (req, res) => {
    try {
        // 프론트에서 POST 요청으로 전달된 자녀 관련 정보를 추출함
        const { parent_no, c_name, c_gender, c_birth, c_content } = req.body;

        if (!parent_no || !c_name || !c_gender || !c_birth) {
            return res.status(400).json({ error: '필수 항목이 누락되었습니다. '});
        }

        const query = `INSERT INTO Child (parent_no, c_name, c_gender, c_birth, c_content) VALUES (?, ?, ?, ?, ?)`;

        // pool.execute를 통해 SQL 실행함
        const [result] = await pool.execute(query, [ parent_no, c_name, c_gender, c_birth, c_content || null ]);

        res.status(200).json({ message: '자녀 정보가 성공적으로 등록되었습니다.' });
    } catch (error) {
        console.error('자녀 추가 중 오류 발생: ', error);
        res.status(500).json({ error: '서버 오류가 발생하였습니다. '});
    }
}