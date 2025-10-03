import React, { useState, useEffect } from 'react'
import { X, Plus, Edit2, Trash2, MessageSquare, Clock, Calendar, Save, RotateCcw } from 'lucide-react'
import { useExternalApiConfig } from '../../hooks/useExternalApiConfig.js'
import { externalServices } from '../../services/externalServices.js'
import { Drawer, DrawerHeader, DrawerContent, DrawerFooter } from '../ui/drawer.tsx'

const SMSConfigurationDrawer = ({ isOpen, onClose, locationId = 'default' }) => {
  const {
    getLocalServiceConfig,
    saveServiceConfig,
    updateLocalConfig,
    resetServiceConfig,
    loading,
    error
  } = useExternalApiConfig()

  const [config, setConfig] = useState(null)
  const [templateModal, setTemplateModal] = useState({ visible: false, template: null })
  const [hasChanges, setHasChanges] = useState(false)

  // Template variables available for SMS
  const templateVariables = [
    { name: 'patientName', description: 'Numele pacientului' },
    { name: 'appointmentDate', description: 'Data programării' },
    { name: 'appointmentTime', description: 'Ora programării' },
    { name: 'businessName', description: 'Numele afacerii' },
    { name: 'locationName', description: 'Numele locației' },
    { name: 'serviceName', description: 'Numele serviciului' },
    { name: 'doctorName', description: 'Numele doctorului' },
    { name: 'phoneNumber', description: 'Numărul de telefon' }
  ]

  // Load configuration on mount
  useEffect(() => {
    if (isOpen) {
      const smsConfig = getLocalServiceConfig('sms', locationId)
      setConfig(smsConfig)
      setHasChanges(false)
    }
  }, [isOpen, locationId, getLocalServiceConfig])

  // Initialize config with default if not loaded yet
  useEffect(() => {
    if (isOpen && !config) {
      const defaultConfig = externalServices.getDefaultServiceConfig('sms')
      setConfig(defaultConfig)
    }
  }, [isOpen, config])

  // Update configuration locally
  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    updateLocalConfig('sms', updates, locationId)
    setHasChanges(true)
  }

  // Save configuration
  const handleSave = async () => {
    try {
      await saveServiceConfig('sms', config, locationId)
      setHasChanges(false)
      // Show success message
    } catch (err) {
      console.error('Error saving SMS configuration:', err)
      // Show error message
    }
  }

  // Reset configuration
  const handleReset = () => {
    const defaultConfig = resetServiceConfig('sms', locationId)
    setConfig(defaultConfig)
    setHasChanges(false)
  }

  // Template management
  const addTemplate = () => {
    setTemplateModal({ visible: true, template: null })
  }

  const editTemplate = (template) => {
    setTemplateModal({ visible: true, template })
  }

  const deleteTemplate = (templateId) => {
    if (templateId === 'default') return // Can't delete default template
    
    const updatedTemplates = config.templates.filter(t => t.id !== templateId)
    let defaultTemplate = config.defaultTemplate
    
    if (defaultTemplate === templateId && updatedTemplates.length > 0) {
      defaultTemplate = updatedTemplates[0].id
    }
    
    updateConfig({ templates: updatedTemplates, defaultTemplate })
  }

  const saveTemplate = (template) => {
    if (templateModal.template) {
      // Edit existing template
      const updatedTemplates = config.templates.map(t => 
        t.id === templateModal.template.id ? template : t
      )
      updateConfig({ templates: updatedTemplates })
    } else {
      // Add new template
      const newTemplate = {
        ...template,
        id: `template_${Date.now()}`
      }
      updateConfig({ 
        templates: [...config.templates, newTemplate] 
      })
    }
    setTemplateModal({ visible: false, template: null })
  }

  if (!isOpen || !config) return null

  return (
    <>
      <div className="relative inset-0 bg-opacity-50 z-50 flex items-center justify-end h-full">
        <Drawer size="full" onClose={onClose} className="h-full">
          <DrawerHeader
            title="Configurație SMS"
            subtitle="Gestionează mesajele SMS automate"
            onClose={onClose}
          />

          <DrawerContent padding="spacious">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Service Status */}
            <div className="bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-lg">Status Serviciu SMS</h3>
                  <p className="text-gray-600 text-sm">Serviciul este gestionat din pagina principală</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center ${config.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${config.enabled ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-medium">
                      {config.enabled ? 'Activat' : 'Dezactivat'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* When to send messages */}
                <div>
                  <h4 className="font-medium mb-3">Când trimite mesaje:</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.sendOnBooking}
                        onChange={(e) => updateConfig({ sendOnBooking: e.target.checked })}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm">La crearea programării</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.sendReminder}
                        onChange={(e) => updateConfig({ sendReminder: e.target.checked })}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm">Reminder</span>
                    </label>
                  </div>
                </div>

                {/* Reminder timing */}
                {config.sendReminder && (
                  <div>
                    <h4 className="font-medium mb-2">Când trimite reminder:</h4>
                    <select
                      value={config.reminderTiming}
                      onChange={(e) => updateConfig({ reminderTiming: e.target.value })}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="day_before">Cu o zi înainte</option>
                      <option value="same_day">În ziua respectivă</option>
                      <option value="both">Ambele</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white rounded-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg">Template-uri SMS</h3>
                  <button
                    onClick={addTemplate}
                    className="btn btn-outline btn-sm flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adaugă Template</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {config.templates.map(template => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.id === config.defaultTemplate && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              Implicit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editTemplate(template)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {template.id !== 'default' && (
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{template.content}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {template.content.length} caractere
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {template.variables?.length || 0} variabile
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            {/* Advanced Settings */}
            <div className="bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-3">Setări avansate</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Template implicit
                    </label>
                    <select
                      value={config.defaultTemplate}
                      onChange={(e) => updateConfig({ defaultTemplate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {config.templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
          </DrawerContent>

          <DrawerFooter>
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <span className="text-sm text-orange-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Modificări nesalvate
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                disabled={loading}
                className="btn btn-outline btn-sm flex items-center space-x-2 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !hasChanges}
                className="btn btn-primary btn-sm flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Se salvează...' : 'Salvează'}</span>
              </button>
            </div>
          </DrawerFooter>
        </Drawer>
      </div>

      {/* Template Modal */}
      {templateModal.visible && (
        <TemplateModal
          template={templateModal.template}
          variables={templateVariables}
          onSave={saveTemplate}
          onCancel={() => setTemplateModal({ visible: false, template: null })}
        />
      )}
    </>
  )
}

// Template Modal Component
const TemplateModal = ({ template, variables, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    variables: []
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        content: template.content || '',
        variables: template.variables || []
      })
    } else {
      setFormData({
        name: '',
        content: '',
        variables: []
      })
    }
  }, [template])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.content) return
    
    onSave(formData)
  }

  const insertVariable = (variable) => {
    const currentContent = formData.content
    const newContent = currentContent + `{{${variable}}}`
    setFormData(prev => ({ ...prev, content: newContent }))
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center h-full">
      <Drawer size="xl" onClose={onCancel} className="max-h-[90vh]">
        <DrawerHeader
          title={template ? 'Editează Template' : 'Adaugă Template'}
          onClose={onCancel}
        />

        <form onSubmit={handleSubmit}>
          <DrawerContent padding="spacious">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nume Template
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ex: Confirmare programare"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Conținut Mesaj
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ex: Salut {{patientName}}! Programarea ta la {{businessName}} este confirmată pentru {{appointmentDate}} la ora {{appointmentTime}}."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length} caractere
            </p>
          </div>

          {/* Variables */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Variabile disponibile:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {variables.map(variable => (
                <button
                  key={variable.name}
                  type="button"
                  onClick={() => insertVariable(variable.name)}
                  className="text-left p-2 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">{`{{${variable.name}}}`}</span>
                  <p className="text-gray-600 text-xs">{variable.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Variabile folosite
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.variables.map(variable => (
                <span
                  key={variable}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {`{{${variable}}}`}
                </span>
              ))}
            </div>
            </div>
          </DrawerContent>

          <DrawerFooter>
            <div></div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-outline btn-sm"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                Salvează
              </button>
            </div>
          </DrawerFooter>
        </form>
      </Drawer>
    </div>
  )
}

export default SMSConfigurationDrawer
