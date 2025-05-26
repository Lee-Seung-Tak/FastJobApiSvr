// skills/service/skills.service.js
const db = require('@db');
const query = require('@query');

exports.getAllSkills = async () => {
  const result = await db.query(query.getAllSkills);
  return result.rows;
};