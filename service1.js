"use strict";

const AWS = require("aws-sdk");

module.exports.handler = async (ctx, event) => {
  console.log("--- SERVICE 1 HANDLER ---");
  console.log("SEND EVENT TO EVENTBRIDGE");
  const eventBridge = new AWS.EventBridge();
  await eventBridge
    .putEvents({
      Entries: [
        {
          EventBusName: "event-bridge",
          Source: "custom.service2_event",
          DetailType: "example",
          Detail: '{"a": "b"}',
        },
      ],
    })
    .promise();
  console.log("EVENT SENT TO EVENTBRIDGE");
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Service 1 Success",
        input: event,
      },
      null,
      2
    ),
  };
};
