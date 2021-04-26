const AWS = require("aws-sdk");
require("dotenv").config();

const profileArg = process.argv.filter((x) => x.startsWith("--profile="))[0];
const profile = profileArg ? profileArg.split("=")[1] : "default";
const regionArg = process.argv.filter((x) => x.startsWith("--region="))[0];
let region = "eu-west-2";
if (regionArg) {
  region = regionArg.split("=")[1];
}

const SQS_QUEUE = process.env.SQS_QUEUE_ENDPOINT;

jest.setTimeout(50000); // eventual consistency can taken time...

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

const lambda = new AWS.Lambda();
const sqs = new AWS.SQS();

/*
 * Extend jest with EventBridge specific assertions
 */
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

beforeAll(() => {
  // const sqsQueue = await sqs.createQueue();
  // const queueUrl = AWS.getQueueUrl(sqsQueue);
  // todo
  // createQueue() https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#createQueue-property
  // putRule() https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EventBridge.html#putRule-property
  // set queue URL
});

afterAll(() => {
  // const queueUrl = AWS.getQueueUrl(sqsQueue);
  // await sqs.purgeQueue(queueUrl);
  // todo
  // purgeQueue() https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#purgeQueue-property
  // record Queue URL...
});

describe("Integration Testing: Service 1", () => {
  it("service 1 emits an event to the correct EventBus when triggered", async () => {
    const event = {
      body: JSON.stringify({
        id: "123",
      }),
    };

    // INVOKE
    const params = {
      FunctionName: "eventbridge-example-dev-service1",
      Payload: JSON.stringify(event),
    };
    await lambda.invoke(params).promise();

    // ASSERT
    const queueParams = {
      QueueUrl: SQS_QUEUE,
      WaitTimeSeconds: 5,
    };
    const sqs_messages = await sqs.receiveMessage(queueParams).promise();
    expect(sqs_messages).toHaveSentEventBridgeMessage();
    expect(sqs_messages).toHaveSentEventWithSourceEqualTo(
      "custom.service2_event"
    );

    // CLEAN
    const deleteParams = {
      QueueUrl: SQS_QUEUE,
      ReceiptHandle: sqs_messages.Messages[0].ReceiptHandle,
    };
    await sqs.deleteMessage(deleteParams).promise();
  });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // it("service 2 writes the correct data to S3 when correct event pushed to EventBridge", async () => {
  //   await eventBridge
  //     .putEvents({
  //       Entries: [
  //         {
  //           EventBusName: "application-bridge-example",
  //           Source: "custom.service2_event",
  //           DetailType: "example",
  //           Detail: '{"a": "b"}', // change this to be s3 compatible
  //         },
  //       ],
  //     })
  //     .promise();
  //   await sleep(10000); // wait 10 seconds to allow event to pass (could be substituted for retries on getting the object)
  //   const params = {
  //     Bucket: bucketName,
  //     Key: `${cpak}-${pak}/event.html`,
  //   };
  //   const obj = await s3.getObject(params).promise();
  //   expect(obj.ContentType).toBe("text/html; charset=utf-8");
  // });
  // it.skip("e2e - service 2 writes correct value to DDB when service 1 triggered", async () => {
  //   // todo
  // });
});

/*
To Dos:
- Construct SQS Queue
- Add new rule for all sources to go the SQS queue
- Poll the queue to make the assertion
- Write to DDB or S3 in Service2 function to allow E2E assertion.
*/
