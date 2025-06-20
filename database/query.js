// query.js

/**
* 함수명을 key로 가지고, value는 함수에서 사용하는 쿼리를 작성하여 관리하는 구조
*/
export const login = "SELECT * FROM users.user_account WHERE user_id = $1";

export const loginSuccess = "UPDATE users.user_account SET access_token = $1, refresh_token = $2, updated_at = $3 WHERE user_id=$4;";

export const checkIdDuplicate = "SELECT * FROM users.user_account WHERE user_id = $1 LIMIT 1;";

export const insertSignupData = `INSERT INTO users.user_account (
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

export const updateResume = `UPDATE users.user_account
  SET resume = $1
  WHERE user_id = $2
`;

export const updateSelfIntro = `UPDATE users.user_account
  SET self_intro = $1
  WHERE user_id = $2`;

export const updateCareerDesc = `UPDATE users.user_account
  SET career_desc = $1
  WHERE user_id = $2`;

export const updateResumeUrl = `UPDATE users.user_account
  SET resume_url = $1
  WHERE user_id = $2
`;

export const updateSelfIntroUrl = `UPDATE users.user_account
  SET self_intro_url = $1
  WHERE user_id = $2
`;

export const updateCareerDescUrl = `UPDATE users.user_account
  SET career_desc_url = $1
  WHERE user_id = $2
`;

export const updateUserTokens = ` UPDATE users.user_account
  SET access_token = $1, refresh_token = $2
  WHERE user_id = $3;
`;

export const getSkillsByUserId = `
  SELECT s.id, s.skill
  FROM users.user_account ua
  JOIN users.user_skill us ON ua.id = us.user_id
  JOIN skill.skill s ON us.skill_id = s.id
  WHERE ua.user_id = $1
  ORDER BY s.id;
`;

export const getAllSkills = `
  SELECT id, skill
  FROM skill.skill
  ORDER BY id;
`;

export const insertUserSkill = `
  INSERT INTO users.user_skill (user_id, skill_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING;
`;

export const getUserPk = `SELECT id FROM users.user_account WHERE user_id = $1`;

export const getJobApplications =`
    SELECT application_id, status, notified
    FROM users.job_application
    WHERE user_id = $1
`;

  export const insertCompanySignupData = `INSERT INTO company.company_account (
    name,
    email,
    phone,
    address,
    company_id,
    password,
    business,
    role,
    access_token,
    created_at,
    updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, 
    $7, $8, $9, NOW(), NOW()
  );
`;

export const checkCompanyIdDuplicate = "SELECT * FROM company.company_account WHERE company_id = $1 LIMIT 1;";

export const sendCompanyEmailFalse = `UPDATE company.company_account
  SET role = 3
  WHERE email = $1
`;

export const companyLogin = "SELECT * FROM company.company_account WHERE company_id = $1";

export const companyLoginSuccess = "UPDATE company.company_account SET access_token = $1, refresh_token = $2, updated_at = $3 WHERE company_id=$4;";

export const companyCheckSignUpToken = `SELECT access_token
  FROM company.company_account
  WHERE email = $1
`;

export const companySignupSuccess = `UPDATE company.company_account
  SET role = 2 , access_token = null
  WHERE email = $1
`;

export const IsUserValid = `SELECT COUNT(*)
FROM users.user_account
WHERE email = $1;
`;

export const updateTokenIsNull = `UPDATE users.user_account
SET access_token = NULL
WHERE email = $1;`

export const updateToken = `UPDATE users.user_account
SET access_token = $1
WHERE email = $2;`

export const updateUserPassworkd = `UPDATE users.user_account
SET password = $1
WHERE email = $2;`

export const findUserId = `SELECT user_id FROM users.user_account WHERE email =$1`;

export const updateIdToken = `UPDATE users.user_account
SET id_find_token = $1
WHERE email = $2;`

export const duplicateEmail = 'SELECT 1 FROM users.user_account WHERE email = $1 LIMIT 1';

export const updateIdFindTokenIsNull = `UPDATE users.user_account
SET id_find_token = NULL
WHERE email = $1;`

export const updatePasswordTokenIsNull = `UPDATE users.user_account
SET id_find_token = NULL
WHERE email = $1;`

export const insertUserApplications = `
INSERT INTO company.application (
  user_id, post_id, resume, self_intro, career_desc, status
)
SELECT
  $1::int, $2::int, a.resume, a.self_intro, a.career_desc, 0
FROM users.user_account a
WHERE a.id = $1::int
RETURNING id;
;`

export const duplicateApplication = `
SELECT 1
FROM company.application
WHERE user_id = $1 AND post_id = $2
LIMIT 1
;`
export const insertJobApplication = `
INSERT INTO users.job_application (
  user_id, application_id, status
)
VALUES ($1, $2, 0)
RETURNING id;
;`

export const deleteApplicationById = `
DELETE FROM company.application
WHERE id = $1
  AND status = 0;
`;

export const deleteJobApplication = `
DELETE FROM users.job_application
WHERE user_id = $1
  AND application_id = $2
  AND status = 0;
`;