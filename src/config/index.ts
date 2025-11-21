export default {
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  stripeSecretKey:
    process.env.STRIPE_SECRET_KEY ||
    "sk_test_51S4xycRu60IIx9FpfqUxDMExpb8VkyD1MKd9IWdujClxzt3RS4TuZ0pmcdngaZM6g3rAoSMLUOw8sNY9hYHYLRcU00rBdCM7Fk",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || "",
};
