import { useState } from 'react'
import { 
  User, Plus, RefreshCw, Edit, Eye, Mail, Phone, GraduationCap, RotateCw, Loader2, Download, Filter, Search
} from 'lucide-react'
import { useUsers } from '../../hooks/useUsers.js'
import { useDrawer } from '../../contexts/DrawerContext'
import { userManager } from '../../business/userManager.js'
import PermissionGate from '../PermissionGate'

const AdminUsers = () => {
  const { openDrawer } = useDrawer()
  const {
    users,
    loading,
    error,
    stats,
    populateTestData,
    clearAllData,
    exportUsers
  } = useUsers()

  const [selectedUsers, setSelectedUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('medicName')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showFilters, setShowFilters] = useState(false)

  // Sortare cu prioritizare pentru optimistic updates
  const sortedUsers = (() => {
    const baseSorted = userManager.sortUsers(users, sortBy, sortOrder)
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

  // Selectare utilizator
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Selectare toți
  const handleSelectAll = () => {
    if (selectedUsers.length === sortedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(sortedUsers.map(user => user.id))
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

  // Funcție pentru export
  const handleExport = async () => {
    try {
      const csvData = await exportUsers('csv')
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `medici_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting users:', error)
    }
  }

  // Populează cu date de test
  const handlePopulateTestData = async () => {
    if (window.confirm('Vrei să adaugi 10 utilizatori de test?')) {
      await populateTestData(10)
    }
  }

  // Curăță toate datele
  const handleClearAllData = async () => {
    if (window.confirm('Ești sigur că vrei să ștergi toți utilizatorii? Această acțiune nu poate fi anulată!')) {
      await clearAllData()
    }
  }

  // Obține eticheta pentru status
  const getStatusLabel = (status) => {
    const statusLabels = {
      active: 'Activ',
      inactive: 'Inactiv',
      suspended: 'Suspendat',
      retired: 'Pensionat'
    }
    return statusLabels[status] || status
  }

  // Obține clasa pentru status
  const getStatusClass = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      retired: 'bg-gray-100 text-gray-800'
    }
    return statusClasses[status] || 'bg-gray-100 text-gray-800'
  }

  // Obține eticheta pentru rol (simplu, direct din obiectul role)
  const getRoleLabel = (role) => {
    if (role && typeof role === 'object' && role.name) {
      return role.name
    }
    // Fallback pentru roluri hardcodate vechi (compatibilitate înapoi)
    if (typeof role === 'string') {
      const roleLabels = {
        doctor: 'Medic',
        nurse: 'Asistent',
        specialist: 'Specialist',
        resident: 'Rezident',
        admin: 'Admin'
      }
      return roleLabels[role] || role
    }
    return 'Necunoscut'
  }

  // Obține clasa pentru rol (simplă, culoare consistentă)
  const getRoleClass = (role) => {
    if (role && typeof role === 'object') {
      // Culoare consistentă pentru roluri noi
      return 'bg-blue-100 text-blue-700'
    }
    // Fallback pentru roluri hardcodate vechi (compatibilitate înapoi)
    if (typeof role === 'string') {
      const roleClasses = {
        doctor: 'bg-blue-100 text-blue-700',
        nurse: 'bg-green-100 text-green-700',
        specialist: 'bg-purple-100 text-purple-700',
        resident: 'bg-orange-100 text-orange-700',
        admin: 'bg-red-100 text-red-700'
      }
      return roleClasses[role] || 'bg-gray-100 text-gray-700'
    }
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-3">
        {/* Chip cu titlul */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
          <span className="font-semibold text-sm">Medici</span>
        </div>

        {/* Separator subtil */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Bara de căutare */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Caută medic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 rounded-full border border-gray-200 bg-white px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Buton filtrare */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="h-9 w-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center shadow-sm transition-all"
          title="Filtrează"
        >
          <Filter className="h-4 w-4 text-gray-700" />
        </button>

        {/* Buton adăugare medic */}
        <PermissionGate permission="users:create">
          <button 
            onClick={() => openDrawer({ type: 'medic' })} 
            className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all"
            title="Medic nou"
          >
            <Plus className="h-4 w-4" />
          </button>
        </PermissionGate>
      </div>


      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <h3 className="card-title">Lista Medici</h3>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {sortedUsers.length} medici afișați
            </p>
          </div>
        </div>
        
        <div className="card-content">
          {loading && sortedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Se încarcă medicii...</p>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există medici</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter || roleFilter
                  ? 'Nu s-au găsit medici cu criteriile specificate.'
                  : 'Aici vei putea gestiona medicii sistemului.'
                }
              </p>
              {!searchTerm && !statusFilter && !roleFilter && (
                <PermissionGate permission="users:create">
                  <button 
                    onClick={() => openDrawer({ type: 'medic' })}
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă primul medic
                  </button>
                </PermissionGate>
              )}
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 210px)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('medicName')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Nume
                        {sortBy === 'medicName' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Contact</th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Rol
                        {sortBy === 'role' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Zile Serviciu</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className={`border-b hover:bg-muted/50 cursor-pointer ${
                        user._isDeleting ? 'opacity-50' : ''
                      }`}
                      onClick={() => openDrawer({ type: 'medic', data: user })}
                    >
 
                      <td className="p-3">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <span className={user._isDeleting ? 'line-through opacity-50' : ''}>
                              {user.fullName || user.medicName || 'Nume indisponibil'}
                            </span>
                            {user._isOptimistic && !user._isDeleting && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                                <RotateCw className="h-3 w-3 animate-spin" />
                                În curs
                              </span>
                            )}
                            {user._isDeleting && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                Ștergere...
                              </span>
                            )}
                          </div>
                          {user.resourceId && !user._tempId && (
                            <div className="text-sm text-muted-foreground">
                              ID: {user.resourceId}
                            </div>
                          )}
                          {user._tempId && (
                            <div className="text-sm text-muted-foreground">
                              ID temporar: {user._tempId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {user.email || 'Email indisponibil'}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {user.phone || 'Telefon indisponibil'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleClass(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {user.dutyDays?.map((day, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {day}
                            </span>
                          ))}
                          {(!user.dutyDays || user.dutyDays.length === 0) && (
                            <span className="text-xs text-gray-500">Fără zile setate</span>
                          )}
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

      {/* Footer cu acțiuni */}
      {selectedUsers.length > 0 && (
        <div className="card">
          <div className="card-content p-4">
            <p className="text-sm text-muted-foreground">
              {selectedUsers.length} utilizator{selectedUsers.length === 1 ? '' : 'i'} selectați
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
