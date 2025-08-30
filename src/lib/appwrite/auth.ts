import { account, databases, DATABASE_ID, COLLECTIONS } from './client'
import { AuthUser, User } from '@/types/appwrite.types'
import { ID } from 'appwrite'

export class AuthService {
  // Connexion
  async signIn(email: string, password: string) {
    try {
      console.log('AuthService: Tentative de connexion avec', email)
      // Utilisation de la méthode correcte pour la version 16.0.2 d'Appwrite
      // Pour le client web (appwrite 16.0.2), on utilise createEmailPasswordSession
      const session = await account.createEmailPasswordSession(email, password)
      console.log('AuthService: Session créée avec succès', session)
      return session
    } catch (error) {
      console.error('AuthService: Erreur de connexion:', error)
      throw error
    }
  }

  // Inscription
  async signUp(email: string, password: string, name: string) {
    try {
      console.log('AuthService: Tentative d\'inscription pour', email)
      const user = await account.create(ID.unique(), email, password, name)
      console.log('AuthService: Utilisateur créé avec succès', user)
      return user
    } catch (error) {
      console.error('AuthService: Erreur d\'inscription:', error)
      throw error
    }
  }

  // Déconnexion
  async signOut() {
    try {
      console.log('AuthService: Tentative de déconnexion')
      await account.deleteSession('current')
      console.log('AuthService: Déconnexion réussie')
    } catch (error) {
      console.error('AuthService: Erreur de déconnexion:', error)
      throw error
    }
  }

  // Utilisateur actuel
  /**
   * Récupère l'utilisateur actuel Appwrite.
   * Retourne null si aucun utilisateur n'est connecté (ne loggue pas d'erreur en cas de 401).
   * À utiliser avant d'appeler des endpoints protégés.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await account.get()
      return user as AuthUser
    } catch (error: any) {
      // Silencieux si non authentifié (401)
      if (error.code === 401) return null
      return null
    }
  }

  // Profil utilisateur avec données métier
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      // Vérification silencieuse - pas de logs pour éviter de polluer la console
      const user = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId
      )
      return user as User
    } catch (error) {
      // Gestion silencieuse de l'erreur, simplement retourner null sans log d'erreur
      // Cette collection n'existe peut-être pas en production
      return null
    }
  }

  // Vérifier si l'utilisateur est connecté
  /**
   * Vérifie si l'utilisateur est authentifié (Appwrite).
   * Retourne false si aucun utilisateur n'est connecté (ne loggue pas d'erreur en cas de 401).
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await account.get()
      return true
    } catch (error: any) {
      if (error.code === 401) return false
      return false
    }
  }
}

export const authService = new AuthService()