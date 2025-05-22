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

module.exports = {SignUpDTO}