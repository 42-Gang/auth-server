import { Kafka } from 'kafkajs';
import * as process from 'node:process';

export const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER] });
export const producer = kafka.producer();

producer.connect();
