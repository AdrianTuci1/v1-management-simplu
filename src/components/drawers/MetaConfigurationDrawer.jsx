import React, { useState, useEffect } from 'react'
import { X, Facebook, Instagram, Clock, Save, RotateCcw, ExternalLink, MessageCircle } from 'lucide-react'
import { useExternalApiConfig } from '../../hooks/useExternalApiConfig.js'
import { externalServices } from '../../services/externalServices.js'
import { Drawer, DrawerHeader, DrawerContent, DrawerFooter } from '../ui/drawer.tsx'

const MetaConfigurationDrawer = ({ isOpen, onClose, locationId = 'default' }) => {
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
  const [hasChanges, setHasChanges] = useState(false)
  const [metaStatus, setMetaStatus] = useState({ authorized: false, loading: false })

  // Load configuration on mount
  useEffect(() => {
    if (isOpen) {
      const metaConfig = getLocalServiceConfig('meta', locationId)
      setConfig(metaConfig)
      setHasChanges(false)
      checkMetaStatus()
    }
  }, [isOpen, locationId, getLocalServiceConfig])

  // Initialize config with default if not loaded yet
  useEffect(() => {
    if (isOpen && !config) {
      const defaultConfig = externalServices.getDefaultServiceConfig('meta')
      setConfig(defaultConfig)
    }
  }, [isOpen, config])

  // Check Meta authorization status
  const checkMetaStatus = async () => {
    setMetaStatus(prev => ({ ...prev, loading: true }))
    try {
      const status = await checkServiceStatus('meta')
      setMetaStatus({ authorized: status.authorized, loading: false })
    } catch (err) {
      setMetaStatus({ authorized: false, loading: false })
    }
  }

  // Update configuration locally
  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    updateLocalConfig('meta', updates, locationId)
    setHasChanges(true)
  }

  // Save configuration
  const handleSave = async () => {
    try {
      await saveServiceConfig('meta', config, locationId)
      setHasChanges(false)
      // Show success message
    } catch (err) {
      console.error('Error saving Meta configuration:', err)
      // Show error message
    }
  }

  // Reset configuration
  const handleReset = () => {
    const defaultConfig = resetServiceConfig('meta', locationId)
    setConfig(defaultConfig)
    setHasChanges(false)
  }

  // Handle Meta authorization
  const handleMetaAuth = async () => {
    setMetaStatus(prev => ({ ...prev, loading: true }))
    try {
      await authorizeService('meta')
      // The page will redirect, so we don't need to update state here
    } catch (err) {
      console.error('Error authorizing Meta:', err)
      setMetaStatus(prev => ({ ...prev, loading: false }))
    }
  }

  // Toggle platform selection
  const togglePlatform = (platform) => {
    const updatedPlatforms = config.platforms.includes(platform)
      ? config.platforms.filter(p => p !== platform)
      : [...config.platforms, platform]
    updateConfig({ platforms: updatedPlatforms })
  }

  if (!isOpen || !config) return null

  return (
    <div className="relative inset-0 z-50 flex items-center justify-end h-full">
      <Drawer size="full" onClose={onClose} className="h-full">
        <DrawerHeader
          title="Configurație Meta"
          subtitle="Gestionează integrarea cu Facebook și Instagram"
          onClose={onClose}
        />

        <DrawerContent padding="spacious">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Meta Connection Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-lg">Conectare Meta</h3>
                <p className="text-gray-600 text-sm">Autorizează accesul la Facebook și Instagram</p>
              </div>
              <div className="flex items-center space-x-3">
                {metaStatus.loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                ) : metaStatus.authorized ? (
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

            {!metaStatus.authorized && (
              <button
                onClick={handleMetaAuth}
                disabled={metaStatus.loading}
                className="btn btn-outline btn-sm flex items-center space-x-2 disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                <span>{metaStatus.loading ? 'Se conectează...' : 'Conectează Meta'}</span>
              </button>
            )}
          </div>

          {/* Service Activation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-lg">Activare Meta</h3>
                <p className="text-gray-600 text-sm">Activează integrarea cu Facebook și Instagram</p>
              </div>
              <button
                onClick={() => updateConfig({ enabled: !config.enabled })}
                disabled={!metaStatus.authorized}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.enabled && metaStatus.authorized ? 'bg-blue-600' : 'bg-gray-300'
                } ${!metaStatus.authorized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.enabled && metaStatus.authorized ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!metaStatus.authorized && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-700 text-sm">
                  Trebuie să conectezi Meta pentru a activa serviciul.
                </p>
              </div>
            )}

            {config.enabled && metaStatus.authorized && (
              <div className="space-y-4">
                {/* Platform Selection */}
                <div>
                  <h4 className="font-medium mb-3">Platforme conectate:</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.platforms.includes('facebook')}
                        onChange={() => togglePlatform('facebook')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        <Facebook className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm">Facebook</span>
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.platforms.includes('instagram')}
                        onChange={() => togglePlatform('instagram')}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        <Instagram className="h-4 w-4 text-pink-600 mr-2" />
                        <span className="text-sm">Instagram</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Auto Reply Settings */}
          {config.enabled && metaStatus.authorized && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Răspuns Automat</h3>
              
              <div className="space-y-4">
                {/* Auto Reply Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Activează răspuns automat</h4>
                    <p className="text-sm text-gray-600">Răspunde automat la mesajele primite</p>
                  </div>
                  <button
                    onClick={() => updateConfig({ autoReply: !config.autoReply })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      config.autoReply ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        config.autoReply ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Reply Message */}
                {config.autoReply && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mesaj de răspuns
                    </label>
                    <textarea
                      value={config.replyMessage}
                      onChange={(e) => updateConfig({ replyMessage: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mulțumim pentru mesaj! Vă vom răspunde în cel mai scurt timp."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {config.replyMessage.length} caractere
                    </p>
                  </div>
                )}

                {/* Business Hours */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Respectă programul de lucru</h4>
                    <p className="text-sm text-gray-600">Răspunde doar în orele de program</p>
                  </div>
                  <button
                    onClick={() => updateConfig({ businessHours: !config.businessHours })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      config.businessHours ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        config.businessHours ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page Management */}
          {config.enabled && metaStatus.authorized && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Gestionare Pagini</h3>
              
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Facebook className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium">Pagina Facebook</span>
                    </div>
                    <span className="text-sm text-green-600">Conectată</span>
                  </div>
                  <p className="text-sm text-gray-600">Cabinet Medical Dr. Popescu</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Instagram className="h-5 w-5 text-pink-600 mr-2" />
                      <span className="font-medium">Cont Instagram</span>
                    </div>
                    <span className="text-sm text-green-600">Conectat</span>
                  </div>
                  <p className="text-sm text-gray-600">@cabinet_dr_popescu</p>
                </div>
              </div>
            </div>
          )}

          {/* Analytics */}
          {config.enabled && metaStatus.authorized && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Analiză</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">24</div>
                  <div className="text-sm text-gray-600">Mesaje primite</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">18</div>
                  <div className="text-sm text-gray-600">Mesaje răspunse</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">75%</div>
                  <div className="text-sm text-gray-600">Rate răspuns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">2.5h</div>
                  <div className="text-sm text-gray-600">Timp mediu răspuns</div>
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
              disabled={loading || !hasChanges || !metaStatus.authorized}
              className="btn btn-primary btn-sm flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Se salvează...' : 'Salvează'}</span>
            </button>
          </div>
        </DrawerFooter>
      </Drawer>
    </div>
  )
}

export default MetaConfigurationDrawer
