class LoginDTO { 
    // 객체의 email, password 초기화
    constructor( userId, password ) {
        this.userId   = userId;
        this.password = password;
    }

    static isValid(loginData) {
        // 조건 수정 -> loginData가 없거나, loginData.userId 및 password가 없거나
        // 중복되는 조건 최적화
        if (!loginData || !loginData.userId || !loginData.password) {
            throw new Error('user_id and password are required');
        }
        const { userId, password } = loginData;
        return new LoginDTO(userId, password);
    }

}

class SignUpDTO {

}
module.exports = {
    SignUpDTO,
    LoginDTO
}
