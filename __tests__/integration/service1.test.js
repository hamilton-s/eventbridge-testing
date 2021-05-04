const AWS = require("aws-sdk");
require("dotenv").config();
import { sleep, filename, profile, profileArg } from "./utils";

let region = "eu-west-2";

let creds;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  creds = new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  });
} else {
  creds = new AWS.SharedIniFileCredentials({
    profile,
    callback: (err) => {
      if (err) {
      }
    },
  });
}

AWS.config.credentials = creds;
AWS.config.region = region;

jest.setTimeout(50000); // eventual consistency can take time

const SQS_QUEUE = process.env.SQS_QUEUE_ENDPOINT;
const lambda = new AWS.Lambda();
const sqs = new AWS.SQS();
const eventBridge = new AWS.EventBridge();
const s3 = new AWS.S3();

// Extend jest with EventBridge specific assertions
expect.extend({
  toHaveSentEventBridgeMessage(sqsResult) {
    if (sqsResult.Messages) {
      return {
        message: () => `expected to have message in EventBridge Bus`,
        pass: true,
      };
    } else {
      return {
        message: () => `no message intercepted from EventBridge Bus`,
        pass: false,
      };
    }
  },
  toHaveSentEventWithSourceEqualTo(sqsResult, expectedSourceName) {
    const receivedSource = JSON.parse(sqsResult.Messages[0].Body).source;
    if (receivedSource == expectedSourceName) {
      return {
        message: () =>
          `expected sent event to have source ${expectedSourceName}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `sent event source "${receivedSource}" does not match expected source "${expectedSourceName}"`,
        pass: false,
      };
    }
  },
});

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
    expect(sqs_messages).toHaveSentEventWithSourceEqualTo(
      "custom.service2_event"
    );
  });

  it("service 2 writes the correct data to S3 when correct event pushed to EventBridge", async () => {
    // inject event onto the event bus
    await eventBridge
      .putEvents({
        Entries: [
          {
            EventBusName: "event-bridge",
            Source: "custom.service2_event",
            DetailType: "example",
            Detail: JSON.stringify({ filename: filename }),
          },
        ],
      })
      .promise();

    await sleep(5000); // wait 5 seconds to allow event to pass

    const params = {
      Bucket: "example-dev-thumbnail-bucket",
      Key: filename,
    };

    // Assert that file was added to the S3 bucket
    const obj = await s3.getObject(params).promise();
    expect(obj.ContentType).toBe("application/octet-stream");
  });
});
