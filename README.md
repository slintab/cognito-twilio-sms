# cognito-twilio-sms
Sample implementation for sending MFA OTP messages from AWS Cognito with Twilio SMS.

## Architecture
![Architecture Diagram](./architecture.png?raw=true)

## Setup

The setup of this solution involves configuring a custom SMS sender lambda function for a Cognito User Pool. For a more in-depth walkthrough, please refer to the [AWS documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-sms-sender.html).

1. Create a [Twilio Messaging Service](https://www.twilio.com/docs/messaging/services) and add some phone numbers to its sender pool. The service will be used to send the text messages.
2. Create a lambda function from the files in the `CustomSMSSenderLambda` directory.
3. Create a symmetric KMS key. This will be used by Cognito to encrypt the OTP messages. Make sure to add the lambda execution role as a key user so the function can decrypt the code before sending it to the user.
4. Create a Secret Manager secret for storing the Twilio auth token.
5. Set the following environment variables in the lambda function's configuration:
    - `TWILIO_ACCOUNT_SID` - Twilio accound sid
    - `TWILIO_MESSAGING_SERVICE_SID` - SID of the messaging service from step 1.
    - `SECRET_NAME` - name of the secret containing the Twilio auth token from step 4.
    - `REGION` - region of the secret containing the Twilio auth token (e.g.: us-east-1).
    - `KEY_ARN` - ARN of the KMS key from step 3.
6. Grant Amazon Cognito service principal cognito-idp.amazonaws.com access to invoke the Lambda function:
    ```bash
    aws lambda add-permission --function-name YOUR_LAMBDA_ARN --statement-id "CognitoLambdaInvokeAccess" --action lambda:InvokeFunction --principal cognito-idp.amazonaws.com
    ```
7. Update the user pool and set its custom sender trigger to the lambda function:
    ```bash
    aws cognito-idp update-user-pool --user-pool-id YOUR_USER_POOL_ID --lambda-config "CustomSMSSender={LambdaVersion=V1_0,LambdaArn= YOUR_LAMBDA_ARN },KMSKeyID= YOUR_KMS_KEY_ARN"
    ```

## Demo
![Demo screenshot](./demo.jpg?raw=true)


## Maintainer
Thanks for reading this far!
If you have any questions, do not hesitate to reach out at `hello@slintab.dev`
