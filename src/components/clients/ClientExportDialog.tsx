'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { FiX, FiDownload, FiFileText, FiFilePlus } from 'react-icons/fi'
import { Client, ClientAnalytics } from '@/types/client.types'
import { ClientExportOptions, exportClientsData } from '@/lib/utils/clientExportUtils'
import { useGroupedNotifications } from '@/hooks/useGroupedNotifications'

interface ClientExportDialogProps {
  open: boolean
  onClose: () => void
  clients: Client[]
  analytics?: ClientAnalytics
}

export default function ClientExportDialog({ 
  open, 
  onClose, 
  clients, 
  analytics 
}: ClientExportDialogProps) {
  const { showGroupedNotification } = useGroupedNotifications()
  
  const [exportOptions, setExportOptions] = useState<ClientExportOptions>({
    format: 'pdf',
    orientation: 'portrait',
    includeDetails: true,
    includeAnalytics: true
  })

  const [isExporting, setIsExporting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined

    setExportOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Exporter les données
      exportClientsData(clients, exportOptions, analytics)
      
      // Notification de succès
      showGroupedNotification(
        'success',
        `Les données clients ont été exportées avec succès au format ${exportOptions.format.toUpperCase()}.`,
        'client-export'
      )
      
      // Fermer la boîte de dialogue
      onClose()
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error)
      showGroupedNotification(
        'error',
        'Une erreur est survenue lors de l\'exportation des données clients.',
        'client-export-error'
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <FiX className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <FiDownload className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Exporter les données clients
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Choisissez le format et les options d&apos;exportation pour les {clients.length} clients sélectionnés.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                        Format d&apos;exportation
                      </label>
                      <select
                        id="format"
                        name="format"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={exportOptions.format}
                        onChange={handleChange}
                      >
                        <option value="pdf">PDF</option>
                        <option value="csv">CSV (Excel)</option>
                      </select>
                    </div>

                    {exportOptions.format === 'pdf' && (
                      <div>
                        <label htmlFor="orientation" className="block text-sm font-medium text-gray-700">
                          Orientation
                        </label>
                        <select
                          id="orientation"
                          name="orientation"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={exportOptions.orientation}
                          onChange={handleChange}
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Paysage</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        id="includeDetails"
                        name="includeDetails"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={exportOptions.includeDetails}
                        onChange={handleChange}
                      />
                      <label htmlFor="includeDetails" className="ml-2 block text-sm text-gray-700">
                        Inclure les détails complets
                      </label>
                    </div>

                    {analytics && (
                      <div className="flex items-center">
                        <input
                          id="includeAnalytics"
                          name="includeAnalytics"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={exportOptions.includeAnalytics}
                          onChange={handleChange}
                        />
                        <label htmlFor="includeAnalytics" className="ml-2 block text-sm text-gray-700">
                          Inclure les statistiques
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                      onClick={handleExport}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        'Exportation en cours...'
                      ) : (
                        <>
                          {exportOptions.format === 'pdf' ? (
                            <>
                              <FiFileText className="mr-2 h-5 w-5" aria-hidden="true" />
                              Exporter en PDF
                            </>
                          ) : (
                            <>
                              <FiFilePlus className="mr-2 h-5 w-5" aria-hidden="true" />
                              Exporter en CSV
                            </>
                          )}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                      onClick={onClose}
                      disabled={isExporting}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}