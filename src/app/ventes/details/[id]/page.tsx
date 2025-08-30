import SaleDetailsClient from '@/components/sales/SaleDetailsClient'

// Cette fonction est nécessaire pour la génération statique avec Next.js
export function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

// Page pour les détails de vente avec ID dynamique
export default async function SaleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <div className="container mx-auto px-4 py-8">
      <SaleDetailsClient id={id} />
    </div>
  )
}
