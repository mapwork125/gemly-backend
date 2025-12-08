import * as admin from "firebase-admin";

var serviceAccount = require("../../gemly-2f680-firebase-adminsdk-fbsvc-f8c496e88f.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const sendPush = async (userTokens: string[], payload: any) => {
  try {
    //@ts-ignore
    const response = await admin.messaging().sendToDevice(userTokens, payload);
    console.log("Successfully sent message:", response);
    return true;
  } catch (error) {
    console.log("Error sending message:", error);
    return false;
  }
};
