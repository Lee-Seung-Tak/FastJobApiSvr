// query.js

/**
* 함수명을 key로 가지고, value는 함수에서 사용하는 쿼리를 작성하여 관리하는 구조
*/
export const login = "SELECT * FROM users.user_account WHERE user_id = $1";

export const loginSuccess = "UPDATE users.user_account SET access_token = $1, refresh_token = $2, updated_at = $3 WHERE user_id=$4;";

export const checkIdDuplicate = "SELECT * FROM users.user_account WHERE user_id = $1 LIMIT 1;";

export const insertSignupData = ` INSERT INTO users.user_account (
    name,
    email,
    phone,
    user_id,
    password,
    category,
    access_token,
    role,
    resume,
    resume_url,
    self_intro,
    self_intro_url,
    career_desc,
    career_desc_url,
    portpolio_url,
    created_at,
    updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, 
    $7, $8, $9, $10, $11, 
    $12, $13, $14, $15, NOW(), NOW()
  );
`;

export const checkSignUpToken = `SELECT access_token
  FROM users.user_account
  WHERE email = $1
`;


export const signupSuccess = `UPDATE users.user_account
  SET role = 2 , access_token = null
  WHERE email = $1
`;

export const sendEmailFalse = `UPDATE users.user_account
  SET role = 3
  WHERE email = $1
`;

export const getUserPassword = `SELECT password
  FROM users.user_account
  WHERE user_id = $1;
`;

export const patchPassword = `UPDATE users.user_account
  SET password = $1
  WHERE user_id = $2
`;

export const patchPhoneNumber = `UPDATE users.user_account
  SET phone = $1 
  WHERE user_id = $2
`;

export const getUserById = `
  SELECT
    id,
    name,
    email,
    phone,
    user_id,
    role,
    category,
    resume,
    resume_url,
    self_intro,
    self_intro_url,
    career_desc,
    career_desc_url,
    portfolio_url,
    access_token,
    refresh_token,
    created_at,
    updated_at
  FROM users.user_account
  WHERE user_id = $1
`;

export const getUserData = `
  SELECT
    category,
    resume,
    self_intro,
    career_desc
  FROM users.user_account
  WHERE user_id = $1
`;

export const updateResumeUrl = `
  UPDATE users.user_account
  SET
    resume_url = $2,
    updated_at = NOW()
  WHERE user_id = $1
  RETURNING resume_url
`;

export const updateSelfIntroUrl = `
  UPDATE users.user_account
     SET self_intro_url = $2,
         updated_at     = NOW()
   WHERE user_id       = $1
 RETURNING self_intro_url
`;

export const updateCareerDescUrl = `
  UPDATE users.user_account
     SET career_desc_url = $2,
         updated_at      = NOW()
   WHERE user_id        = $1
 RETURNING career_desc_url
`;

export const getResumeUrl = `SELECT resume_url FROM users.user_account WHERE user_id = $1`

export const getSelfIntroUrl = `SELECT self_intro_url FROM users.user_account WHERE user_id = $1`

export const getCareerDescUrl = `SELECT career_desc_url FROM users.user_account WHERE user_id = $1`