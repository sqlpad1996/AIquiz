// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

router.post('/signup', registerUser);
router.post('/signin', loginUser);

module.exports = router;
