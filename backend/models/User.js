// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    gender: String,
    password: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
