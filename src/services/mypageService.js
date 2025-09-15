import bcrypt from 'bcrypt';
import {
  findMypageUserByEmail,
  findChildrenByUserId
} from '../repositories/mypageRepository.js';
import { toChildrenResponseDto } from '../dtos/mypageChildrenResponseDto.js';
import { toMypageResponseDto } from '../dtos/mypageResponseDto.js';
import {
  findMypageUserByEmail,
  findParentAuthByEmail,
  updateUserByUserNo,
  findMypageUserByUserNo,
} from '../repositories/mypageRepository.js';
import { toUserUpdateValues } from '../dtos/userUpdateDto.js'; // 파일명은 네가 쓴 실제 경로/이름에 맞춰
import { toMypageResponseDto } from '../dtos/mypageResponseDto.js';
import {
  findMypageUserByEmail,
  findChildByUserNo,
  updateChildByUserNo
} from '../repositories/mypageRepository.js';
import { toChildrenResponseDto } from '../dtos/mypageChildrenResponseDto.js';


async function getMyInfo(email) {
  const user = await findMypageUserByEmail(email);
  if (!user) throw new Error('User not found');
  return toMypageResponseDto(user);
}

async function getMyChildren(email) {
  const parent = await findMypageUserByEmail(email);
  if (!parent) throw new Error('부모 계정을 찾을 수 없습니다');

  const children = await findChildrenByUserId(parent.user_id);
  return toChildrenResponseDto(children);
}

export async function updateMyProfile(email, dto) {
  // 1) 사용자 + 비번 조회
  const me = await findParentAuthByEmail(email);
  if (!me) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // 2) 현재 비밀번호 필수
  if (!dto.currentPassword) {
    const err = new Error('Current password required');
    err.code = 'CURRENT_PASSWORD_REQUIRED';
    throw err;
  }

  // 3) 현재 비밀번호 검증
  const ok = await bcrypt.compare(dto.currentPassword, me.user_pw);
  if (!ok) {
    const err = new Error('Wrong password');
    err.code = 'WRONG_PASSWORD';
    throw err;
  }

  // 4) 업데이트 값 구성
  const updates = toUserUpdateValues(dto); // { u_name?, u_phone?, u_gender?, u_img?, user_pw? }
  if (!updates || Object.keys(updates).length === 0) {
    const err = new Error('No fields to update');
    err.code = 'NO_FIELDS';
    throw err;
  }

  // 새 비밀번호가 있으면 해시
  if (updates.user_pw) {
    updates.user_pw = await bcrypt.hash(updates.user_pw, 10);
  }

  // 5) 업데이트 실행
  await updateUserByUserNo(me.user_no, updates);

  // 6) 최신 정보 조회 후 DTO 반환
  const fresh = await findMypageUserByUserNo(me.user_no);
  return toMypageResponseDto(fresh);
}

export async function updateChildProfile(parentEmail, dto) {
  // 1. 부모 찾기
  const parent = await findMypageUserByEmail(parentEmail);
  if (!parent) {
    const err = new Error('Parent not found');
    err.code = 'PARENT_NOT_FOUND';
    throw err;
  }

  // 2. 자녀 조회 (parent.user_id와 연결 확인)
  const child = await findChildByUserNo(dto.child_no);
  if (!child) {
    const err = new Error('Child not found');
    err.code = 'CHILD_NOT_FOUND';
    throw err;
  }
  if (child.user_id !== parent.user_id) {
    const err = new Error('Not authorized to update this child');
    err.code = 'NOT_AUTHORIZED';
    throw err;
  }

  // 3. 업데이트 값 구성
  const updates = {};
  if (dto.u_name) updates.u_name = dto.u_name;
  if (dto.u_birth) updates.u_birth = dto.u_birth;
  if (dto.u_gender) updates.u_gender = dto.u_gender;
  if (dto.u_img) updates.u_img = dto.u_img;

  if (Object.keys(updates).length === 0) {
    const err = new Error('No fields to update');
    err.code = 'NO_FIELDS';
    throw err;
  }

  // 4. 업데이트 실행
  await updateChildByUserNo(dto.child_no, updates);

  // 5. 최신 자녀 정보 반환
  const fresh = await findChildByUserNo(dto.child_no);
  return toChildrenResponseDto([fresh])[0]; // 배열→단일 객체
}

export { getMyInfo, getMyChildren };
