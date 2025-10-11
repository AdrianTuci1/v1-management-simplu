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
  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1)
    // useEffect-ul va gestiona încărcarea automată
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
      <div className="flex items-center justify-start gap-3">
        {/* Chip cu titlul */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
          <span className="font-semibold text-sm">Pacienți</span>
        </div>

        {/* Separator subtil */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Bara de căutare */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Caută pacienți..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-9 rounded-full border border-gray-200 bg-white px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Buton adăugare pacient */}
        <button
          onClick={() => openDrawer({ type: 'new-person' })}
          className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all"
          title="Pacient nou"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>


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
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 210px)' }}>
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
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.map((patient) => (
                    <tr 
                      key={patient.resourceId || patient.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => openDrawer({ 
                        type: 'edit-person', 
                        data: patient 
                      })}
                    >
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
                          {patient.address && patient.address !== '.' && patient.city ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {patient.address}, {patient.city}
                            </div>
                          ) : patient.address && patient.address !== '.' ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {patient.address}
                            </div>
                          ) : patient.city ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {patient.city}
                            </div>
                          ) : (
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
