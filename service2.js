"use strict";
const AWS = require("aws-sdk");
const fs = require("fs");

module.exports.handler = async (ctx, event) => {
  const s3 = new AWS.S3();
  const filename = "./index.html";
  const fileContent = fs.readFileSync(filename);

  const params = {
    Bucket: "sarah-dev-thumbnail-bucket",
    Key: ctx.detail.filename, // File name you want to save as in S3 lol
    Body: fileContent,
  };

  const result = await s3.putObject(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Service 2 Success",
        input: event,
      },
      null,
      2
    ),
  };
};
