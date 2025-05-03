import { producer } from '../../plugins/kafka.js';
import { AUTH_EVENTS, TOPICS } from '../common/constants/topics.js';

export const produceLogoutEvent = async (userId: number) => {
    await producer.send({
      topic: TOPICS.AUTH,
      messages: [
        {
          key: String(userId),
          value: JSON.stringify({
            eventType: AUTH_EVENTS.LOGOUT,
            userId,
            timestamp: Date.now(),
          }),
        },
      ],
    });
  };
  