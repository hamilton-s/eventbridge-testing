'use strict';

module.exports.handler = async (ctx, event) => {
  console.log("--- SERVICE 2 HANDLER ---")
  console.log(JSON.stringify(event))
  console.log(JSON.stringify(ctx))
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Service 2 Success',
        input: event,
      },
      null,
      2
    ),
  };
};
