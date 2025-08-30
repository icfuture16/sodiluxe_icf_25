'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { PlusIcon } from '@heroicons/react/20/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useProducts } from '@/hooks/useProducts'
import { Product } from '@/types/appwrite.types'

interface ProductSelectorProps {
  onProductsChange: (products: Array<{ product: Product; quantity: number }>) => void
  selectedProducts: Array<{ product: Product; quantity: number }>
}

export default function ProductSelector({ onProductsChange, selectedProducts }: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelectedProducts, setTempSelectedProducts] = useState<
    Array<{ product: Product; quantity: number }>
  >(selectedProducts)

  // Récupérer les produits depuis Appwrite
  const { data: products = [], isLoading } = useProducts(searchQuery)

  // Filtrer les produits en fonction de la recherche
  const filteredProducts = products
  
  // Fonction pour mettre à jour la quantité d'un produit
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setTempSelectedProducts(
      tempSelectedProducts.map((item) =>
        item.product.$id === productId ? { ...item, quantity: newQuantity } : item
      )
    )
    
    // Mettre à jour directement les produits sélectionnés
    onProductsChange(
      tempSelectedProducts.map((item) =>
        item.product.$id === productId ? { ...item, quantity: newQuantity } : item
      )
    )
  }



  const handleAddProduct = (product: Product) => {
    const existingProduct = tempSelectedProducts.find((p) => p.product.$id === product.$id)
    if (!existingProduct) {
      setTempSelectedProducts([...tempSelectedProducts, { product, quantity: 1 }])
    }
  }

  const handleRemoveFromTemp = (productId: string) => {
    setTempSelectedProducts(tempSelectedProducts.filter((p) => p.product.$id !== productId))
  }

  const isProductSelected = (productId: string) => {
    return tempSelectedProducts.some((p) => p.product.$id === productId)
  }

  const handleRemoveProduct = (productId: string) => {
    setTempSelectedProducts(tempSelectedProducts.filter((p) => p.product.$id !== productId))
  }

  const handleSave = () => {
    onProductsChange(tempSelectedProducts)
    setIsOpen(false)
  }

  return (
    <>
      <div className="mt-2 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Produit
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Quantité
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Prix unitaire
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Total
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedProducts.map(({ product, quantity }) => (
                  <tr key={product.$id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {product.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex items-center justify-end">
                        <button 
                          className="px-2 py-1 bg-gray-200 rounded-l-md hover:bg-gray-300"
                          onClick={() => handleQuantityChange(product.$id, quantity - 1)}
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          min="1"
                          value={quantity} 
                          onChange={(e) => handleQuantityChange(product.$id, parseInt(e.target.value) || 1)}
                          className="w-12 text-center border-t border-b border-gray-300 py-1"
                        />
                        <button 
                          className="px-2 py-1 bg-gray-200 rounded-r-md hover:bg-gray-300"
                          onClick={() => handleQuantityChange(product.$id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(product.price)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(product.price * quantity)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.$id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                        title="Supprimer"
                      >
                        <XMarkIcon className="h-5 w-5 stroke-2" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        Ajouter un produit
      </button>

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 sm:mt-5">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Sélectionner des produits
                      </Dialog.Title>
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Rechercher un produit..."
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="mt-4 max-h-96 overflow-y-auto">
                        <ul role="list" className="divide-y divide-gray-100">
                          {isLoading ? (
                            <li className="py-5 text-center text-sm text-gray-500">Chargement des produits...</li>
                          ) : filteredProducts.length === 0 ? (
                            <li className="py-5 text-center text-sm text-gray-500">Aucun produit trouvé</li>
                          ) : (
                            filteredProducts.map((product) => {
                              const isSelected = isProductSelected(product.$id)
                              return (
                                <li 
                                  key={product.$id} 
                                  className={`flex items-center justify-between gap-x-6 py-5 rounded-lg transition-colors ${
                                    isSelected 
                                      ? 'bg-indigo-50 border-2 border-indigo-200' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-start gap-x-3">
                                      <p className={`text-sm font-semibold leading-6 ${
                                        isSelected ? 'text-indigo-900' : 'text-gray-900'
                                      }`}>
                                        {product.name}
                                      </p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                      <p className="truncate">{product.category}</p>
                                      <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                        <circle cx={1} cy={1} r={1} />
                                      </svg>
                                      <p>
                                        {new Intl.NumberFormat('fr-FR', {
                                          style: 'currency',
                                          currency: 'XOF',
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                        }).format(product.price)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => isSelected ? handleRemoveFromTemp(product.$id) : handleAddProduct(product)}
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset transition-colors ${
                                      isSelected
                                        ? 'bg-red-50 text-red-700 ring-red-300 hover:bg-red-100'
                                        : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {isSelected ? 'Retirer' : 'Ajouter'}
                                  </button>
                                </li>
                              )
                            })
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                      onClick={handleSave}
                    >
                      Valider {tempSelectedProducts.length > 0 && `(${tempSelectedProducts.length})`}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                      onClick={() => setIsOpen(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
