'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser } from '@/types/appwrite.types'
import { AuthService } from '@/lib/appwrite/auth'

interface AuthContextType {
  user: AuthUser | null
  isAdmin: boolean | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  createUserProfile: (userId: string, email: string, name: string) => Promise<any>
  checkUserProfile: (userId: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authService = new AuthService()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  // Vérifier l'utilisateur au chargement
  useEffect(() => {
    checkUser()
  }, [])

  const checkAdminStatus = async (userId: string) => {
    try {
      const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite/client');
      
      // Récupérer le profil utilisateur depuis la collection users
      const userProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
      
      // Vérifier si l'utilisateur a le rôle admin
      const isUserAdmin = userProfile.role === 'admin';
      setIsAdmin(isUserAdmin);
      
    } catch (error) {
      console.error('Erreur lors de la vérification du statut admin:', error);
      if ((error as { code: number }).code === 404) {
        // Profil utilisateur non trouvé, définition isAdmin = false
      }
      setIsAdmin(false);
    }
  };

  // Fonction pour vérifier l'utilisateur actuel
  const checkUser = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        // Vérifier le statut admin
        await checkAdminStatus(currentUser.$id)
      } else {
        setUser(null)
        setIsAdmin(null)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error)
      setUser(null)
      setIsAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await authService.signIn(email, password)
      await checkUser()
      
      // Vérifier si le profil utilisateur existe après la connexion
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const profile = await checkUserProfile(currentUser.$id)
        if (!profile) {
          console.log('AuthProvider: Profil utilisateur manquant, tentative de création...')
          try {
            await createUserProfile(currentUser.$id, currentUser.email, currentUser.name || 'Utilisateur')
            console.log('AuthProvider: Profil utilisateur créé lors de la connexion')
          } catch (profileError) {
            console.warn('AuthProvider: Impossible de créer le profil lors de la connexion:', profileError)
          }
        }
      }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  // Fonction pour créer le profil utilisateur
  const createUserProfile = async (userId: string, email: string, name: string) => {
    try {
      const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite/client')
      const { generateUserSeller } = await import('@/lib/utils/sellerUtils')
      
      // Générer automatiquement le user_seller basé sur le nom complet (max 15 caractères)
      const userSeller = generateUserSeller(name)
      console.log(`AuthProvider: user_seller généré: '${userSeller}' pour '${name}'`)
      
      const userDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId,
        {
          email: email,
          fullName: name,
          role: 'seller', // Rôle par défaut
          storeId: '', // Pas de magasin par défaut
          user_seller: userSeller // Identifiant vendeur généré automatiquement
        }
      )
      
      console.log('AuthProvider: Profil utilisateur créé avec user_seller:', {
        id: userDoc.$id,
        fullName: userDoc.fullName,
        user_seller: userDoc.user_seller
      })
      return userDoc
    } catch (error) {
      console.error('AuthProvider: Erreur lors de la création du profil:', error)
      throw error
    }
  }

  // Fonction pour vérifier si le profil utilisateur existe
  const checkUserProfile = async (userId: string) => {
    try {
      const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite/client')
      const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId)
      return profile
    } catch (error) {
      if ((error as { code: number }).code === 404) {
        return null // Profil n'existe pas
      }
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      // Créer l'utilisateur dans l'authentification Appwrite
      const newUser = await authService.signUp(email, password, name)
      console.log('AuthProvider: Utilisateur créé dans l\'authentification:', newUser)
      
      // Après inscription, connecter automatiquement
      await signIn(email, password)
      
      // Tenter de créer le profil utilisateur après la connexion
      try {
        await createUserProfile(newUser.$id, email, name)
        console.log('AuthProvider: Profil utilisateur créé automatiquement')
      } catch (profileError) {
        console.warn('AuthProvider: Impossible de créer le profil automatiquement:', profileError)
        console.log('AuthProvider: Le profil devra être créé manuellement ou lors de la première connexion')
      }
      
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
      setUser(null)
      setIsAdmin(false)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    await checkUser()
  }

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    createUserProfile,
    checkUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
