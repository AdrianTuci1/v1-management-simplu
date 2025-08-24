import { useState, useEffect } from 'react'
import { Shield, Plus, Search, Download, Edit, Trash2, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useDrawer } from '../../contexts/DrawerContext'
import { useRoles } from '../../hooks/useRoles.js'

const AdminAccess = () => {
  const { openDrawer } = useDrawer()
  const { 
    roles, 
    loading, 
    error, 
    stats, 
    loadRoles, 
    deleteRole, 
    exportRoles,
    filterRoles,
    sortRoles,
  } = useRoles()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Încarcă statisticile la prima renderizare
  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  // Căutare și filtrare
  const handleSearch = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    filterRoles({ search: term })
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    filterRoles({ status: status || undefined })
  }

  const handleSort = (field) => {
    const currentSort = roles.length > 0 ? roles[0][field] : null
    const newOrder = currentSort === 'asc' ? 'desc' : 'asc'
    sortRoles(field, newOrder)
  }

  // Acțiuni pentru roluri
  const handleEditRole = (role) => {
    openDrawer({
      type: 'role',
      data: role
    })
  }

  const handleDeleteRole = async (id) => {
    if (confirm('Ești sigur că vrei să ștergi acest rol?')) {
      try {
        await deleteRole(id)
      } catch (error) {
        console.error('Error deleting role:', error)
      }
    }
  }

  const handleExport = async () => {
    try {
      const data = await exportRoles('csv')
      const blob = new Blob([data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'roluri.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting roles:', error)
    }
  }



  // Obține status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: 'Activ' },
      inactive: { icon: XCircle, color: 'bg-red-100 text-red-800', text: 'Inactiv' },
      archived: { icon: Clock, color: 'bg-gray-100 text-gray-800', text: 'Arhivat' }
    }
    
    const config = statusConfig[status] || statusConfig.inactive
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Control Acces</h1>
          <p className="text-muted-foreground">Gestionează rolurile și permisiunile</p>
        </div>
        <button 
          onClick={() => {
            openDrawer({
              type: 'role',
            })
          }} 
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Rol nou
        </button>
      </div>

      {/* Statistici */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-content p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-primary" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Total Roluri</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">Permisiuni Medii</p>
                  <p className="text-2xl font-bold">{stats.avgPermissions}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-muted-foreground">% Active</p>
                  <p className="text-2xl font-bold">{stats.activePercentage}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtre și acțiuni */}
      <div className="card">
        <div className="card-content p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Căutare */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Caută roluri..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Filtru status */}
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Toate statusurile</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Arhivate</option>
              </select>
            </div>

                         <div className="flex items-center space-x-2">
               <button
                 onClick={handleExport}
                 className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <Download className="h-4 w-4 mr-2" />
                 Export
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Lista roluri */}
      <div className="card">
        <div className="card-content p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              {error}
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există roluri</h3>
              <p className="text-muted-foreground mb-4">Creează primul rol pentru a începe.</p>
              <button
                onClick={() => {
                  openRoleDrawer(null)
                }}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Rol nou
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                      Nume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descriere
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('permissionsCount')}>
                      Permisiuni
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 text-primary mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            <div className="text-sm text-gray-500">ID: {role.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {role.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {role.permissionsCount} permisiuni
                        </div>
                        <div className="text-xs text-gray-500">
                          {role.permissionsText}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(role.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
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

      {/* Role Drawer */}
      {/* The RoleDrawer component is now managed by the DrawerContext */}
    </div>
  )
}

export default AdminAccess
