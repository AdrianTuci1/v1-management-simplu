import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, FileImage, Calendar, Users, Stethoscope, ShoppingCart, User, CheckCircle, AlertCircle } from 'lucide-react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import useSettingsStore from '../../stores/settingsStore'

const DataDownloadDrawer = ({ onClose }) => {
  const { dataDownload, updateDataDownload } = useSettingsStore()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [selectedFormats, setSelectedFormats] = useState({
    csv: dataDownload.exportFormats.csv.enabled,
    pdf: dataDownload.exportFormats.pdf.enabled,
    excel: dataDownload.exportFormats.excel.enabled
  })
  const [selectedDataTypes, setSelectedDataTypes] = useState({
    patients: dataDownload.dataTypes.patients.enabled,
    appointments: dataDownload.dataTypes.appointments.enabled,
    treatments: dataDownload.dataTypes.treatments.enabled,
    sales: dataDownload.dataTypes.sales.enabled,
    users: dataDownload.dataTypes.users.enabled
  })

  const formatOptions = [
    { id: 'csv', name: 'CSV', description: 'Format simplu pentru analiză', icon: FileText },
    { id: 'pdf', name: 'PDF', description: 'Raport formatat cu grafice', icon: FileImage },
    { id: 'excel', name: 'Excel', description: 'Tabel cu formule și formatare', icon: FileSpreadsheet }
  ]

  const dataTypeOptions = [
    { id: 'patients', name: 'Pacienți', description: 'Lista pacienților și istoricul medical', icon: Users },
    { id: 'appointments', name: 'Programări', description: 'Programările și notele asociate', icon: Calendar },
    { id: 'treatments', name: 'Tratamente', description: 'Tratamentele și prețurile', icon: Stethoscope },
    { id: 'sales', name: 'Vânzări', description: 'Tranzacțiile și detaliile vânzărilor', icon: ShoppingCart },
    { id: 'users', name: 'Utilizatori', description: 'Utilizatorii și permisiunile', icon: User }
  ]

  const handleFormatToggle = (formatId) => {
    const newFormats = {
      ...selectedFormats,
      [formatId]: !selectedFormats[formatId]
    }
    setSelectedFormats(newFormats)
  }

  const handleDataTypeToggle = (dataTypeId) => {
    const newDataTypes = {
      ...selectedDataTypes,
      [dataTypeId]: !selectedDataTypes[dataTypeId]
    }
    setSelectedDataTypes(newDataTypes)
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Update settings with current selections
      updateDataDownload({
        exportFormats: {
          csv: { enabled: selectedFormats.csv, includeHeaders: true },
          pdf: { enabled: selectedFormats.pdf, includeCharts: true },
          excel: { enabled: selectedFormats.excel, includeFormulas: false }
        },
        dataTypes: {
          patients: { enabled: selectedDataTypes.patients, includeHistory: true },
          appointments: { enabled: selectedDataTypes.appointments, includeNotes: true },
          treatments: { enabled: selectedDataTypes.treatments, includePrices: true },
          sales: { enabled: selectedDataTypes.sales, includeDetails: true },
          users: { enabled: selectedDataTypes.users, includePermissions: false }
        },
        schedule: {
          ...dataDownload.schedule,
          lastExport: new Date().toISOString()
        }
      })

      // Simulate file download
      const selectedFormatsList = Object.entries(selectedFormats)
        .filter(([_, enabled]) => enabled)
        .map(([format, _]) => format.toUpperCase())
      
      const selectedDataTypesList = Object.entries(selectedDataTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type, _]) => type)

      console.log(`Exporting ${selectedDataTypesList.join(', ')} data in ${selectedFormatsList.join(', ')} format(s)`)
      
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const hasSelectedFormats = Object.values(selectedFormats).some(enabled => enabled)
  const hasSelectedDataTypes = Object.values(selectedDataTypes).some(enabled => enabled)

  return (
    <Drawer>
      <DrawerHeader>
        <div className="flex items-center gap-3">
          <Download className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Descărcare date</h2>
            <p className="text-sm text-muted-foreground">
              Exportă datele sistemului în diferite formate pentru analiză și backup
            </p>
          </div>
        </div>
      </DrawerHeader>
      
      <DrawerContent>
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Download className="h-5 w-5" />
                Formate de export
              </h3>
              <p className="text-sm text-gray-600">
                Selectează formatele în care dorești să descarci datele
              </p>
            </div>
            
            <div className="space-y-4">
              {formatOptions.map((format) => {
                const Icon = format.icon
                return (
                  <div key={format.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-500" />
                      <div>
                        <label className="font-medium">{format.name}</label>
                        <p className="text-sm text-gray-600">{format.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFormatToggle(format.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        selectedFormats[format.id] ? 'bg-green-600' : 'bg-gray-300'
                      } cursor-pointer`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          selectedFormats[format.id] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data Types Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5" />
                Tipuri de date
              </h3>
              <p className="text-sm text-gray-600">
                Selectează ce tipuri de date să incluzi în export
              </p>
            </div>
            
            <div className="space-y-4">
              {dataTypeOptions.map((dataType) => {
                const Icon = dataType.icon
                return (
                  <div key={dataType.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-500" />
                      <div>
                        <label className="font-medium">{dataType.name}</label>
                        <p className="text-sm text-gray-600">{dataType.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDataTypeToggle(dataType.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        selectedDataTypes[dataType.id] ? 'bg-green-600' : 'bg-gray-300'
                      } cursor-pointer`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          selectedDataTypes[dataType.id] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Opțiuni export</h3>
              <p className="text-sm text-gray-600">
                Configurează opțiunile pentru exportul automat
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Export automat</label>
                  <p className="text-sm text-gray-600">
                    Programează exportul automat al datelor
                  </p>
                </div>
                <button
                  onClick={() => 
                    updateDataDownload({
                      schedule: { ...dataDownload.schedule, autoExport: !dataDownload.schedule.autoExport }
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    dataDownload.schedule.autoExport ? 'bg-green-600' : 'bg-gray-300'
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dataDownload.schedule.autoExport ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {dataDownload.schedule.autoExport && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frecvența exportului</label>
                  <select
                    value={dataDownload.schedule.frequency}
                    onChange={(e) => 
                      updateDataDownload({
                        schedule: { ...dataDownload.schedule, frequency: e.target.value }
                      })
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="daily">Zilnic</option>
                    <option value="weekly">Săptămânal</option>
                    <option value="monthly">Lunar</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Export Status */}
          {dataDownload.schedule.lastExport && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">Ultimul export</h4>
                  <p className="text-sm text-green-700">
                    Data: {new Date(dataDownload.schedule.lastExport).toLocaleString('ro-RO')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Export în progres...</span>
                  <span className="text-sm text-gray-600">{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {!hasSelectedFormats && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Selectează cel puțin un format de export
              </span>
            </div>
          )}

          {!hasSelectedDataTypes && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Selectează cel puțin un tip de date
              </span>
            </div>
          )}
        </div>
      </DrawerContent>
      
      <DrawerFooter>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Închide
          </button>
          <button
            onClick={handleExport}
            disabled={!hasSelectedFormats || !hasSelectedDataTypes || isExporting}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            {isExporting ? 'Export în progres...' : 'Exportă datele'}
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default DataDownloadDrawer