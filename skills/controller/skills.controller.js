const skillsService = require('@skills_service');



exports.getAllSkills = async (req, res) => {
    try {
      const skills = await skillsService.getAllSkills();
      return res.status(200).json({ skills });
    } catch (err) {
      console.error('[ERROR] getAllSkills:', err);
      return res.status(500).json({ message: '기술 목록 조회 실패' });
    }
  };