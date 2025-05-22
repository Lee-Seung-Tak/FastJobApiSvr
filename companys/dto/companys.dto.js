class SignUpDTO {
    constructor ( userData ) {
        // name, email, phone, address, companyId, password, business
        this.name      = userData.name;
        this.email     = userData.email;
        this.phone     = userData.phone;
        this.address   = userData.address;
        this.userId    = userData.userId;
        this.password  = userData.password;
        this.business  = userData.business;
    }

    static isValid( userData ) {
        if (
          !userData          ||
          !userData.name     ||
          !userData.email    ||
          !userData.phone    ||
          !userData.address  ||
          !userData.userId   ||
          !userData.password ||
          !userData.business
        ) {
          throw new Error('check user data (name, email, phone, userId, password, business)');
        }

        return new SignUpDTO( userData );
    }
}

class LoginDTO { 
  // 객체의 email, password 초기화
  constructor( userId, password ) {
      this.userId   = userId;
      this.password = password;
  }

  static isValid ( loginData ) {
      // 조건 수정 -> loginData가 없거나, loginData.userId 및 password가 없거나
      // 중복되는 조건 최적화
      if (!loginData || !loginData.userId || !loginData.password) {
          throw new Error('user_id and password are required');
      }
      const { userId, password } = loginData;
      return new LoginDTO(userId, password);
  }

}

module.exports = {
  SignUpDTO,
  LoginDTO
};