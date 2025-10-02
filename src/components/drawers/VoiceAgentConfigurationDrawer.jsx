import React, { useState, useEffect } from 'react'
import { X, Mic, Clock, Save, RotateCcw, Volume2, Play, Pause, Settings } from 'lucide-react'
import { useExternalApiConfig } from '../../hooks/useExternalApiConfig.js'
import { externalServices } from '../../services/externalServices.js'
import { Drawer, DrawerHeader, DrawerContent, DrawerFooter } from '../ui/drawer.tsx'

const VoiceAgentConfigurationDrawer = ({ isOpen, onClose, locationId = 'default' }) => {
  const {
    getLocalServiceConfig,
    saveServiceConfig,
    updateLocalConfig,
    resetServiceConfig,
    authorizeService,
    loading,
    error
  } = useExternalApiConfig()

  const [config, setConfig] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Available voice options (would come from API in real implementation)
  const voiceOptions = [
    { id: 'default', name: 'Voce Implicită', language: 'ro' },
    { id: 'male_ro', name: 'Voce Masculină (RO)', language: 'ro' },
    { id: 'female_ro', name: 'Voce Feminină (RO)', language: 'ro' },
    { id: 'professional_ro', name: 'Voce Profesională (RO)', language: 'ro' }
  ]

  // Available languages
  const languageOptions = [
    { code: 'ro', name: 'Română' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ]

  // Load configuration on mount
  useEffect(() => {
    if (isOpen) {
      const voiceConfig = getLocalServiceConfig('voiceAgent', locationId)
      setConfig(voiceConfig)
      setHasChanges(false)
    }
  }, [isOpen, locationId, getLocalServiceConfig])

  // Initialize config with default if not loaded yet
  useEffect(() => {
    if (isOpen && !config) {
      const defaultConfig = externalServices.getDefaultServiceConfig('voiceAgent')
      setConfig(defaultConfig)
    }
  }, [isOpen, config])

  // Update configuration locally
  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    updateLocalConfig('voiceAgent', updates, locationId)
    setHasChanges(true)
  }

  // Save configuration
  const handleSave = async () => {
    try {
      await saveServiceConfig('voiceAgent', config, locationId)
      setHasChanges(false)
      // Show success message
    } catch (err) {
      console.error('Error saving Voice Agent configuration:', err)
      // Show error message
    }
  }

  // Reset configuration
  const handleReset = () => {
    const defaultConfig = resetServiceConfig('voiceAgent', locationId)
    setConfig(defaultConfig)
    setHasChanges(false)
  }

  // Handle voice agent authorization/session creation
  const handleAuthorize = async () => {
    setIsAuthorizing(true)
    try {
      const sessionKey = await authorizeService('voiceAgent')
      console.log('Voice Agent session created:', sessionKey)
      // Show success message
    } catch (err) {
      console.error('Error creating voice session:', err)
      // Show error message
    } finally {
      setIsAuthorizing(false)
    }
  }

  // Test voice (placeholder)
  const testVoice = () => {
    setIsPlaying(true)
    // In real implementation, this would play the greeting message with current settings
    setTimeout(() => setIsPlaying(false), 3000)
  }

  if (!isOpen || !config) return null

  return (
    <div className="relative inset-0 bg-opacity-50 z-50 flex items-center justify-end h-full">
      <Drawer size="full" onClose={onClose} className="h-full">
        <DrawerHeader
          title="Configurație Voice Agent"
          subtitle="Gestionează agentul vocal automat"
          onClose={onClose}
        />

        <DrawerContent padding="spacious">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Service Activation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-lg">Activare Voice Agent</h3>
                  <p className="text-gray-600 text-sm">Activează agentul vocal pentru interacțiuni automate</p>
                </div>
                <button
                  onClick={() => updateConfig({ enabled: !config.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.enabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Session Management */}
            {config.enabled && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Sesiune Voice Agent</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Creează o sesiune pentru a folosi agentul vocal
                </p>
                <button
                  onClick={handleAuthorize}
                  disabled={isAuthorizing}
                  className="btn btn-outline btn-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  {isAuthorizing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  <span>{isAuthorizing ? 'Se creează sesiunea...' : 'Creează Sesiune'}</span>
                </button>
              </div>
            )}

            {/* Basic Settings */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Setări de bază</h3>
              <div className="space-y-4">
                {/* Voice Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Voce
                  </label>
                  <select
                    value={config.voiceId}
                    onChange={(e) => updateConfig({ voiceId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {voiceOptions.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Limbă
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => updateConfig({ language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Greeting Message */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mesaj de salut
                  </label>
                  <textarea
                    value={config.greetingMessage}
                    onChange={(e) => updateConfig({ greetingMessage: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Salut! Sunt asistentul vocal al {`{{businessName}}`}. Cu ce vă pot ajuta?"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Folosește {`{{businessName}}`} pentru numele afacerii
                  </p>
                </div>
              </div>
            </div>

            {/* Voice Settings */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Setări Voce</h3>
              
              <div className="space-y-4">
                {/* Speed */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Viteză: {config.settings.speed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.settings.speed}
                    onChange={(e) => updateConfig({
                      settings: { ...config.settings, speed: parseFloat(e.target.value) }
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5x</span>
                    <span>2.0x</span>
                  </div>
                </div>

                {/* Pitch */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ton: {config.settings.pitch}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.settings.pitch}
                    onChange={(e) => updateConfig({
                      settings: { ...config.settings, pitch: parseFloat(e.target.value) }
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5x</span>
                    <span>2.0x</span>
                  </div>
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Volum: {Math.round(config.settings.volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={config.settings.volume}
                    onChange={(e) => updateConfig({
                      settings: { ...config.settings, volume: parseFloat(e.target.value) }
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Test Voice Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={testVoice}
                  disabled={isPlaying}
                  className="btn btn-outline btn-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>{isPlaying ? 'Se testează...' : 'Testează Vocea'}</span>
                </button>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-3">Setări avansate</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Răspuns automat</h4>
                    <p className="text-xs text-gray-600">Agentul răspunde automat la apeluri</p>
                  </div>
                  <button
                    onClick={() => updateConfig({ 
                      settings: { ...config.settings, autoAnswer: !config.settings.autoAnswer }
                    })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      config.settings.autoAnswer ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        config.settings.autoAnswer ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Înregistrare conversații</h4>
                    <p className="text-xs text-gray-600">Salvează conversațiile pentru analiză</p>
                  </div>
                  <button
                    onClick={() => updateConfig({ 
                      settings: { ...config.settings, recordConversations: !config.settings.recordConversations }
                    })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      config.settings.recordConversations ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        config.settings.recordConversations ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
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
  )
}

export default VoiceAgentConfigurationDrawer
