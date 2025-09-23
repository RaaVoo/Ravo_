// function toMypageResponseDto(user) {
//   return {
//     user_no: user.user_no,
//     u_name: user.u_name,
//     u_email: user.u_email,
//     u_phone: user.u_phone,
//     u_gender: user.u_gender,
//     u_birth: user.u_birth,
//     u_img: user.u_img,
//     chat_flag: user.chat_flag,
//     user_flag: user.user_flag
//   };
// }

// module.exports = { toMypageResponseDto };

export function toMypageResponseDto(user) {
  return {
    user_no: user.user_no,
    u_name: user.u_name,
    u_email: user.u_email,
    u_phone: user.u_phone,
    u_gender: user.u_gender,
    u_birth: user.u_birth,
    u_img: user.u_img,
    chat_flag: user.chat_flag,
    user_flag: user.user_flag
  };
}

