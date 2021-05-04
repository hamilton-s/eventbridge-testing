"use strict";

const AWS = require("aws-sdk");

module.exports.handler = async (ctx, _) => {
  const eventBridge = new AWS.EventBridge();
  try {
    await eventBridge
      .putEvents({
        Entries: [
          {
            EventBusName: "event-bridge",
            Source: "custom.service2_event",
            DetailType: "example",
            Detail: ctx.body,
          },
        ],
      })
      .promise();
  } catch (error) {
    console.error(error);
  }
};
