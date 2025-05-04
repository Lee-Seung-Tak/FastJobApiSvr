const { serveFiles } = require("swagger-ui-express");

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
    constructor ( userData, userFiles) {
        //name, email, phone, user_id, password, category, 
        // resume, resume_url, self_intro, self_intro_url, carrer_desc, career_desc_url, portpolio_url
        this.name          = userData.name;
        this.email         = userData.email;
        this.phone         = userData.phone;
        this.userId        = userData.userId;
        this.password      = userData.password;
        this.category      = userData.category;
        
        const newUserFiles = userFiles.reduce( (acc, fileData ) => {
            if ( fileData.portpolioUrl != '' )
                acc[fileData.fieldname+'Url'] = fileData.path;
            return acc;
        }, {});
  
        userFiles.resume           = userFiles.resume           ?? '';
        userFiles.selfIntro        = userFiles.selfIntro        ?? '';
        userFiles.carrerDesc       = userFiles.carrerDesc       ?? '';
        userFiles.portpolioUrl     = userFiles.portpolioUrl     ?? '';

        newUserFiles.resumeUrl     = newUserFiles.resumeUrl     ?? '';
        newUserFiles.selfIntroUrl  = newUserFiles.selfIntroUrl  ?? '';
        newUserFiles.carrerDescUrl = newUserFiles.carrerDescUrl ?? '';
        newUserFiles.portpolioUrl  = newUserFiles.portpolioUrl  ?? '';


        this.resume                = userFiles.resume;
        this.selfIntro             = userFiles.selfIntro;
        this.carrerDesc            = userFiles.carrerDesc;
        this.portpolioUrl          = userFiles.portpolioUrl;

        this.resumeUrl             = newUserFiles.resumeUrl;     
        this.selfIntroUrl          = newUserFiles.selfIntroUrl;
        this.carrerDescUrl         = newUserFiles.carrerDescUrl; 

    }
    static isValid( userData, userFiles) {
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
        
        // if( userFiles == [] )
        // {
        //     userFiles.resume    = '';
        //     userFiles.selfIntro = '';
        //     userFiles.carrerDesc = '';
        //     userFiles.portpolioUrl = ''
        // }
        
        return new SignUpDTO( userData, userFiles);
    }

    

}
module.exports = {
    SignUpDTO,
    LoginDTO
}
