import { useState } from 'react'
import { 
  User, Plus, RefreshCw, Edit, Eye, Mail, Phone, GraduationCap
} from 'lucide-react'
import { useUsers } from '../../hooks/useUsers.js'
import { useDrawer } from '../../contexts/DrawerContext'


const AdminUsers = () => {
  const { openDrawer } = useDrawer()
  const {
    users,
    loading,
    error,
    populateTestData,
    clearAllData
  } = useUsers()

  const [selectedUsers, setSelectedUsers] = useState([])



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
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medici</h1>
          <p className="text-muted-foreground">Gestionează medicii sistemului</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePopulateTestData}
            className="btn btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Date Test
          </button>
          <button 
            onClick={() => openDrawer({ type: 'medic' })} 
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Medic nou
          </button>
        </div>
      </div>





      {/* Lista utilizatori */}
      <div className="card">
        <div className="card-content p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Se încarcă utilizatorii...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">Eroare: {error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există medici</h3>
              <p className="text-muted-foreground mb-4">Începe prin a adăuga primul medic.</p>
              <button 
                onClick={() => openDrawer({ type: 'medic' })}
                className="btn btn-primary"
              >
                Adaugă medic
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Nume</th>
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Zile Serviciu</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'nurse' ? 'bg-green-100 text-green-700' :
                          user.role === 'specialist' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'resident' ? 'bg-orange-100 text-orange-700' :
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'doctor' ? 'Medic' :
                           user.role === 'nurse' ? 'Asistent' :
                           user.role === 'specialist' ? 'Specialist' :
                           user.role === 'resident' ? 'Rezident' :
                           user.role === 'admin' ? 'Admin' : user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.dutyDays?.map((day, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {day}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-700' :
                          user.status === 'inactive' ? 'bg-red-100 text-red-700' :
                          user.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.statusText}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDrawer({ type: 'medic', data: user })}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Editează"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDrawer({ type: 'medic', data: user })}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Vezi detalii"
                          >
                            <Eye className="h-4 w-4" />
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
