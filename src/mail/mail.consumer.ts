import { GROUP_IDS, TOPICS } from '../v1/common/constants/topics.js';
import { kafka } from '../plugins/kafka.js';

const consumer = kafka.consumer({ groupId: GROUP_IDS, sessionTimeout: 10000 });

export async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.SEND_EMAIL, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return console.warn(`Null message received on topic ${topic}`);
      }
    },
  });
}
