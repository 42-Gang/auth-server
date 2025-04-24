// 파일: mailer.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // TLS용 포트: 587, SSL용 포트는 465
  secure: false, // port 587은 secure=false
  auth: {
    user: process.env.GMAIL_USER, // 예: pingponggame@gmail.com
    pass: process.env.GMAIL_APP_PASS, // 16자리 앱 비밀번호
  },
  tls: {
    rejectUnauthorized: false, // SSL 인증서 서로 검사 안 함 (사내 환경 등 특수시)
  },
});
