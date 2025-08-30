import { Client, Users, Databases } from 'node-appwrite'

// Configuration Appwrite côté serveur avec clé API
export function createServerClient() {
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
    throw new Error('Missing NEXT_PUBLIC_APPWRITE_ENDPOINT')
  }

  if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    throw new Error('Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID')
  }

  if (!process.env.APPWRITE_API_KEY) {
    throw new Error('Missing APPWRITE_API_KEY for server operations')
  }

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY!)

  return {
    client,
    databases: new Databases(client),
    users: new Users(client)
  }
}

// Instance Users pour les opérations côté serveur
export function getServerUsers() {
  const { users } = createServerClient()
  return users
}

// Fonction utilitaire pour récupérer un utilisateur côté serveur
export async function getUserById(userId: string) {
  try {
    const users = getServerUsers()
    return await users.get(userId)
  } catch (error) {
    console.error(`[SERVER] Erreur lors de la récupération de l'utilisateur ${userId}:`, error)
    throw error
  }
}