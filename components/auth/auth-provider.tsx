"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import {
  AuthApiError,
  authRepository,
  type AuthUser,
  type Credentials,
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

  // Recharge le profil depuis /auth/me ; si l'access token a expiré, on repasse par /auth/refresh
  const reloadUser = useCallback(async () => {
    let sessionUser: AuthUser
    try {
      sessionUser = await authRepository.me()
    } catch (error) {
      if (!(error instanceof AuthApiError) || error.status !== 401) throw error
      sessionUser = await authRepository.refresh()
    }
    setUser(sessionUser)
    return sessionUser
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signUp, signOut, signOutEverywhere, reloadUser }}
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