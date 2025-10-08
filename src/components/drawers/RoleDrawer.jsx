import { useState, useEffect } from 'react'
import { X, Save, Trash2, AlertCircle } from 'lucide-react'
import { useRoles } from '../../hooks/useRoles.js'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'

const RoleDrawer = ({ onClose, roleData = null, position = "side" }) => {
  const { addRole, updateRole, deleteRole } = useRoles()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    permissions: []
  })
  
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Resurse disponibile pentru permisiuni
  const availableResources = [
    { value: 'appointment', label: 'Programări' },
    { value: 'patient', label: 'Pacienți' },
    { value: 'medic', label: 'Medici' },
    { value: 'treatment', label: 'Tratamente' },
    { value: 'product', label: 'Produse' },
    { value: 'role', label: 'Roluri' },
    { value: 'report', label: 'Rapoarte' },
    { value: 'sale', label: 'Vânzări' },
    { value: 'dental-chart', label: 'Fișă Dentară' },
    { value: 'plan', label: 'Plan Tratament' },
    { value: 'setting', label: 'Setări' },
    { value: 'invoice-client', label: 'Clienți Facturare' },
    { value: 'invoice', label: 'Facturi' },
    { value: 'statistics', label: 'Statistici' },
    { value: 'recent-activities', label: 'Activități Recente' }
  ]

  const availableActions = [
    { value: 'read', label: 'Citire' },
    { value: 'create', label: 'Creare' },
    { value: 'update', label: 'Actualizare' },
    { value: 'patch', label: 'Modificare Parțială' },
    { value: 'delete', label: 'Ștergere' }
  ]



  // Încarcă datele rolului dacă este editare
  useEffect(() => {
    if (roleData) {
      setFormData({
        resourceId: roleData.resourceId || roleData.id,
        id: roleData.id || roleData.resourceId,
        name: roleData.name || '',
        description: roleData.description || '',
        status: roleData.status || 'active',
        permissions: roleData.permissions || [],
        createdAt: roleData.createdAt
      })
      setIsEditing(true)
    } else {
      // Reset form pentru rol nou
      setFormData({
        name: '',
        description: '',
        status: 'active',
        permissions: []
      })
      setIsEditing(false)
    }
  }, [roleData])

  // Validare formular simplă
  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError('Numele rolului este obligatoriu')
      return false
    }
    
    if (!formData.description?.trim()) {
      setError('Descrierea rolului este obligatorie')
      return false
    }
    
    setError(null)
    return true
  }

  // Salvare rol
  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    
    try {
      if (isEditing) {
        await updateRole(roleData.resourceId, formData)
      } else {
        await addRole(formData)
      }
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error saving role:', err)
    } finally {
      setLoading(false)
    }
  }

  // Ștergere rol
  const handleDelete = async () => {
    if (!isEditing || !roleData) return

    if (!confirm('Ești sigur că vrei să ștergi acest rol?')) return

    setLoading(true)
    setError(null)
    
    try {
      await deleteRole(roleData.resourceId)
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting role:', err)
    } finally {
      setLoading(false)
    }
  }

  // Gestionare permisiuni
  const togglePermission = (resource, action) => {
    const permissionKey = `${resource}:${action}`
    const existingPermission = formData.permissions.find(
      p => p === permissionKey
    )

    if (existingPermission) {
      // Șterge permisiunea
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permissionKey)
      }))
    } else {
      // Adaugă permisiunea
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionKey]
      }))
    }
  }

  // Verifică dacă o permisiune este activă
  const hasPermission = (resource, action) => {
    const permissionKey = `${resource}:${action}`
    return formData.permissions.includes(permissionKey)
  }

  // Selectare/deselectare toate permisiunile pentru o resursă
  const toggleAllPermissionsForResource = (resource) => {
    const resourcePermissions = formData.permissions.filter(p => p.startsWith(`${resource}:`))
    const allResourcePermissions = availableActions.map(action => `${resource}:${action.value}`)
    
    if (resourcePermissions.length === allResourcePermissions.length) {
      // Deselectează toate
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !p.startsWith(`${resource}:`))
      }))
    } else {
      // Selectează toate
      setFormData(prev => ({
        ...prev,
        permissions: [
          ...prev.permissions.filter(p => !p.startsWith(`${resource}:`)),
          ...allResourcePermissions
        ]
      }))
    }
  }

  // Verifică dacă toate permisiunile pentru o resursă sunt selectate
  const allPermissionsSelectedForResource = (resource) => {
    const resourcePermissions = formData.permissions.filter(p => p.startsWith(`${resource}:`))
    return resourcePermissions.length === availableActions.length
  }

  // Verifică dacă cel puțin o permisiune pentru o resursă este selectată
  const somePermissionsSelectedForResource = (resource) => {
    const resourcePermissions = formData.permissions.filter(p => p.startsWith(`${resource}:`))
    return resourcePermissions.length > 0 && resourcePermissions.length < availableActions.length
  }

  return (
    <Drawer onClose={onClose} size="default" position={position}>
      <DrawerHeader
        title={isEditing ? 'Editează Rol' : 'Rol Nou'}
        subtitle={isEditing ? 'Modifică detaliile rolului' : 'Creează un nou rol'}
        onClose={onClose}
        variant="default"
      />

      <DrawerContent padding="spacious">
        {/* Eroare generală */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Formular de bază */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Nume */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nume Rol *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ex: Administrator"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="active">Activ</option>
              <option value="inactive">Inactiv</option>
              <option value="archived">Arhivat</option>
            </select>
          </div>
        </div>

        {/* Descriere */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Descriere *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descrie responsabilitățile și accesul acestui rol..."
          />
        </div>

        {/* Permisiuni */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Permisiuni</h3>
            <span className="text-sm text-muted-foreground">
              {formData.permissions.length} permisiuni selectate
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {availableResources.map((resource) => (
              <div key={resource.value} className="border rounded-lg p-4">
                {/* Header resursă */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={allPermissionsSelectedForResource(resource.value)}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = somePermissionsSelectedForResource(resource.value)
                        }
                      }}
                      onChange={() => toggleAllPermissionsForResource(resource.value)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="font-medium text-gray-900">{resource.label}</span>
                  </div>
                </div>

                {/* Acțiuni pentru această resursă */}
                <div className="space-y-2">
                  {availableActions.map((action) => (
                    <div key={action.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={hasPermission(resource.value, action.value)}
                        onChange={() => togglePermission(resource.value, action.value)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{action.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>

      <DrawerFooter variant="default">
        <div className="flex items-center space-x-4">
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Șterge</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEditing ? 'Actualizează' : 'Creează'}</span>
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default RoleDrawer
