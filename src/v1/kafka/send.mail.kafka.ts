import { producer } from '../../plugins/kafka.js';
import { AUTH_EVENTS, MAIL_EVENTS, TOPICS } from '../common/constants/topics.js';

export const sendVerificationCodeMail = async (email: string, verificationCode: string) => {
  await producer.send({
    topic: TOPICS.MAIL,
    messages: [
      {
        value: JSON.stringify({
          eventType: MAIL_EVENTS.SEND_VERIFICATION_CODE,
          email,
          code: verificationCode,
          timestamp: Date.now(),
        }),
      },
    ],
  });
};

export const produceLogoutEvent = async (userId: number) => {
  await producer.send({
    topic: TOPICS.AUTH,
    messages: [
      {
        value: JSON.stringify({
          eventType: AUTH_EVENTS.LOGOUT,
          userId,
          timestamp: Date.now(),
        }),
      },
    ],
  });
};
