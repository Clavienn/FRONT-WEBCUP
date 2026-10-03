"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import {
  authRepository,
  type AuthUser,
  type Credentials,
  type PasswordChange,
  type ProfileUpdate,
  type RegistrationData,
} from "@/repository/auth.repository"

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  signIn: (credentials: Credentials) => Promise<AuthUser>
  signUp: (data: RegistrationData) => Promise<AuthUser>
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
  reloadUser: () => Promise<AuthUser>
  updateProfile: (data: ProfileUpdate) => Promise<AuthUser>
  changePassword: (data: PasswordChange) => Promise<AuthUser>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    authRepository
      .refresh()
      .then((sessionUser) => {
        if (mounted) setUser(sessionUser)
      })
      .catch(() => {
        authRepository.clearAccessToken()
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const signIn = async (credentials: Credentials) => {
    const sessionUser = await authRepository.login(credentials)
    setUser(sessionUser)
    return sessionUser
  }

  const signUp = async (data: RegistrationData) => {
    const sessionUser = await authRepository.register(data)
    setUser(sessionUser)
    return sessionUser
  }

  const signOut = async () => {
    try {
      await authRepository.logout()
    } finally {
      setUser(null)
    }
  }

  const signOutEverywhere = async () => {
    try {
      await authRepository.logoutAll()
    } finally {
      setUser(null)
    }
  }

  // Recharge le profil depuis /auth/me
  const reloadUser = useCallback(async () => {
    const sessionUser = await authRepository.me()
    setUser(sessionUser)
    return sessionUser
  }, [])

  const updateProfile = async (data: ProfileUpdate) => {
    const sessionUser = await authRepository.updateProfile(data)
    setUser(sessionUser)
    return sessionUser
  }

  const changePassword = async (data: PasswordChange) => {
    const sessionUser = await authRepository.changePassword(data)
    setUser(sessionUser)
    return sessionUser
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        signOutEverywhere,
        reloadUser,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider.")
  return context
}