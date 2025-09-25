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
  Loader2
} from 'lucide-react'
import { DatePicker } from '../ui/date-picker'

const AnalyticsReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Load reports data
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)
      try {
        // Simulate loading demo daily reports data
        const today = new Date().toISOString().split('T')[0]
        const demoReports = [
          {
            id: 'RPT-001',
            title: `Raport Zilnic - ${today}`,
            description: 'Sumar activitate zilnică',
            category: 'daily',
            type: 'daily_summary',
            date: today,
            data: {
              appointments: 4,
              revenue: 868.7,
              newPatients: 2
            },
            status: 'completed',
            generatedBy: 'Sistem automat'
          }
        ]
        
        setReports(demoReports)
      } catch (error) {
        console.error('Error loading reports:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

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
    if (report.type === 'daily_summary') {
      return (
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Programări:</span>
            <div className="font-medium">{report.data.appointments}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Venit:</span>
            <div className="font-medium">{report.data.revenue.toFixed(2)} RON</div>
          </div>
          <div>
            <span className="text-muted-foreground">Pacienți noi:</span>
            <div className="font-medium">{report.data.newPatients}</div>
          </div>
        </div>
      )
    }
    return <div className="text-sm text-muted-foreground">Previzualizare indisponibilă</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapoarte</h1>
          <p className="text-muted-foreground">Analize și rapoarte detaliate</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Selectează data"
            className="w-48"
          />
          <button className="btn btn-primary flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Raport nou
          </button>
        </div>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Raport</th>
                    <th className="text-left p-3 font-medium">Detalii</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsReports