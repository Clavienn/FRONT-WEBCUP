"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { resetAgentApproval } from "@/lib/agent-approval"
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
  signIn: (credentials: Credentials, headers?: Record<string, string>) => Promise<AuthUser>
  signUp: (data: RegistrationData, headers?: Record<string, string>) => Promise<AuthUser>
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
  deleteAccount: (password: string) => Promise<void>
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

  const signIn = async (credentials: Credentials, headers?: Record<string, string>) => {
    const sessionUser = await authRepository.login(credentials, headers)
    setUser(sessionUser)
    return sessionUser
  }

  const signUp = async (data: RegistrationData, headers?: Record<string, string>) => {
    const sessionUser = await authRepository.register(data, headers)
    setUser(sessionUser)
    return sessionUser
  }

  // Le statut de validation est mémorisé par compte pour la durée de la session : il doit tomber
  // avec la session, sinon l'agent qui se connecte ensuite hériterait du statut du précédent.
  const signOut = async () => {
    try {
      await authRepository.logout()
    } finally {
      resetAgentApproval()
      setUser(null)
    }
  }

  const signOutEverywhere = async () => {
    try {
      await authRepository.logoutAll()
    } finally {
      resetAgentApproval()
      setUser(null)
    }
  }

  // La session locale ne tombe qu'en cas de succès : sur un mot de passe erroné, l'API
  // renvoie 401 et le compte existe toujours. Vider l'utilisateur dans un finally
  // déconnectait de l'interface et faisait disparaître le message d'erreur.
  const deleteAccount = async (password: string) => {
    await authRepository.deleteAccount(password)
    resetAgentApproval()
    setUser(null)
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
        deleteAccount,
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