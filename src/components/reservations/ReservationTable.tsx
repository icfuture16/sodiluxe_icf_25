'use client'

import React, { useState } from 'react'
import { useHydration } from '@/hooks/useHydration'
import { ReservationWithDetails, ReservationItemWithProduct } from '@/hooks/useReservationsWithDetails'

import {
  FiChevronDown,
  FiChevronUp,
  FiShoppingCart,
  FiTrash2,
} from 'react-icons/fi'
import { Reservation } from '@/types/reservation.types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/formatters'

interface ReservationTableProps {
  reservations: ReservationWithDetails[]
  onConvert: (id: string) => void
  onDelete: (id: string) => void
  loadingStates?: {
    converting?: string | null
    deleting?: string | null
  }
}

export default function ReservationTable({ 
  reservations, 
  onConvert,
  onDelete,
  loadingStates = {}
}: ReservationTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const isHydrated = useHydration()

  const toggleRowExpand = (id: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
  }

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20'
      case 'confirmed':
        return 'bg-green-50 text-green-700 ring-green-600/20'
      case 'completed':
        return 'bg-purple-50 text-purple-700 ring-purple-600/20'
      case 'cancelled':
        return 'bg-red-50 text-red-700 ring-red-600/20'
      case 'expired':
        return 'bg-gray-50 text-gray-700 ring-gray-600/20'
    }
  }

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'confirmed':
        return 'Confirmée'
      case 'completed':
        return 'Terminée'
      case 'cancelled':
        return 'Annulée'
      case 'expired':
        return 'Expirée'
    }
  }

  const calculateTotal = (items: ReservationItemWithProduct[]) => {
    return items.reduce((total, item) => {
      const price = item.product?.price || item.unitPrice || 0
      const discount = item.discountPercentage || 0
      const discountedPrice = price * (1 - discount / 100)
      return total + (discountedPrice * item.quantity)
    }, 0)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Liste des réservations</h3>
      </div>
      <div className="flow-root">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">
                  Client
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Magasin
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date de retrait
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Acompte
                </th>
                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  Actions
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-6">
                  <span className="sr-only">Détails</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {reservations.map((reservation) => (
                <React.Fragment key={reservation.$id}>
                  <tr className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-6 pr-3">
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">
                          {reservation.client ? reservation.client.fullName : `Client ${reservation.clientId.substring(0, 8)}`}
                        </div>
                        <div className="text-gray-500">
                          {reservation.client ? reservation.client.email : 'Email non disponible'}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {reservation.store ? reservation.store.name : 'Magasin inconnu'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(reservation.expectedPickupDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      {reservation.depositAmount ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(reservation.depositAmount)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {reservation.depositPaid ? '(Payé)' : '(Non payé)'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Aucun</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        {(reservation.status === 'active' || reservation.status === 'confirmed') && (
                          <button
                            onClick={() => onConvert(reservation.$id)}
                            disabled={loadingStates.converting === reservation.$id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            title="Convertir en vente"
                          >
                            {loadingStates.converting === reservation.$id ? (
                              <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiShoppingCart className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(reservation.$id)}
                          disabled={loadingStates.deleting === reservation.$id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          title="Supprimer"
                        >
                          {loadingStates.deleting === reservation.$id ? (
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                      <button
                        onClick={() => toggleRowExpand(reservation.$id)}
                        className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-full p-2 transition-colors duration-200"
                      >
                        {expandedRows.has(reservation.$id) ? (
                          <FiChevronUp className="h-6 w-6" />
                        ) : (
                          <FiChevronDown className="h-6 w-6" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(reservation.$id) && (
                    <tr key={`${reservation.$id}-expanded`} className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Détails de la réservation</h4>
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Créée le: {formatDateTime(reservation.$createdAt)}</p>
                              <p>Par: {reservation.createdBy}</p>
                              {reservation.notes && <p>Notes: {reservation.notes}</p>}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Produits réservés</h4>
                            {reservation.items && reservation.items.length > 0 ? (
                              <div className="space-y-2">
                                <div className="overflow-hidden border border-gray-200 rounded-lg">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Produit
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Réf.
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Qté
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Prix unit.
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {reservation.items.map((item) => (
                                        <tr key={item.$id}>
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {item.product?.name || 'Produit inconnu'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-500">
                                            {item.product?.$id?.substring(0, 8) || 'N/A'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-center text-gray-900">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-right text-gray-900">
                                            {formatCurrency(item.product?.price || item.unitPrice || 0)}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                                            {formatCurrency(
                                              (item.product?.price || item.unitPrice || 0) * item.quantity
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="bg-gray-50">
                                        <td colSpan={4} className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                                          Total de la réservation:
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                                          {formatCurrency(calculateTotal(reservation.items))}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                Aucun produit trouvé pour cette réservation
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}