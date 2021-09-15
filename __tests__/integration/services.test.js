const AWS = require("aws-sdk");
import { sleep, filename } from "./utils";

import { AWSClient, EventBridge } from "sls-test-tools";

const lambda = new AWSClient.Lambda();
let eventBridge;

jest.setTimeout(50000); // eventual consistency can take time

describe("Integration Testing Event Bridge", () => {
  beforeAll(async () => {
    eventBridge = await EventBridge.build("event-bridge");
  });

  it("service 1 emits an event to the correct EventBus when triggered", async () => {
    const event = {
      body: JSON.stringify({
        filename: filename,
      }),
    };

    // Invoke Lambda Function
    const params = {
      FunctionName: "event-bridge-example-dev-service1",
      Payload: JSON.stringify(event),
    };
    await lambda.invoke(params).promise();

    const eventBridgeEvents = await eventBridge.getEvents();
    expect(eventBridgeEvents).toHaveEvent();
    expect(eventBridgeEvents).toHaveEventWithSource("order.created");
  });

  it("service 2 writes the correct data to S3 when correct event pushed to EventBridge", async () => {
    // inject event onto the event bus
    await eventBridge.publishEvent(
      "order.created",
      "example",
      JSON.stringify({ filename: filename })
    );

    await sleep(5000); // wait 5 seconds to allow event to pass

    // Assert that file was added to the S3 bucket
    await expect("example-dev-thumbnails-bucket").toExistAsS3Bucket();
    await expect("example-dev-thumbnails-bucket").toHaveS3ObjectWithNameEqualTo(
      filename
    );
    await expect({
      bucketName: "example-dev-thumbnails-bucket",
      objectName: filename,
    }).toHaveContentTypeEqualTo("application/pdf");
  });
});
