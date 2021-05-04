"use strict";
const AWS = require("aws-sdk");
const fs = require("fs");

module.exports.handler = async (ctx, event) => {
  const s3 = new AWS.S3();
  const filename = "./index.html";
  const fileContent = fs.readFileSync(filename);

  const params = {
    Bucket: "example-dev-thumbnail-bucket",
    Key: ctx.detail.filename, // File name you want to save as in S3 lol
    Body: fileContent,
  };

  try {
    await s3.putObject(params).promise();
  } catch (error) {
    console.error(error);
  }
};
