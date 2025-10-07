import React, { useState, useEffect } from 'react'
import { X, Plus, Edit2, Trash2, Mail, Clock, Calendar, Save, RotateCcw, ExternalLink } from 'lucide-react'
import { useExternalApiConfig } from '../../hooks/useExternalApiConfig.js'
import { externalServices } from '../../services/externalServices.js'
import { Drawer, DrawerHeader, DrawerContent, DrawerFooter } from '../ui/drawer.tsx'

const EmailConfigurationDrawer = ({ isOpen, onClose }) => {
  const {
    getLocalServiceConfig,
    saveServiceConfig,
    updateLocalConfig,
    resetServiceConfig,
    checkServiceStatus,
    authorizeService,
    loading,
    error
  } = useExternalApiConfig()

  const [config, setConfig] = useState(null)
  const [templateModal, setTemplateModal] = useState({ visible: false, template: null })
  const [hasChanges, setHasChanges] = useState(false)
  const [gmailStatus, setGmailStatus] = useState({ authorized: false, loading: false })

  // Template variables available for Email
  const templateVariables = [
    { name: 'patientName', description: 'Numele pacientului' },
    { name: 'appointmentDate', description: 'Data programării' },
    { name: 'appointmentTime', description: 'Ora programării' },
    { name: 'businessName', description: 'Numele afacerii' },
    { name: 'locationName', description: 'Numele locației' },
    { name: 'serviceName', description: 'Numele serviciului' },
    { name: 'doctorName', description: 'Numele doctorului' },
    { name: 'patientEmail', description: 'Email-ul pacientului' },
    { name: 'businessEmail', description: 'Email-ul afacerii' }
  ]

  // Load configuration on mount
  useEffect(() => {
    if (isOpen) {
      const emailConfig = getLocalServiceConfig('email')
      setConfig(emailConfig)
      setHasChanges(false)
      checkGmailStatus()
    }
  }, [isOpen, getLocalServiceConfig])

  // Initialize config with default if not loaded yet
  useEffect(() => {
    if (isOpen && !config) {
      const defaultConfig = externalServices.getDefaultServiceConfig('email')
      setConfig(defaultConfig)
    }
  }, [isOpen, config])

  // Check Gmail authorization status
  const checkGmailStatus = async () => {
    setGmailStatus(prev => ({ ...prev, loading: true }))
    try {
      const status = await checkServiceStatus('gmail')
      setGmailStatus({ authorized: status.authorized, loading: false })
    } catch (err) {
      setGmailStatus({ authorized: false, loading: false })
    }
  }

  // Update configuration locally
  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    updateLocalConfig('email', updates)
    setHasChanges(true)
  }

  // Save configuration
  const handleSave = async () => {
    try {
      // Exclude 'enabled' and 'templates' from the config being saved
      // 'enabled' is managed from the main page toggle
      // 'templates' are managed through dedicated API endpoints
      const { enabled, templates, ...configToSave } = config
      
      await saveServiceConfig('email', configToSave)
      setHasChanges(false)
      console.log('Email configuration saved successfully')
      // Show success message
    } catch (err) {
      console.error('Error saving Email configuration:', err)
      // Show error message
    }
  }

  // Reset configuration
  const handleReset = () => {
    const defaultConfig = resetServiceConfig('email')
    setConfig(defaultConfig)
    setHasChanges(false)
  }

  // Handle Gmail authorization
  const handleGmailAuth = async () => {
    setGmailStatus(prev => ({ ...prev, loading: true }))
    try {
      await authorizeService('gmail')
      // The page will redirect, so we don't need to update state here
    } catch (err) {
      console.error('Error authorizing Gmail:', err)
      setGmailStatus(prev => ({ ...prev, loading: false }))
    }
  }

  // Template management
  const addTemplate = () => {
    setTemplateModal({ visible: true, template: null })
  }

  const editTemplate = (template) => {
    setTemplateModal({ visible: true, template })
  }

  const deleteTemplate = async (templateId) => {
    if (templateId === 'default') return // Can't delete default template
    
    try {
      await externalServices.deleteEmailTemplate(templateId)
      
      // Update local state without marking as changed (already saved to server)
      const updatedTemplates = config.templates.filter(t => t.id !== templateId)
      let defaultTemplate = config.defaultTemplate
      
      if (defaultTemplate === templateId && updatedTemplates.length > 0) {
        defaultTemplate = updatedTemplates[0].id
      }
      
      setConfig(prev => ({ ...prev, templates: updatedTemplates, defaultTemplate }))
      console.log('Email template deleted successfully')
    } catch (error) {
      console.error('Error deleting Email template:', error)
    }
  }

  const saveTemplate = async (template) => {
    try {
      if (templateModal.template) {
        // Edit existing template
        await externalServices.updateEmailTemplate(templateModal.template.id, template)
        
        // Update local state without marking as changed (already saved to server)
        const updatedTemplates = config.templates.map(t => 
          t.id === templateModal.template.id ? { ...template, id: templateModal.template.id } : t
        )
        setConfig(prev => ({ ...prev, templates: updatedTemplates }))
        console.log('Email template updated successfully')
      } else {
        // Add new template
        const newTemplate = {
          ...template,
          id: `template_${Date.now()}`
        }
        
        await externalServices.addEmailTemplate(newTemplate)
        
        // Update local state without marking as changed (already saved to server)
        setConfig(prev => ({ ...prev, templates: [...prev.templates, newTemplate] }))
        console.log('Email template added successfully')
      }
      setTemplateModal({ visible: false, template: null })
    } catch (error) {
      console.error('Error saving Email template:', error)
      // You could show an error toast here
    }
  }

  if (!isOpen || !config) return null

  return (
    <>
      <div className="relative h-full inset-0 bg-opacity-50 z-50 flex items-center justify-end">
        <Drawer size="full" onClose={onClose} className="h-full relative">
          <DrawerHeader
            title="Configurație Email"
            subtitle="Gestionează email-urile automate"
            onClose={onClose}
          />

          <DrawerContent padding="spacious">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Gmail Connection Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-lg">Conectare Gmail</h3>
                  <p className="text-gray-600 text-sm">Autorizează accesul la Gmail pentru trimiterea email-urilor</p>
                </div>
                <div className="flex items-center space-x-3">
                  {gmailStatus.loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : gmailStatus.authorized ? (
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Conectat</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Neconectat</span>
                    </div>
                  )}
                </div>
              </div>

              {!gmailStatus.authorized && (
                <button
                  onClick={handleGmailAuth}
                  disabled={gmailStatus.loading}
                  className="btn btn-outline btn-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{gmailStatus.loading ? 'Se conectează...' : 'Conectează Gmail'}</span>
                </button>
              )}
            </div>



            {/* Templates */}
            {gmailStatus.authorized && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg">Template-uri Email</h3>
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
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Subiect: {template.subject}</p>
                        <p className="text-gray-600 text-sm">{template.content}</p>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
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
            )}

            {/* Advanced Settings */}
            {gmailStatus.authorized && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-3">Setări avansate</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Template implicit
                    </label>
                    <select
                      value={config.defaultTemplate}
                      onChange={(e) => updateConfig({ defaultTemplate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            )}
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

          {/* Template Modal */}
          {templateModal.visible && (
            <EmailTemplateModal
              template={templateModal.template}
              variables={templateVariables}
              onSave={saveTemplate}
              onCancel={() => setTemplateModal({ visible: false, template: null })}
            />
          )}
        </Drawer>
      </div>
    </>
  )
}

// Email Template Modal Component
const EmailTemplateModal = ({ template, variables, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    variables: []
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        content: template.content || '',
        variables: template.variables || []
      })
    } else {
      setFormData({
        name: '',
        subject: '',
        content: '',
        variables: []
      })
    }
  }, [template])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.subject || !formData.content) return
    
    onSave(formData)
  }

  const insertVariable = (variable) => {
    const currentContent = formData.content
    const newContent = currentContent + `{{${variable}}}`
    setFormData(prev => ({ ...prev, content: newContent }))
  }

  return (
    <div className="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {template ? 'Editează Template Email' : 'Adaugă Template Email'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nume Template
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Confirmare programare"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Subiect Email
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Confirmare programare - {{businessName}}"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Conținut Email
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Salut {{patientName}},\n\nProgramarea ta la {{businessName}} este confirmată pentru {{appointmentDate}} la ora {{appointmentTime}}.\n\nTe așteptăm!\n\nCu respect,\nEchipa {{businessName}}"
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
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t">
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
        </form>
      </div>
    </div>
  )
}

export default EmailConfigurationDrawer
