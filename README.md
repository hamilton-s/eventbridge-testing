<div align="center">
  <h1>Amazon EventBridge Integration Testing Strategy</h1>

๐งช An EventBridge integration test example using the Serverless Framework ๐ป

</div>

<hr />

Code example to complement [Bridge Integrity โ Integration Testing Strategy for EventBridge Based Serverless Architectures](https://medium.com/serverless-transformation/bridge-integrity-integration-testing-strategy-for-eventbridge-based-serverless-architectures-b73529397251)

## Allowing the tests to the run locally against your IAM User

In the root:

run `./mfa.sh <AWS_PROFILE> <SERIAL_NUMBER> <TOKEN_CODE>`

`<AWS_PROFILE>` user-profile name, like user-serverless
`<SERIAL_NUMBER>` e.g. arn:aws:iam::12345:mfa/severless
`<TOKEN_CODE>` mfa code from the authenticating device

You will need to run this every 15 minutes as the token will expire

## Deploy the code

run `yarn unlink sls-test-tools`
run `yarn sls deploy --aws-profile mfa`

## Run the integration tests

run `yarn link sls-test-tools`
run `yarn test '--profile=mfa' '--stack=<STACK_NAME>' --runInBand '--keep=true'`

`<STACK_NAME>` stack name, like eventbridge-example-dev
