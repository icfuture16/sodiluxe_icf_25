import { databases, DATABASE_ID, COLLECTIONS, Query } from './client'

export class AccessCodeService {
  // Vérifier si un code d'accès est valide
  async verifyAccessCode(code: string, type?: string): Promise<boolean> {
    try {
      console.log('Vérification du code:', code);
      
      // Préparer la requête simple - rechercher uniquement le code exact
      // IMPORTANT: La collection n'a pas de champ 'type', donc on ne filtre que sur 'code'
      const queries = [Query.equal('code', code.trim())];
      
      // Pour débogage, essayons aussi de récupérer le document spécifique
      try {
        const specificDocument = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.ACCESS_CODES,
          '6859b5c721017f45f926'
        );
        console.log('Document spécifique trouvé:', specificDocument.code);
        
        // Vérification directe avec le document spécifique
        if (specificDocument.code === code.trim()) {
          console.log('Correspondance directe avec le document spécifique!');
          return true;
        }
      } catch (specificError) {
        console.log('Impossible de récupérer le document spécifique:', specificError);
      }
      
      // Exécuter la requête pour vérifier le code saisi
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ACCESS_CODES,
        queries
      );

      const isValid = response.documents.length > 0;
      console.log('Résultat de la recherche:', isValid ? 'Code valide' : 'Code invalide');
      
      // Si au moins un document correspond, le code est valide
      return isValid;
    } catch (error) {
      console.error('Error verifying access code:', error);
      return false;
    }
  }
  
  // Vérifier spécifiquement un code d'accès administrateur
  // Comme nous n'avons pas de champ 'type' dans la collection, on vérifie juste le code
  async verifyAdminAccessCode(code: string): Promise<boolean> {
    console.log('Vérification du code administrateur:', code);
    // On n'utilise plus le paramètre 'admin' puisqu'il n'y a pas de champ type
    return this.verifyAccessCode(code);
  }

  // Vérifier spécifiquement un code d'accès développeur (nécessite deux fois le même code séparé par un espace)
  async verifyDeveloperAccessCode(codeInput: string): Promise<boolean> {
    console.log('Vérification du code développeur');
    
    // Format attendu: "code code" (deux fois le même code séparé par un espace)
    const codeParts = codeInput.trim().split(' ');
    
    // Vérifier que nous avons exactement deux parties
    if (codeParts.length !== 2) {
      console.log('Format incorrect: le code doit être saisi deux fois séparé par un espace');
      return false;
    }
    
    // Vérifier que les deux parties sont identiques
    if (codeParts[0] !== codeParts[1]) {
      console.log('Les deux codes saisis ne sont pas identiques');
      return false;
    }
    
    // Vérifier que le code est valide dans la base de données
    return this.verifyAccessCode(codeParts[0]);
  }
}

export const accessCodeService = new AccessCodeService()

