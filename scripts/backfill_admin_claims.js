const fs = require('fs');
const admin = require('firebase-admin');

// Load environment variables (basic parsing for .env)
const env = fs.readFileSync('.env', 'utf8');
const b64Match = env.match(/GOOGLE_APPLICATION_CREDENTIALS_B64=(.*)/);
if (!b64Match) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS_B64 not found in .env");
  process.exit(1);
}

const b64 = b64Match[1].trim();
const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const auth = admin.auth();

async function backfill() {
  console.log("Starting backfill of admin claims...");
  try {
    const snapshot = await firestore.collection('users').where('role', '==', 'admin').get();
    console.log(`Found ${snapshot.size} admin users in Firestore.`);
    
    for (const doc of snapshot.docs) {
      const uid = doc.id;
      const data = doc.data();
      
      try {
        await auth.setCustomUserClaims(uid, { role: 'admin' });
        console.log(`Successfully set admin claim for user ${uid} (${data.email})`);
      } catch (err) {
        console.error(`Failed to set claim for user ${uid}:`, err.message);
      }
    }
    console.log("Backfill complete.");
  } catch (err) {
    console.error("Error during backfill:", err);
  }
}

backfill();
