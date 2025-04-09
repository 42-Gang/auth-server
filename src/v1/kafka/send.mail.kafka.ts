import { producer } from '../../plugins/kafka.js';
import { TOPICS } from '../common/constants/topics.js';

export const sendVerificationCodeMail = async (email: string, verificationCode: string) => {
  await producer.send({
    topic: TOPICS.SEND_EMAIL,
    messages: [
      {
        value: JSON.stringify({
          email,
          verificationCode,
        }),
      },
    ],
  });
};
