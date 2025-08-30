'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { BsDownload, BsX } from 'react-icons/bs'
import { DashboardData } from '@/hooks/useDashboardData'
import { exportDashboardData } from '@/lib/utils/exportUtils'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  dashboardData: DashboardData
  period: string
}

type ExportFormat = 'csv' | 'pdf'
type PdfOrientation = 'portrait' | 'landscape'

export default function ExportDialog({ open, onClose, dashboardData, period }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [includeRawData, setIncludeRawData] = useState(false)
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('portrait')
  const [isExporting, setIsExporting] = useState(false)
  
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Exporter les données en utilisant l'utilitaire d'exportation
      exportDashboardData(dashboardData, {
        format,
        includeRawData,
        pdfOrientation,
        period
      })
      
      // Fermer la boîte de dialogue après un court délai pour permettre à l'exportation de se terminer
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Export error:', error)
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <BsX className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <BsDownload className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Exporter les données du tableau de bord
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Choisissez le format et les options d&apos;export pour la période: <span className="font-medium">{period}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Format</label>
                    <fieldset className="mt-2">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            id="format-pdf"
                            name="format"
                            type="radio"
                            checked={format === 'pdf'}
                            onChange={() => setFormat('pdf')}
                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="format-pdf" className="ml-3 block text-sm font-medium text-gray-700">
                            PDF
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="format-csv"
                            name="format"
                            type="radio"
                            checked={format === 'csv'}
                            onChange={() => setFormat('csv')}
                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="format-csv" className="ml-3 block text-sm font-medium text-gray-700">
                            CSV (données brutes)
                          </label>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                  
                  {format === 'pdf' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Orientation</label>
                      <fieldset className="mt-2">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              id="orientation-portrait"
                              name="orientation"
                              type="radio"
                              checked={pdfOrientation === 'portrait'}
                              onChange={() => setPdfOrientation('portrait')}
                              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="orientation-portrait" className="ml-3 block text-sm font-medium text-gray-700">
                              Portrait
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              id="orientation-landscape"
                              name="orientation"
                              type="radio"
                              checked={pdfOrientation === 'landscape'}
                              onChange={() => setPdfOrientation('landscape')}
                              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="orientation-landscape" className="ml-3 block text-sm font-medium text-gray-700">
                              Paysage
                            </label>
                          </div>
                        </div>
                      </fieldset>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      id="include-raw-data"
                      name="include-raw-data"
                      type="checkbox"
                      checked={includeRawData}
                      onChange={(e) => setIncludeRawData(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="include-raw-data" className="ml-3 block text-sm font-medium text-gray-700">
                      Inclure les données brutes
                    </label>
                  </div>
                </div>
                
                <div className="mt-8 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:col-start-2"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                        Exportation...
                      </>
                    ) : (
                      'Exporter'
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}