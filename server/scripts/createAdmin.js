// server/scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const existing = await User.findOne({ email: 'admin@fugipay.com' });
  if (existing) { console.log('Admin already exists'); process.exit(); }

  await User.create({
    name:     'Fugi',
    email:    'admin@fugipay.com',
    password: '1243$$',
    role:     'admin',
  });
  console.log('Admin created — login and change password immediately!');
  process.exit();
});