import { producer } from '../../plugins/kafka.js';
import { TOPICS } from '../common/constants/topics.js';

export const sendVerificationCodeMail = async (email: string, verificationCode: string) => {
  await producer.send({
    topic: TOPICS.MAIL,
    messages: [
      {
        value: JSON.stringify({
          eventType: 'SEND_VERIFICATION_CODE',
          email,
          code: verificationCode,
          timestamp: Date.now(),
        }),
      },
    ],
  });
};
