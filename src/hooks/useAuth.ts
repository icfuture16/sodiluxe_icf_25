import { useEffect, useState } from 'react'
import { authService } from '@/lib/appwrite/auth'
import { AuthUser, User } from '@/types/appwrite.types'

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('useAuth: Hook initialisé, vérification de l\'authentification...')
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('useAuth: Début de la vérification de l\'authentification...')
      const currentUser = await authService.getCurrentUser()
      console.log('useAuth: Utilisateur actuel récupéré:', currentUser)
      setUser(currentUser)
      
      if (currentUser) {
        console.log(`useAuth: Utilisateur authentifié avec ID: ${currentUser.$id}`)
        console.log('useAuth: Tentative de récupération du profil utilisateur...')
        
        try {
          const profile = await authService.getUserProfile(currentUser.$id)
          console.log('useAuth: Profil utilisateur récupéré:', profile)
          
          if (!profile) {
            console.warn(`useAuth: ATTENTION - Profil utilisateur non trouvé pour l'ID: ${currentUser.$id}`)
            console.warn('useAuth: Vérifiez que l\'utilisateur existe dans la collection "users" d\'Appwrite')
          } else {
            console.log(`useAuth: Profil utilisateur trouvé avec rôle: ${profile.role}`)
          }
          
          setUserProfile(profile)
        } catch (profileError) {
          console.error('useAuth: Erreur lors de la récupération du profil:', profileError)
          setUserProfile(null)
        }
      } else {
        console.log('useAuth: Aucun utilisateur connecté')
        setUserProfile(null)
      }
    } catch (error) {
      console.error('useAuth: Erreur lors de la vérification de l\'authentification:', error)
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoading(false)
      console.log('useAuth: État final -', { 
        isAuthenticated: !!user, 
        hasProfile: !!userProfile, 
        loading: false 
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('useAuth: Tentative de connexion avec:', email)
      const session = await authService.signIn(email, password)
      console.log('useAuth: Session créée avec succès:', session)
      
      console.log('useAuth: Actualisation des informations utilisateur après connexion...')
      await checkAuth()
      
      console.log('useAuth: Connexion et récupération du profil terminées')
      return true
    } catch (error) {
      console.error('useAuth: Erreur de connexion:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('useAuth: Tentative de déconnexion')
      await authService.signOut()
      setUser(null)
      setUserProfile(null)
      console.log('useAuth: Déconnexion réussie, état utilisateur réinitialisé')
    } catch (error) {
      console.error('useAuth: Erreur de déconnexion:', error)
      throw error
    }
  }

  return {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    checkAuth
  }
}