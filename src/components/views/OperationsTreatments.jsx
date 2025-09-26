import { 
  Activity, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Clock,
  Stethoscope,
  Loader2,
  Download,
  RotateCw
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useDrawer } from '../../contexts/DrawerContext'
import { useTreatments } from '../../hooks/useTreatments.js'

const OperationsTreatments = () => {
  const { openDrawer } = useDrawer()
  
  // Hook pentru gestionarea tratamentelor
  const { 
    treatments, 
    loading, 
    error, 
    stats,
    treatmentCount,
    searchTreatments, 
    loadTreatmentsByCategory,
    loadTreatmentsByType,
    exportTreatments,
    getUniqueCategories,
    getUniqueTreatmentTypes,
    deleteTreatment
  } = useTreatments()
  
  // State management local
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('treatmentType')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showFilters, setShowFilters] = useState(false)

  // Sortare cu prioritizare pentru optimistic updates
  const sortedTreatments = useMemo(() => {
    // Aplică sortarea de bază
    const baseSorted = [...treatments].sort((a, b) => {
      let aValue = a[sortBy] || ''
      let bValue = b[sortBy] || ''
      
      // Convertim la string pentru comparație
      aValue = String(aValue).toLowerCase()
      bValue = String(bValue).toLowerCase()
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })
    
    // Aplică sortarea secundară pentru optimistic updates
    return baseSorted.sort((a, b) => {
      const aOpt = !!a._isOptimistic && !a._isDeleting
      const bOpt = !!b._isOptimistic && !b._isDeleting
      const aDel = !!a._isDeleting
      const bDel = !!b._isDeleting
      
      // Prioritizează optimistic updates
      if (aOpt && !bOpt) return -1
      if (!aOpt && bOpt) return 1
      
      // Pune elementele în ștergere la sfârșit
      if (aDel && !bDel) return 1
      if (!aDel && bDel) return -1
      
      return 0
    })
  }, [treatments, sortBy, sortOrder])

  // Gestionează căutarea
  const handleSearch = async (e) => {
    const term = e.target.value
    setSearchTerm(term)
    if (term.trim()) {
      await searchTreatments(term)
    }
  }

  // Gestionează filtrarea după categorie
  const handleCategoryFilter = (category) => {
    setCategoryFilter(category)
    if (category) {
      loadTreatmentsByCategory(category)
    }
  }

  // Gestionează filtrarea după tip
  const handleTypeFilter = (type) => {
    setTypeFilter(type)
    if (type) {
      loadTreatmentsByType(type)
    }
  }

  // Gestionează exportul
  const handleExport = async (format) => {
    try {
      const exportData = await exportTreatments(format)
      
      if (format === 'csv') {
        const blob = new Blob([exportData], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tratamente_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        const blob = new Blob([exportData], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tratamente_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting treatments:', error)
    }
  }

  // Obține categoriile și tipurile unice pentru filtre
  const uniqueCategories = getUniqueCategories()
  const uniqueTreatmentTypes = getUniqueTreatmentTypes()

  // Get treatment type icon
  const getTreatmentTypeIcon = (type) => {
    const iconMap = {
      'Consultație stomatologică': Stethoscope,
      'Detartraj': Activity,
      'Plombă compozită': Activity,
      'Extracție dinte': Activity,
      'Radiografie panoramică': Activity,
      'Tratament canal': Activity,
      'Proteză mobilă': Activity,
      'Implant dentar': Activity,
      'Albire dentară': Activity,
      'Ortodonție - bracket': Activity,
      'default': Stethoscope
    }
    
    return iconMap[type] || iconMap.default
  }

  // Handle delete treatment
  const handleDeleteTreatment = async (treatmentId) => {
    if (confirm('Ești sigur că vrei să ștergi acest tratament?')) {
      try {
        await deleteTreatment(treatmentId)
      } catch (error) {
        console.error('Error deleting treatment:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tratamente</h1>
          <p className="text-muted-foreground">
            Gestionează tratamentele și procedurile medicale
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openDrawer({ type: 'treatment', isNew: true })}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tratament nou
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Caută tratamente"
                value={searchTerm}
                onChange={handleSearch}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
            <div className="flex gap-2">          
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrează
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Treatments List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h3 className="card-title">Lista Tratamente</h3>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {treatmentCount} tratamente afișate
            </p>
          </div>
        </div>
        
        <div className="card-content">
          {loading && sortedTreatments.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Se încarcă tratamentele...</p>
            </div>
          ) : sortedTreatments.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există tratamente</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter || typeFilter 
                  ? 'Nu s-au găsit tratamente cu criteriile specificate.'
                  : 'Aici vei putea gestiona tratamentele stomatologice.'
                }
              </p>
              {!searchTerm && !categoryFilter && !typeFilter && (
                <button 
                  onClick={() => openDrawer({ type: 'treatment', isNew: true })}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă primul tratament
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => setSortBy('treatmentType')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Tip Tratament
                        {sortBy === 'treatmentType' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => setSortBy('category')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Categorie
                        {sortBy === 'category' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => setSortBy('duration')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Durata
                        {sortBy === 'duration' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => setSortBy('price')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Preț
                        {sortBy === 'price' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTreatments.map((treatment) => {
                    const TypeIcon = getTreatmentTypeIcon(treatment.treatmentType)
                    
                    return (
                      <tr 
                        key={treatment.resourceId} 
                        className={`border-b hover:bg-muted/50 cursor-pointer ${
                          treatment._isDeleting ? 'opacity-50' : ''
                        }`}
                        onClick={() => openDrawer({ type: 'treatment', isNew: false, data: treatment })}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-primary" />
                            <span className={`font-medium ${
                              treatment._isDeleting ? 'line-through' : ''
                            }`}>
                              {treatment.treatmentType}
                            </span>
                            {treatment._isOptimistic && !treatment._isDeleting && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                                <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                                În curs
                              </span>
                            )}
                            {treatment._isDeleting && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                Ștergere...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm text-muted-foreground ${
                              treatment._isDeleting ? 'line-through' : ''
                            }`}>
                              {treatment.category}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className={treatment._isDeleting ? 'line-through' : ''}>
                              {treatment.duration} min
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              treatment._isDeleting ? 'line-through' : ''
                            }`}>
                              {treatment.price} RON
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OperationsTreatments
