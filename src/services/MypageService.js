// 마이페이지 기능들 (회원정보 수정, 아이정보 수정) 관련 코드
import { getUserById, updateUser, findUserByEmail } from '../repositories/MypageRepository.js';
import { verifyEmailCode as verifyEmailCodeService, sendVerificationEmail, verificationCodes } from './UserService.js';
import { getChildrenByParentId, updateChild, deleteChild   } from '../repositories/MypageRepository.js';     // 자녀정보 수정

// 개인정보 조회
export const getUserInfo = async (user_no) => {
  const user = await getUserById(user_no);
  if (!user) throw new Error('존재하지 않는 사용자입니다.');
  return user;
};

// 개인정보 수정
export const updateUserInfo = async (user_no, data) => {
  const { u_name, u_phone, u_email, u_gender, new_pw, emailVerificationCode } = data;

  const user = await getUserById(user_no);
  if (!user) throw new Error('사용자를 찾을 수 없습니다.');

  // 이메일 변경 시 인증 코드 검증
  if (u_email && u_email !== user.u_email) {
    if (!emailVerificationCode) throw new Error('이메일 변경 시 인증 코드가 필요합니다.');
    // 최종 시점 (remove = true 추가) 인증번호 삭제
    await verifyEmailCodeService(u_email, emailVerificationCode, true);     // UserService.js에서 처리
  }

  // 업데이트 수행
  const updatedData = {
    u_name: u_name ?? user.u_name,
    u_phone: u_phone ?? user.u_phone,
    u_email: u_email ?? user.u_email,
    u_gender: u_gender ?? user.u_gender,
    user_pw: new_pw ?? user.user_pw     // new_pw가 undefined인 경우 -> 기존 비밀번호 유지
  };

  await updateUser(user_no, updatedData);
};

// 이메일 인증 코드 전송
export const sendEmailVerification = async (u_email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[u_email] = code;
  await sendVerificationEmail(u_email, code);
};

// 이메일 인증 코드 검증 (remove = true 추가 : 개인정보 수정에서 이메일 변경시 필요)
export const verifyEmail = async (u_email, code, remove = true) => {
  verifyEmailCodeService(u_email, code, remove);      // remove 추가 (250919)
};

// 부모(user_no) 기준 '자녀 목록 조회'
export const getChildrenInfo = async (parent_no) => {
  const children = await getChildrenByParentId(parent_no);
  return children;
};

// 자녀 정보 수정 (한 명씩 업데이트 가능)
export const updateChildInfo = async (child_id, data) => {
  await updateChild(child_id, data);
};

// 자녀 정보 삭제
export const deleteChildInfo = async (child_id) => {
  await deleteChild(child_id);
};