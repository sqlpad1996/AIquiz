// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getDashboard, getProfile, updateProfile, changePassword } = require('../controllers/userController');

router.get('/dashboard', verifyToken, getDashboard);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
