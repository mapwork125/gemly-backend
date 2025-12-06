import * as admin from "firebase-admin";

var serviceAccount = require("../../dimond-platform-firebase-adminsdk-fbsvc-21f1aef4b8.json");

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
