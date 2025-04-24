// src/utils/mailTemplate.ts
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 에서 __filename, __dirname 흉내 내기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 템플릿 파일 경로
const templatePath = path.resolve(__dirname, 'templates/verification.html');
const templateSource = readFileSync(templatePath, 'utf8');

/**
 * 인증 코드가 들어간 이메일 HTML 생성
 * @param {string} code - 사용자에게 보낼 인증 코드
 * @returns {string}
 */
export function generateVerificationEmail(code: string): string {
  return templateSource.replace('{{VERIFICATION_CODE}}', code);
}
