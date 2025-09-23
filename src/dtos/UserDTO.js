// constructor는 user_id나 user_pw 등 필드들을 받아서 DTO 객체로 만들어줌
export class UserDTO {
    constructor({ user_id, user_pw, u_name, u_phone, u_email, u_gender }) {
        this.user_id = user_id;
        this.user_pw = user_pw;
        this.u_name = u_name;
        this.u_phone = u_phone;
        this.u_email = u_email;
        this.u_gender = u_gender;
    }
}

// module.exports = UserDTO;
export default UserDTO;