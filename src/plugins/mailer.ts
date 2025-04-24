// mailer.ts
import dotenv from 'dotenv';

dotenv.config();

import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const { GMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

// 1) OAuth2 클라이언트 설정
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground', // Redirect URI
);
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN! });
const { token: accessToken } = await oAuth2Client.getAccessToken();
export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // ← 반드시 gmail 서버
  port: 465, // SSL 전용 포트
  secure: true, // SSL 모드
  auth: {
    type: 'OAuth2',
    user: GMAIL_USER,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    refreshToken: GOOGLE_REFRESH_TOKEN?.trim(),
    accessToken,
  },
});
transporter.verify();
