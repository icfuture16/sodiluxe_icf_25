import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/appwrite/server'
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config'
import { Query } from 'node-appwrite'

// Mot de passe développeur (dans un vrai projet, ceci devrait être dans les variables d'environnement)
const DEVELOPER_PASSWORD = process.env.DEVELOPER_PASSWORD || 'dev123!'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { developerPassword, isDeveloperAction } = body

    // Vérifier si c'est une action développeur
    if (isDeveloperAction) {
      // Valider le mot de passe développeur
      if (!developerPassword || developerPassword !== DEVELOPER_PASSWORD) {
        return NextResponse.json(
          { message: 'Mot de passe développeur incorrect' },
          { status: 401 }
        )
      }
    }

    const { databases, users } = createServerClient()

    // Récupérer l'utilisateur à supprimer
    const userDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      id
    )

    if (!userDoc) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer de la collection users
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      id
    )

    // Si c'est une action développeur, supprimer aussi de l'authentification Appwrite
    if (isDeveloperAction && userDoc.authId) {
      try {
        await users.delete(userDoc.authId)
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'authentification:', error)
        // Continue même si la suppression de l'auth échoue
      }
    }

    return NextResponse.json(
      { message: 'Utilisateur supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}