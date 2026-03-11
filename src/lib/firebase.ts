import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const isNew = getApps().length === 0
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)

// Use experimentalAutoDetectLongPolling to avoid WebSocket watch stream
// internal assertion failures when multiple rapid writes occur alongside onSnapshot
export const db = isNew
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
  : getFirestore(app)

export const googleProvider = new GoogleAuthProvider()
export default app
