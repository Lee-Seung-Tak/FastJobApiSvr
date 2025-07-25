const dotenv = require('dotenv');
const jwt    = require('jsonwebtoken');
dotenv.config();

exports.verifyToken = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token not found' });
    }

    try {        
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET);        
        req.userId = decoded.userId; // 디코딩된 사용자 정보 저장
        req.companyId = decoded.companyId;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
