function toUserUpdateValues(dto) {
  const updates = {};

  if (dto.u_name) updates.u_name = dto.u_name;
  if (dto.u_phone) updates.u_phone = dto.u_phone;
  if (dto.u_gender) updates.u_gender = dto.u_gender;
  if (dto.u_img) updates.u_img = dto.u_img;
  if (dto.newPassword) updates.user_pw = dto.newPassword; // 실제 업데이트는 user_pw 컬럼

  return updates;
}

export { toUserUpdateValues };
