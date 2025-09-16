import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/appwrite/server'
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config'
import { Query } from 'node-appwrite'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const { databases } = createServerClient()

    let queries = []
    
    // Si un rôle est spécifié, filtrer par rôle
    if (role) {
      queries.push(Query.equal('role', role))
    }

    // Récupérer les utilisateurs
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      queries
    )

    // Transformer les données pour l'interface
    const users = response.documents.map(doc => ({
      id: doc.$id,
      firstName: doc.firstName || doc.fullName?.split(' ')[0] || '',
      lastName: doc.lastName || doc.fullName?.split(' ').slice(1).join(' ') || '',
      email: doc.email,
      role: doc.role,
      authId: doc.authId,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt
    }))

    return NextResponse.json(
      { users, total: response.total },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

