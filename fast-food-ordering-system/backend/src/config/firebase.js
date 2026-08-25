/**
 * Optional Firebase Admin setup - alternative to MongoDB for order data that
 * needs out-of-the-box real-time listeners (Firestore) instead of the
 * socket.io broadcast layer in src/sockets/index.js. Not wired in by
 * default; initialize this from server.js only if FIREBASE_PROJECT_ID is set.
 */
let admin;

function getFirebaseApp() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  admin = admin || require('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }

  return admin.app();
}

module.exports = { getFirebaseApp };
