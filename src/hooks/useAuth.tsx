'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, signOut,
  sendPasswordResetEmail, updatePassword, sendEmailVerification,
  reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { UserProfile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (email: string, password: string, displayName: string) => Promise<void>
  signInGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Student',
      email: user.email,
      photoURL: user.photoURL || null,
      total_points: 0,
      solved_challenges: [],
      first_bloods: 0,
      hints_used: 0,
      hints_penalty_total: 0,
      first_solve_time: null,
      language_pref: 'th',
      role: 'student',
      created_at: serverTimestamp(),
    })
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await ensureUserProfile(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        setProfile(snap.data() as UserProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signInEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpEmail = async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await sendEmailVerification(user)
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid, displayName, email: user.email, photoURL: null,
      total_points: 0, solved_challenges: [], first_bloods: 0,
      hints_used: 0, hints_penalty_total: 0, first_solve_time: null,
      language_pref: 'th', role: 'student', created_at: serverTimestamp(),
    })
  }

  const signInGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    await ensureUserProfile(result.user)
  }

  const logout = async () => { await signOut(auth) }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error('Not authenticated')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInEmail, signUpEmail, signInGoogle, logout, resetPassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
