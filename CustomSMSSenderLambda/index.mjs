import AWS from "aws-sdk";
import b64 from "base64-js";
import encryptionSdk from "@aws-crypto/client-node";
import Twilio from "twilio";

// initiate the encryption SDK client
const { encrypt, decrypt } = encryptionSdk.buildClient(
  encryptionSdk.CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT
);
const keyIds = [process.env.KEY_ARN];
const keyring = new encryptionSdk.KmsKeyringNode({ keyIds });

// retrieve twilio token
const sm = new AWS.SecretsManager({ region: process.env.REGION });
const secret = await sm
  .getSecretValue({ SecretId: process.env.SECRET_NAME })
  .promise();

// initiate the twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = JSON.parse(secret.SecretString)["token"];
const twilioClient = Twilio(accountSid, authToken);

export const handler = async (event) => {
  // parse phone number and code from request
  const recipient = event.request.userAttributes.phone_number;
  const encryptedCode = event.request.code;

  if (!recipient || !encryptedCode) {
    return {
      statusCode: 400,
      body: "Error - invalid request: phone number and OTP code required.",
    };
  }

  //decrypt the otp code
  const code = await decryptCode(encryptedCode);

  // send decrypted code via SMS
  if (
    event.triggerSource == "CustomSMSSender_SignUp" ||
    event.triggerSource == "CustomSMSSender_ResendCode" ||
    event.triggerSource == "CustomSMSSender_Authentication"
  ) {
    const messagingService = process.env.TWILIO_MESSAGING_SERVICE_SID;
    await sendMessage(twilioClient, messagingService, recipient, code);
  }

  return {
    statusCode: 200,
  };
};

async function sendMessage(client, sender, recipient, message) {
  await client.messages.create({ body: message, from: sender, to: recipient });
}

async function decryptCode(code) {
  const { plaintext, messageHeader } = await decrypt(
    keyring,
    b64.toByteArray(code)
  );

  return plaintext;
}
