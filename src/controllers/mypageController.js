import { getMyInfo, getMyChildren } from '../services/mypageService.js';
import { updateMyProfile } from '../services/mypageService.js';
import { updateChildProfile } from '../services/mypageService.js';

// 부모 정보 조회
async function getMyPage(req, res) {
  try {
    const email = req.user.email;
    const userInfo = await getMyInfo(email);
    res.status(200).json(userInfo);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
}

// 자녀 정보 조회
async function getMyChildrenInfo(req, res) {
  try {
    const email = req.user.email;
    const children = await getMyChildren(email);
    res.status(200).json(children);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
}

// 회원 정보 수정 (이름/전화/성별/프로필이미지/비밀번호)
export async function updateMyProfileController(req, res) {
  try {
    const email = req.user.u_email; // 미들웨어가 u_email로 세팅하는 기준
    const dto = req.body;           // { u_name?, u_phone?, u_gender?, u_img?, currentPassword, newPassword? }

    const updated = await updateMyProfile(email, dto);
    return res.status(200).json(updated);
  } catch (err) {
    // 에러 코드별 응답
    if (err.code === 'USER_NOT_FOUND') return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    if (err.code === 'CURRENT_PASSWORD_REQUIRED') return res.status(400).json({ message: '현재 비밀번호가 필요합니다.' });
    if (err.code === 'WRONG_PASSWORD') return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    if (err.code === 'NO_FIELDS') return res.status(400).json({ message: '수정할 필드가 없습니다.' });
    return res.status(500).json({ message: err.message || '서버 오류' });
  }
}

// 자녀 프로필 수정
export async function updateChildProfileController(req, res) {
  try {
    const email = req.user.u_email;  // 로그인한 부모
    const dto = req.body;            // { child_no, u_name?, u_birth?, u_gender?, u_img? }

    const updatedChild = await updateChildProfile(email, dto);
    return res.status(200).json(updatedChild);
  } catch (err) {
    if (err.code === 'PARENT_NOT_FOUND') return res.status(404).json({ message: '부모 계정을 찾을 수 없습니다.' });
    if (err.code === 'CHILD_NOT_FOUND') return res.status(404).json({ message: '자녀 계정을 찾을 수 없습니다.' });
    if (err.code === 'NO_FIELDS') return res.status(400).json({ message: '수정할 필드가 없습니다.' });
    if (err.code === 'NOT_AUTHORIZED') return res.status(403).json({ message: '해당 자녀를 수정할 권한이 없습니다.' });
    return res.status(500).json({ message: err.message || '서버 오류' });
  }
}

export { getMyPage, getMyChildrenInfo };
