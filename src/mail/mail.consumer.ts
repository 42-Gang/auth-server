import { GROUP_IDS, TOPICS } from '../v1/common/constants/topics.js';
import { kafka } from '../plugins/kafka.js';
import { transporter } from '../plugins/mailer.js';

const consumer = kafka.consumer({ groupId: GROUP_IDS, sessionTimeout: 10000 });

export async function startMailConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.SEND_EMAIL, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return console.warn(`Null message received on topic ${topic}`);
      }

      console.log(message.value.toString());
      try {
        await transporter.sendMail({
          from: `"PingPong Game" <${process.env.GMAIL_USER}>`,
          to: 'to',
          subject: 'subject',
          text: 'text',
          html: 'html',
        });
      } catch (error) {
        console.error(`Error sending email: ${error}`);
      }
    },
  });
}
