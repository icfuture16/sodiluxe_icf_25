'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { accessCodeService } from '@/lib/appwrite/access-code'
import { useToast } from '@/components/ui/use-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'

type DeveloperAccessModalProps = {
  onClose: () => void
  onVerified: () => void
}

export default function DeveloperAccessModal({ onClose, onVerified }: DeveloperAccessModalProps) {
  const [accessCode, setAccessCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const verifyAccessCode = async () => {
    if (!accessCode.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un code d\'accès',
        variant: 'destructive',
      })
      return
    }

    setIsVerifying(true)

    try {
      // Utilise la méthode spécifique pour les codes développeur
      const isValid = await accessCodeService.verifyDeveloperAccessCode(accessCode.trim())
      
      if (isValid) {
        // Stocker la validation dans localStorage
        localStorage.setItem('developerAccessVerified', 'true')
        toast({
          title: 'Accès autorisé',
          description: 'Bienvenue dans la zone Paramètres Système',
        })
        onVerified()
      } else {
        toast({
          title: 'Accès refusé',
          description: 'Code d\'accès développeur invalide. Format attendu: "code code"',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de vérifier le code d\'accès',
        variant: 'destructive',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyAccessCode()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-secondary">Accès Développeur Requis</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <p className="mb-4 text-gray-600">
          Cette section est réservée aux développeurs. Veuillez saisir le code d'accès développeur.
        </p>
        
        <div className="mb-4">
          <label htmlFor="accessCode" className="block text-sm font-medium text-secondary mb-1">
            Code Développeur
          </label>
          <input
            ref={inputRef}
            id="accessCode"
            type="text"
            placeholder="code développeur"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isVerifying}
          />
          <p className="text-xs text-gray-500 mt-1">
            Cette section nécessite des droits d'accès beaucoup plus élevés que l'administrateur standard.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={verifyAccessCode}
            disabled={isVerifying}
            className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Vérification...' : 'Vérifier'}
          </button>
        </div>
      </div>
    </div>
  )
}
