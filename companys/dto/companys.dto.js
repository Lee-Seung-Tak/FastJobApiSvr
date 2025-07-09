class SignUpDTO {
    constructor ( companyData ) {
        // name, email, phone, address, companyId, password, business
        this.name      = companyData.name;
        this.email     = companyData.email;
        this.phone     = companyData.phone;
        this.address   = companyData.address;
        this.companyId = companyData.companyId;
        this.password  = companyData.password;
        this.business  = companyData.business;
    }

    static isValid( companyData ) {
        if (
          !companyData          ||
          !companyData.name     ||
          !companyData.email    ||
          !companyData.phone    ||
          !companyData.address  ||
          !companyData.companyId||
          !companyData.password ||
          !companyData.business
        ) {
          throw new Error('check company data (name, email, phone, address, companyId, password, business)');
        }

        return new SignUpDTO( companyData );
    }
}

class LoginDTO { 
  // 객체의 id, password 초기화
  constructor( companyId, password ) {
      this.companyId = companyId;
      this.password  = password;
  }

  static isValid ( loginData ) {
      // 조건 수정 -> loginData가 없거나, loginData.companyId 및 password가 없거나
      // 중복되는 조건 최적화
      if (!loginData || !loginData.companyId || !loginData.password) {
          throw new Error('company_id and password are required');
      }
      const { companyId, password } = loginData;
      return new LoginDTO(companyId, password);
  }

}

module.exports = {
  SignUpDTO,
  LoginDTO
};