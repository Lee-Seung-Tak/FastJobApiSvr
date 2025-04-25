class LoginDTO{
    // 객체의 email, password 초기화
    constructor( userId, password ) {
        this.userId   = userId;
        this.password = password;
    }

    static isValid( loginData ) {
        try {

            const { userId, password } = loginData;
            if (!userId || !password)
                throw new Error('user_id and password are required');
            
            return new LoginDTO( userId, password );
            
        } catch ( error ) {
            throw new Error('user_id and password are required');
        }
    }

}

module.exports = LoginDTO;