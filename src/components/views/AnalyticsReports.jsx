import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  FileText,
  PieChart,
  Activity,
  Loader2,
  Eye,
  Trash2
} from 'lucide-react'
import { DatePicker } from '../ui/date-picker'
import GenerateReportModal from '../modals/GenerateReportModal'
import PDFViewer from './PDFViewer'
import { useReports } from '../../hooks/useReports'
import { useSales } from '../../hooks/useSales'
import { useProducts } from '../../hooks/useProducts'
import { useTreatments } from '../../hooks/useTreatments'

const AnalyticsReports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [currentPDFUrl, setCurrentPDFUrl] = useState(null)
  const [currentReportData, setCurrentReportData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Hooks pentru date
  const { reports, loading, generateReport, deleteReport } = useReports()
  const { sales } = useSales()
  const { products } = useProducts()
  const { treatments } = useTreatments()

  // Nu mai avem nevoie de useEffect pentru încărcarea rapoartelor
  // Hook-ul useReports se ocupă de asta automat

  // Funcție pentru generarea unui raport nou
  const handleGenerateReport = async (date) => {
    setIsGenerating(true)
    try {
      // Trimite data ca prim parametru, urmat de datele opționale
      // Dacă datele sunt disponibile, le trimite; altfel, reportService le va încărca automat
      const report = await generateReport(date, sales, products, treatments)
      setCurrentPDFUrl(report.pdfUrl)
      setCurrentReportData(report)
      setShowPDFViewer(true)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Funcție pentru deschiderea unui raport existent
  const handleViewReport = (report) => {
    setCurrentPDFUrl(report.pdfUrl)
    setCurrentReportData(report)
    setShowPDFViewer(true)
  }

  // Funcție pentru ștergerea unui raport
  const handleDeleteReport = async (reportId) => {
    try {
      await deleteReport(reportId)
      if (currentReportData?.id === reportId) {
        setShowPDFViewer(false)
        setCurrentPDFUrl(null)
        setCurrentReportData(null)
      }
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  // Funcție pentru închiderea PDF viewer-ului
  const handleClosePDFViewer = () => {
    setShowPDFViewer(false)
    setCurrentPDFUrl(null)
    setCurrentReportData(null)
  }

  // Filter reports by selected date
  const filteredReports = reports.filter(report => report.date === selectedDate)

  // Calculate statistics for selected date
  const stats = {
    totalReports: filteredReports.length,
    completedReports: filteredReports.filter(r => r.status === 'completed').length,
    generatingReports: filteredReports.filter(r => r.status === 'generating').length,
    categories: [...new Set(filteredReports.map(r => r.category))]
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', text: 'Completat' },
      generating: { color: 'bg-yellow-100 text-yellow-800', text: 'Se generează' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Eșuat' }
    }
    
    const config = statusConfig[status] || statusConfig.completed
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'financial': return <DollarSign className="h-4 w-4" />
      case 'patients': return <Users className="h-4 w-4" />
      case 'services': return <Activity className="h-4 w-4" />
      case 'inventory': return <FileText className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category) => {
    const labels = {
      daily: 'Zilnic',
      financial: 'Financiar',
      patients: 'Pacienți',
      services: 'Servicii',
      inventory: 'Inventar'
    }
    return labels[category] || category
  }

  const renderReportPreview = (report) => {
    if (report.type === 'daily_sales' && report.stats) {
      // Calculează totalul cash și card din paymentMethodBreakdown
      const cashRevenue = report.stats.paymentMethodBreakdown?.cash?.revenue || 0;
      const cardRevenue = report.stats.paymentMethodBreakdown?.card?.revenue || 0;
      
      return (
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Vânzări:</span>
            <div className="font-medium">{report.stats.totalSales || 0}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Venit total:</span>
            <div className="font-medium">{(report.stats.totalRevenue || 0).toFixed(2)} RON</div>
          </div>
          <div>
            <span className="text-muted-foreground">Servicii:</span>
            <div className="font-medium">{(report.stats.servicesRevenue || 0).toFixed(2)} RON</div>
          </div>
          <div>
            <span className="text-muted-foreground">Produse:</span>
            <div className="font-medium">{(report.stats.productsRevenue || 0).toFixed(2)} RON</div>
          </div>
        </div>
      )
    }
    return <div className="text-sm text-muted-foreground">Previzualizare indisponibilă</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-3">
        {/* Chip cu titlul */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
          <span className="font-semibold text-sm">Rapoarte</span>
        </div>

        {/* Separator subtil */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Date picker */}
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder="Selectează data"
          className="w-48"
        />

        {/* Buton generare raport */}
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all"
          title="Raport nou"
        >
          <BarChart3 className="h-4 w-4" />
        </button>
      </div>



      {/* Reports List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Lista Rapoarte</h3>
          </div>
        </div>
        
        <div className="card-content">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Se încarcă rapoartele...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există rapoarte</h3>
              <p className="text-muted-foreground mb-4">
                Nu există rapoarte pentru data selectată.
              </p>
              <button className="btn btn-primary">
                <BarChart3 className="h-4 w-4 mr-2" />
                Primul raport
              </button>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 210px)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Raport</th>
                    <th className="text-left p-3 font-medium">Detalii</th>
                    <th className="text-left p-3 font-medium">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="text-sm font-medium">{report.date}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(report.category)}
                          <span className="font-medium">{report.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {report.description}
                        </div>
                      </td>
                      <td className="p-3">
                        {renderReportPreview(report)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="Vezi raportul"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Șterge raportul"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerateReport={handleGenerateReport}
      />

      {/* PDF Viewer */}
      <PDFViewer
        isOpen={showPDFViewer}
        onClose={handleClosePDFViewer}
        pdfUrl={currentPDFUrl}
        reportData={currentReportData}
        onDelete={handleDeleteReport}
      />
    </div>
  )
}

export default AnalyticsReports