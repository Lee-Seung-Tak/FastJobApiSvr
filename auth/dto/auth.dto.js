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

class SignUpDTO {
    constructor ( userData ) {
        //name, email, phone, user_id, password, category, 
        // resume, resume_url, self_intro, self_intro_url, carrer_desc, career_desc_url, portpolio_url
        this.name     = userData.name;
        this.email    = userData.email;
        this.phone    = userData.phone;
        this.userId   = userData.userId;
        this.password = userData.password;
        this.category = userData.category;
    }
    static isValid(userData) {
        if (
          !userData          ||
          !userData.name     ||
          !userData.email    ||
          !userData.phone    ||
          !userData.userId   ||
          !userData.password ||
          !userData.category
        ) {
          throw new Error('check user data(name, email, phone, userId, password, category)');
        }
      
        return new SignUpDTO(userData);
    }

    static fileIsVaild( userFiles ) {
        userFiles.resume         = !userFiles.resume         ? userFiles.resume        : '';
        userFiles.resumeUrl      = !userFiles.resumeUrl      ? userFiles.resumeUrl     : '';
        userFiles.selfIntro      = !userFiles.selfIntro      ? userFiles.selfIntro     : '';
        userFiles.selfIntroUrl   = !userFiles.selfIntroUrl   ? userFiles.selfIntroUrl  : '';
        userFiles.carrerDesc     = !userFiles.carrerDesc     ? userFiles.carrerDesc    : '';
        userFiles.careerDescUrl  = !userFiles.careerDescUrl  ? userFiles.careerDescUrl : '';
        userFiles.portpolioUrl   = !userFiles.portpolioUrl   ? userFiles.portpolioUrl  : '';

        return userFiles;
    }
    

}
module.exports = {
    SignUpDTO,
    LoginDTO
}
