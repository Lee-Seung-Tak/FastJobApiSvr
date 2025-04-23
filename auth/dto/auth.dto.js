class LoginDTO{
    // 객체의 email, password 초기화
    constructor( email, password ){
        this.email    = email;
        this.password = password;
    }

    static isValid( loginData ){
        const { email, password } = loginData;

        // email, password 데이터 유무 확인
        if (!email || !password)
            throw new Error('Email and password are required');
        
        return new LoginDTO( email, password );
    }

}

module.exports = LoginDTO;