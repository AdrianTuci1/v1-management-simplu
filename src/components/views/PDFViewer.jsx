import { useState, useEffect } from 'react'
import { X, Download, Trash2, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

const PDFViewer = ({ isOpen, onClose, pdfUrl, reportData, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (isOpen && pdfUrl) {
      // Reset viewer state when opening new PDF
      setCurrentPage(1)
      setScale(1)
      setRotation(0)
    }
  }, [isOpen, pdfUrl])

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `raport-${reportData?.date || 'zilnic'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDelete = () => {
    if (onDelete && reportData) {
      onDelete(reportData.id)
    }
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            Raport Zilnic - {reportData?.date ? new Date(reportData.date).toLocaleDateString('ro-RO') : 'N/A'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Pagina {currentPage} din {totalPages}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-r border-gray-200 px-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Descarcă PDF"
            >
              <Download className="h-4 w-4" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                title="Șterge raportul"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Închide"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
        {pdfUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
              onLoad={(e) => {
                // Try to get total pages from PDF (this is a simplified approach)
                // In a real implementation, you'd use a PDF.js library
                setTotalPages(1) // Default to 1 page
              }}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p>PDF-ul nu a putut fi încărcat</p>
          </div>
        )}
      </div>

      {/* Footer with page info */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div>
          Generat la: {new Date().toLocaleString('ro-RO')}
        </div>
        <div className="flex items-center gap-4">
          <span>Zoom: {Math.round(scale * 100)}%</span>
          <span>Rotație: {rotation}°</span>
        </div>
      </div>
    </div>
  )
}

export default PDFViewer
