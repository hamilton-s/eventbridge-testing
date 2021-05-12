"use strict";
const AWS = require("aws-sdk");
const fs = require("fs");

module.exports.handler = async (ctx, _) => {
  const s3 = new AWS.S3();
  const filename = "src/index.pdf";
  const fileContent = fs.readFileSync(filename);

  const params = {
    Bucket: "example-dev-thumbnails-bucket",
    Key: ctx.detail.filename,
    Body: fileContent,
    ContentType: "application/pdf",
  };

  try {
    await s3.putObject(params).promise();
  } catch (error) {
    console.error(error);
  }
};
