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
    userId,
    password,
    category,
    acess_token,
    role,
    resume,
    resume_url,
    self_intro,
    self_intro_url,
    carrer_desc,
    career_desc_url,
    portpolio_url,
    created_at,
    updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, 
    $7, 1, $9, $10, $11, 
    $12, $13, $14, $15,NOW(), NOW()
  );
`;

