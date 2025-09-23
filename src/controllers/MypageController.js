// 마이페이지 기능들 (회원정보 수정, 아이정보 수정) 관련 코드
import { 
    getUserInfo, 
    updateUserInfo, 
    sendEmailVerification, 
    verifyEmail 
} from '../services/MypageService.js';
import { getChildrenInfo, updateChildInfo, deleteChildInfo   } from '../services/MypageService.js';     // 자녀정보 수정

// 로그인한 사용자의 개인정보 조회
export const getUserInfoHandler = async (req, res) => {
  try {
    const { user_no } = req.user;
    if (!user_no) return res.status(400).json({ error: '회원 정보가 없습니다.' });

    const user = await getUserInfo(user_no);
    return res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '서버 오류' });
  }
};

// 개인정보 수정 처리
export const updateUserInfoHandler = async (req, res) => {
  try {
    const { user_no } = req.user;
    const { u_name, u_phone, u_email, u_gender, current_pw, new_pw, emailVerificationCode } = req.body;

    if (!user_no) return res.status(400).json({ error: '회원 정보가 없습니다.' });

    await updateUserInfo(user_no, { u_name, u_phone, u_email, u_gender, new_pw: new_pw, emailVerificationCode });

    return res.status(200).json({ message: '개인정보가 수정되었습니다.' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

// 이메일 변경 시 인증 코드 요청
export const sendEmailVerificationHandler = async (req, res, body) => {
  try {
    const { u_email } = JSON.parse(body);
    if (!u_email) return res.status(400).json({ error: '이메일 입력 필요' });

    await sendEmailVerification(u_email);

    return res.status(200).json({ message: '인증 코드가 이메일로 전송되었습니다.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '메일 전송 실패' });
  }
};

// 이메일 인증 코드 검증
export const verifyEmailCodeHandler = async (req, res, body) => {
  try {
    const { u_email, code } = JSON.parse(body);
    if (!u_email || !code) return res.status(400).json({ error: '이메일과 인증코드 필요' });

    await verifyEmail(u_email, code, false);      // false 추가 -> 마이페이지 개인정보 수정(이메일)

    return res.status(200).json({ message: '이메일 인증 완료'});
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

// 자녀 정보 조회
export const getChildrenInfoHandler = async (req, res) => {
  try {
    const { user_no } = req.user;
    if (!user_no) return res.status(400).json({ error: '회원 정보가 없습니다.' });

    const children = await getChildrenInfo(user_no);
    return res.status(200).json(children);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '서버 오류' });
  }
};

// 자녀 정보 수정
export const updateChildInfoHandler = async (req, res) => {
  try {
    const { child_id, c_name, c_gender, c_birth, c_content } = req.body;

    if (!child_id) return res.status(400).json({ error: 'child_id가 필요합니다.' });

    await updateChildInfo(child_id, { c_name, c_gender, c_birth, c_content });
    return res.status(200).json({ message: '자녀 정보가 수정되었습니다.' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

// 자녀 정보 삭제
export const deleteChildInfoHandler = async (req, res) => {
  try {
    const { child_id } = req.params;   // URL 파라미터에서 child_id 가져오기

    if (!child_id) return res.status(400).json({ error: 'child_id가 필요합니다.' });

    await deleteChildInfo(child_id);

    return res.status(200).json({ message: '자녀 정보가 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};