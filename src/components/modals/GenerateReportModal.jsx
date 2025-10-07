import { useState } from 'react'
import { X, Calendar, FileText, Loader2 } from 'lucide-react'
import { DatePicker } from '../ui/date-picker'

const GenerateReportModal = ({ isOpen, onClose, onGenerateReport }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!selectedDate) return

    setIsGenerating(true)
    try {
      await onGenerateReport(selectedDate)
      onClose()
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Generare Raport Zilnic</h2>
              <p className="text-sm text-muted-foreground">
                Generează un raport detaliat pentru o zi specifică
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Selectează data pentru raport
            </label>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Selectează data"
                className="flex-1"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Ce include raportul:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Vânzări totale și venituri</li>
              <li>• Separare servicii vs produse</li>
              <li>• Încasări cash vs card</li>
              <li>• Detalii pe fiecare vânzare</li>
              <li>• Export în format PDF</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isGenerating}
          >
            Anulează
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedDate || isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Se generează...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generează raport
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GenerateReportModal
