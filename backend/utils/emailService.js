const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Campus Canteen OTP',
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #FF6B35;">${otp}</h1>
        <p>Valid for 10 minutes.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { generateOTP, sendOTP };