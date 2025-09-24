import { 
  Users, 
  Plus, 
  Search, 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  RotateCw
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePatients } from '../../hooks/usePatients.js'
import patientManager from '../../business/patientManager.js'
import { useDrawer } from '../../contexts/DrawerContext'

const OperationsPeople = () => {
  const { openDrawer } = useDrawer()
  const { 
    patients, 
    loading, 
    error, 
    stats,
    loadPatients, 
    loadPatientsByPage, 
    searchPatients,
    deletePatient,
    exportPatients 
  } = usePatients()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // Încarcă pacienții la montarea componentei
  useEffect(() => {
    loadPatientsByPage(currentPage, 20, {
      name: searchTerm
    })
  }, [currentPage, searchTerm, loadPatientsByPage])

  // Funcție pentru căutare
  const handleSearch = async (term) => {
    setSearchTerm(term)
    setCurrentPage(1)
    if (term.trim()) {
      await searchPatients(term)
    } else {
      await loadPatientsByPage(1, 20, {})
    }
  }

  // Funcție pentru ștergerea unui pacient
  const handleDeletePatient = async (patientId) => {
    if (confirm('Ești sigur că vrei să ștergi acest pacient?')) {
      try {
        await deletePatient(patientId)
        // Nu mai reîncărcăm imediat; lista este actualizată optimist prin hook și va fi reconciliată via websocket
      } catch (error) {
        console.error('Error deleting patient:', error)
      }
    }
  }

  // Funcție pentru export
  const handleExport = async () => {
    try {
      const csvData = await exportPatients('csv')
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `pacienti_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting patients:', error)
    }
  }

  // Funcție pentru sortare
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Sortează pacienții și prioritizează elementele optimiste (neconfirmate încă)
  const sortedPatients = (() => {
    const baseSorted = patientManager.sortPatients(patients, sortBy, sortOrder)
    // Aduce elementele cu _isOptimistic în față pentru feedback instant
    // Dar pune elementele cu _isDeleting la sfârșit
    return [...baseSorted].sort((a, b) => {
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
  })()

  // Calculează vârsta
  const calculateAge = (birthDate, birthYear) => {
    if (birthYear) {
      return new Date().getFullYear() - birthYear
    }
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // Obține eticheta pentru status
  const getStatusLabel = (status) => {
    const statusLabels = {
      active: 'Activ',
      inactive: 'Inactiv',
      archived: 'Arhivat'
    }
    return statusLabels[status] || status
  }

  // Obține clasa pentru status
  const getStatusClass = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return statusClasses[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacienti</h1>
          <p className="text-muted-foreground">
            Gestionează clienții
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-outline"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => openDrawer({ type: 'new-person' })}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Persoană nouă
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-content p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total pacienți</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activi</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactivi</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
              </div>
              <User className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Noi luna aceasta</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newThisMonth}</p>
              </div>
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
          </div>
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
                placeholder="Caută pacienți după nume, email, telefon..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            
          </div>
        </div>
      </div>

      {/* Error Display - doar când nu avem date în cache */}
      {error && sortedPatients.length === 0 && (
        <div className="card">
          <div className="card-content">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Patients List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="card-title">Lista Pacienți</h3>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {patients.length} pacienți afișați
            </p>
          </div>
        </div>
        
        <div className="card-content">
          {loading && patients.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Se încarcă pacienții...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există pacienți</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Nu s-au găsit pacienți cu criteriile specificate.'
                  : 'Aici vei putea gestiona clienții și personalul companiei.'
                }
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => openDrawer({ type: 'new-person' })}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă primul pacient
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
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Nume
                        {sortBy === 'name' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Contact</th>
                    <th className="text-left p-3 font-medium">Adresa</th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('birthYear')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Vârsta
                        {sortBy === 'birthYear' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Status
                        {sortBy === 'status' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.map((patient) => (
                    <tr key={patient.resourceId || patient.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <span className={patient._isDeleting ? 'line-through opacity-50' : ''}>
                              {patient.name || patient.patientName}
                            </span>
                            {patient._isOptimistic && !patient._isDeleting && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                                <RotateCw className="h-3 w-3" />
                              </span>
                            )}
                            {patient._isDeleting && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                Ștergere...
                              </span>
                            )}
                          </div>
                          {patient.resourceId && !patient._tempId && (
                            <div className="text-sm text-muted-foreground">
                              ID: {patient.resourceId}
                            </div>
                          )}
                          {patient._tempId && (
                            <div className="text-sm text-muted-foreground">
                              ID temporar: {patient._tempId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {patient.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {patient.address && patient.address !== '.' && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {patient.address}
                            </div>
                          )}
                          {patient.city && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {patient.city}
                            </div>
                          )}
                          {patient.county && (
                            <div className="text-sm text-muted-foreground">
                              {patient.county}
                            </div>
                          )}
                          {(!patient.address || patient.address === '.') && !patient.city && !patient.county && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {patient.birthYear || patient.birthDate ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {calculateAge(patient.birthDate, patient.birthYear)} ani
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(patient.status)}`}>
                          {getStatusLabel(patient.status)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDrawer({ 
                              type: 'edit-person', 
                              data: patient 
                            })}
                            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Editează"
                            disabled={patient._isOptimistic || patient._isDeleting}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(patient.resourceId || patient.id)}
                            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-accent text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Șterge"
                            disabled={patient._isOptimistic || patient._isDeleting}
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
    </div>
  )
}

export default OperationsPeople
