const db           = require('@db');
const queryJson    = require('@query');
const fs           = require('fs');
const path         = require('path');
require('dotenv').config();


// 통합 유저 정보 수정 (비밀번호·전화·주소)
exports.patchUser = async ( patchUserData ) => {
    const { userId, oldPassword, newPassword, confirmPassword, phone } = patchUserData;
    // 비밀번호 변경
     // 연락처
      if (phone) {
        const result = await db.query(queryJson.updatePhone, [phone, userId]);
        console.log('updatePhone rowCount:', result.rowCount);
      }
  
      if (oldPassword || newPassword || confirmPassword) {
       if (!newPassword || newPassword !== confirmPassword) {
        const err = new Error('New passwords do not match'); err.statusCode = 400; 
        throw err;
      }
      let queryResult = await db.query(queryJson.login, [userId]);
      queryResult     = queryResult.rows[0];
       if (!queryResult || queryResult.password !== oldPassword) {
        const err = new Error('Old password is incorrect'); err.statusCode = 401; 
        throw err;
      }
      await db.query(queryJson.updatePassword, [newPassword, userId]);
    }
    return { message: 'User information updated successfully' };
  };
  