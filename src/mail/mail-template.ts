import { GROUP_IDS, MAIL_EVENTS, TOPICS } from '../v1/common/constants/topics.js';
import { kafka } from '../plugins/kafka.js';
import { transporter } from '../plugins/mailer.js';
import { verificationCodeMessage } from './mail.messages.schema.js';
import { generateVerificationEmail } from './verification-code.template.js';

const consumer = kafka.consumer({ groupId: GROUP_IDS, sessionTimeout: 10000 });

async function handleMailTopic(messageValue: string) {
  const parsedMessage = JSON.parse(messageValue);

  if (parsedMessage.eventType === MAIL_EVENTS.SEND_VERIFICATION_CODE) {
    const message = verificationCodeMessage.parse(parsedMessage);
    const html = generateVerificationEmail(message.code);
    await transporter.sendMail({
      from: `"PingPong Game" <${process.env.GMAIL_USER}>`,
      to: message.email,
      subject: '이메일 인증 코드',
      html,
    });
  }
}

export async function startMailConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.MAIL, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return console.warn(`Null message received on topic ${topic}`);
      }

      if (topic === TOPICS.MAIL) {
        await handleMailTopic(message.value.toString());
      }
    },
  });
}
