const AWS = require("aws-sdk");
require("dotenv").config();
import { sleep, filename, profile, profileArg } from "./utils";

import {lambda, sqs, eventBridge, s3} from 'sls-test-tools'


jest.setTimeout(50000); // eventual consistency can take time

const SQS_QUEUE = process.env.SQS_QUEUE_ENDPOINT;

describe("Integration Testing Event Bridge", () => {
  afterAll(async () => {
    const purgeParams = {
      QueueUrl: SQS_QUEUE,
    };
    await sqs.purgeQueue(purgeParams).promise();
  });

  it("service 1 emits an event to the correct EventBus when triggered", async () => {
    const event = {
      body: JSON.stringify({
        filename: filename,
      }),
    };

    // Invoke Lambda Function
    const params = {
      FunctionName: "eventbridge-example-dev-service1",
      Payload: JSON.stringify(event),
    };
    await lambda.invoke(params).promise();

    // Long poll SQS queue
    const queueParams = {
      QueueUrl: SQS_QUEUE,
      WaitTimeSeconds: 5,
    };
    const sqs_messages = await sqs.receiveMessage(queueParams).promise();
    expect(sqs_messages).toHaveSentEventBridgeMessage();
    expect(sqs_messages).toHaveSentEventWithSourceEqualTo("order.created");
  });

  it("service 2 writes the correct data to S3 when correct event pushed to EventBridge", async () => {
    // inject event onto the event bus
    await eventBridge
      .putEvents({
        Entries: [
          {
            EventBusName: "event-bridge",
            Source: "order.created",
            DetailType: "example",
            Detail: JSON.stringify({ filename: filename }),
          },
        ],
      })
      .promise();

    await sleep(5000); // wait 5 seconds to allow event to pass

    const params = {
      Bucket: "example-dev-thumbnails-bucket",
      Key: filename,
    };

    // Assert that file was added to the S3 bucket
    const obj = await s3.getObject(params).promise();
    expect(obj.ContentType).toBe("application/pdf");
  });
});
