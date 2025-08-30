'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { parfumsData, ParfumData } from '@/data/parfums'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Check, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Product } from '@/types/appwrite.types'

interface PerfumeImportProps {
  onSelectPerfume: (perfume: Partial<Product>) => void
}

export default function PerfumeImport({ onSelectPerfume }: PerfumeImportProps) {
  const [open, setOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  
  const handleSelectPerfume = (perfume: ParfumData, index: number) => {
    // Convertir les données du parfum au format de produit
    const productData: Partial<Product> = {
      name: perfume.description,
      reference: `PARFUM-${perfume.marque.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      description: `${perfume.marque} - ${perfume.description}`,
      price: perfume.prix / 100, // Convertir en format décimal (ex: 95000 -> 950.00)
      category: 'PARFUMERIE',
      subcategory: perfume.famille,

      stockQuantity: perfume.quantite,
      lowStockThreshold: 2,
      status: 'active'
    }
    
    setSelectedRow(index)
    
    // Envoyer les données au parent après un court délai pour montrer la sélection
    setTimeout(() => {
      setOpen(false)
      onSelectPerfume(productData)
    }, 500)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-6">
          <Download className="mr-2 h-4 w-4" />
          Importer un parfum
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Importer un parfum</DialogTitle>
          <DialogDescription>
            Sélectionnez un parfum dans la liste pour l'ajouter au catalogue.
            Les informations seront pré-remplies dans le formulaire.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marque</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parfumsData.map((parfum, index) => (
                <TableRow 
                  key={index} 
                  className={selectedRow === index ? "bg-primary/20" : undefined}
                >
                  <TableCell>
                    <div className="font-medium">{parfum.marque}</div>
                    <Badge variant="outline" className="mt-1">{parfum.famille}</Badge>
                  </TableCell>
                  <TableCell>{parfum.description}</TableCell>
                  <TableCell>{(parfum.prix / 100).toFixed(2)} €</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant={selectedRow === index ? "default" : "outline"}
                      onClick={() => handleSelectPerfume(parfum, index)}
                    >
                      {selectedRow === index ? (
                        <>
                          <Check className="mr-1 h-3 w-3" /> Sélectionné
                        </>
                      ) : "Sélectionner"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
