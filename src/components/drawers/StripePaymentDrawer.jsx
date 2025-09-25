import { useState } from 'react'
import { CreditCard, Key, Globe, Shield, AlertTriangle, CheckCircle, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import useSettingsStore from '../../stores/settingsStore'

const StripePaymentDrawer = ({ onClose }) => {
  const { stripePayment, updateStripePayment } = useSettingsStore()
  const [showKeys, setShowKeys] = useState({
    publishableKey: false,
    secretKey: false,
    webhookSecret: false
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)

  const handleKeyToggle = (keyType) => {
    setShowKeys(prev => ({
      ...prev,
      [keyType]: !prev[keyType]
    }))
  }

  const handleCopyKey = (keyType) => {
    const keyValue = stripePayment.apiKeys[keyType]
    if (keyValue) {
      navigator.clipboard.writeText(keyValue)
    }
  }

  const handleApiKeyChange = (keyType, value) => {
    updateStripePayment({
      apiKeys: {
        ...stripePayment.apiKeys,
        [keyType]: value
      }
    })
  }

  const handleSettingsChange = (settingKey, value) => {
    updateStripePayment({
      settings: {
        ...stripePayment.settings,
        [settingKey]: value
      }
    })
  }

  const handleWebhookChange = (settingKey, value) => {
    updateStripePayment({
      webhook: {
        ...stripePayment.webhook,
        [settingKey]: value
      }
    })
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus(null)

    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (stripePayment.apiKeys.publishableKey && stripePayment.apiKeys.secretKey) {
        setConnectionStatus('success')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      setConnectionStatus('error')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const paymentMethods = [
    { id: 'card', name: 'Card bancar', description: 'Visa, Mastercard, American Express' },
    { id: 'bank_transfer', name: 'Transfer bancar', description: 'Transfer direct din cont bancar' },
    { id: 'wallet', name: 'Portofel digital', description: 'Apple Pay, Google Pay' }
  ]

  const webhookEvents = [
    { id: 'payment_intent.succeeded', name: 'Plată reușită', description: 'Tranzacția a fost procesată cu succes' },
    { id: 'payment_intent.payment_failed', name: 'Plată eșuată', description: 'Tranzacția a eșuat' },
    { id: 'payment_intent.canceled', name: 'Plată anulată', description: 'Tranzacția a fost anulată' },
    { id: 'customer.created', name: 'Client creat', description: 'Un nou client a fost creat' },
    { id: 'invoice.payment_succeeded', name: 'Factură plătită', description: 'O factură a fost plătită' }
  ]

  return (
    <Drawer>
      <DrawerHeader>
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Configurare Stripe</h2>
            <p className="text-sm text-muted-foreground">
              Configurează integrarea cu Stripe pentru procesarea plăților online
            </p>
          </div>
        </div>
      </DrawerHeader>
      
      <DrawerContent>
        <div className="space-y-6">
          {/* API Keys Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Key className="h-5 w-5" />
                Chei API Stripe
              </h3>
              <p className="text-sm text-gray-600">
                Configurează cheile API pentru conectarea la Stripe
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Publishable Key */}
              <div className="space-y-2">
                <label htmlFor="publishableKey" className="text-sm font-medium">Cheie publică (Publishable Key)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="publishableKey"
                      type={showKeys.publishableKey ? 'text' : 'password'}
                      value={stripePayment.apiKeys.publishableKey}
                      onChange={(e) => handleApiKeyChange('publishableKey', e.target.value)}
                      placeholder="pk_test_..."
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded"
                      onClick={() => handleKeyToggle('publishableKey')}
                    >
                      {showKeys.publishableKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    onClick={() => handleCopyKey('publishableKey')}
                    disabled={!stripePayment.apiKeys.publishableKey}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Cheia publică poate fi afișată în codul frontend
                </p>
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <label htmlFor="secretKey" className="text-sm font-medium">Cheie secretă (Secret Key)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="secretKey"
                      type={showKeys.secretKey ? 'text' : 'password'}
                      value={stripePayment.apiKeys.secretKey}
                      onChange={(e) => handleApiKeyChange('secretKey', e.target.value)}
                      placeholder="sk_test_..."
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded"
                      onClick={() => handleKeyToggle('secretKey')}
                    >
                      {showKeys.secretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    onClick={() => handleCopyKey('secretKey')}
                    disabled={!stripePayment.apiKeys.secretKey}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-red-600">
                  ⚠️ Cheia secretă trebuie păstrată confidențială și folosită doar pe server
                </p>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-2">
                <label htmlFor="webhookSecret" className="text-sm font-medium">Webhook Secret</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="webhookSecret"
                      type={showKeys.webhookSecret ? 'text' : 'password'}
                      value={stripePayment.apiKeys.webhookSecret}
                      onChange={(e) => handleApiKeyChange('webhookSecret', e.target.value)}
                      placeholder="whsec_..."
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded"
                      onClick={() => handleKeyToggle('webhookSecret')}
                    >
                      {showKeys.webhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    onClick={() => handleCopyKey('webhookSecret')}
                    disabled={!stripePayment.apiKeys.webhookSecret}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Folosit pentru validarea webhook-urilor de la Stripe
                </p>
              </div>

              {/* Test Connection */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">Testare conexiune</p>
                  <p className="text-sm text-gray-600">
                    Verifică dacă cheile API sunt valide
                  </p>
                </div>
                <button
                  onClick={testConnection}
                  disabled={isTestingConnection || !stripePayment.apiKeys.publishableKey || !stripePayment.apiKeys.secretKey}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingConnection ? 'Testare...' : 'Testează conexiunea'}
                </button>
              </div>

              {/* Connection Status */}
              {connectionStatus && (
                <div className={`p-3 rounded-md border ${
                  connectionStatus === 'success' 
                    ? 'border-green-200 bg-green-50 text-green-700' 
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {connectionStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {connectionStatus === 'success' 
                        ? 'Conexiunea la Stripe a fost stabilită cu succes!' 
                        : 'Eroare la conectarea la Stripe. Verifică cheile API.'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5" />
                Setări plăți
              </h3>
              <p className="text-sm text-gray-600">
                Configurează opțiunile pentru procesarea plăților
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Enable Stripe */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Activează Stripe</label>
                  <p className="text-sm text-gray-600">
                    Activează procesarea plăților prin Stripe
                  </p>
                </div>
                <button
                  onClick={() => handleSettingsChange('enabled', !stripePayment.settings.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    stripePayment.settings.enabled ? 'bg-green-600' : 'bg-gray-300'
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      stripePayment.settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Test Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Mod test</label>
                  <p className="text-sm text-gray-600">
                    Folosește modul de test pentru plăți (recomandat pentru dezvoltare)
                  </p>
                </div>
                <button
                  onClick={() => handleSettingsChange('testMode', !stripePayment.settings.testMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    stripePayment.settings.testMode ? 'bg-green-600' : 'bg-gray-300'
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      stripePayment.settings.testMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Monedă</label>
                <select
                  value={stripePayment.settings.currency}
                  onChange={(e) => handleSettingsChange('currency', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="RON">RON - Leu românesc</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dolar american</option>
                  <option value="GBP">GBP - Lira sterlină</option>
                </select>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Metode de plată permise</label>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={method.id}
                      checked={stripePayment.settings.allowedMethods.includes(method.id)}
                      onChange={(e) => {
                        const currentMethods = stripePayment.settings.allowedMethods
                        const newMethods = e.target.checked
                          ? [...currentMethods, method.id]
                          : currentMethods.filter(m => m !== method.id)
                        handleSettingsChange('allowedMethods', newMethods)
                      }}
                      className="h-4 w-4 rounded border border-input bg-background"
                    />
                    <label htmlFor={method.id} className="flex-1">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Require Authentication */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Autentificare obligatorie</label>
                  <p className="text-sm text-gray-600">
                    Clienții trebuie să fie autentificați pentru a plăti
                  </p>
                </div>
                <button
                  onClick={() => handleSettingsChange('requireAuthentication', !stripePayment.settings.requireAuthentication)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    stripePayment.settings.requireAuthentication ? 'bg-green-600' : 'bg-gray-300'
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      stripePayment.settings.requireAuthentication ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5" />
                Configurare Webhook
              </h3>
              <p className="text-sm text-gray-600">
                Configurează webhook-urile pentru notificări în timp real
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Enable Webhooks */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Activează webhook-uri</label>
                  <p className="text-sm text-gray-600">
                    Primește notificări în timp real despre evenimente Stripe
                  </p>
                </div>
                <button
                  onClick={() => handleWebhookChange('enabled', !stripePayment.webhook.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    stripePayment.webhook.enabled ? 'bg-green-600' : 'bg-gray-300'
                  } cursor-pointer`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      stripePayment.webhook.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Webhook Endpoint */}
              {stripePayment.webhook.enabled && (
                <div className="space-y-2">
                  <label htmlFor="webhookEndpoint" className="text-sm font-medium">Endpoint webhook</label>
                  <input
                    id="webhookEndpoint"
                    value={stripePayment.webhook.endpoint}
                    onChange={(e) => handleWebhookChange('endpoint', e.target.value)}
                    placeholder="https://yourdomain.com/api/stripe/webhook"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <p className="text-xs text-gray-500">
                    URL-ul unde Stripe va trimite notificările
                  </p>
                </div>
              )}

              {/* Webhook Events */}
              {stripePayment.webhook.enabled && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Evenimente webhook</label>
                  {webhookEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event.id}
                        checked={stripePayment.webhook.events.includes(event.id)}
                        onChange={(e) => {
                          const currentEvents = stripePayment.webhook.events
                          const newEvents = e.target.checked
                            ? [...currentEvents, event.id]
                            : currentEvents.filter(ev => ev !== event.id)
                          handleWebhookChange('events', newEvents)
                        }}
                        className="h-4 w-4 rounded border border-input bg-background"
                      />
                      <label htmlFor={event.id} className="flex-1">
                        <div className="font-medium">{event.name}</div>
                        <div className="text-sm text-gray-600">{event.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Documentation Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">Documentație Stripe</p>
                <p className="text-sm text-blue-700">
                  Pentru mai multe informații despre configurarea Stripe
                </p>
              </div>
              <button className="px-3 py-2 border border-blue-300 rounded-md hover:bg-blue-100 text-sm text-blue-700">
                <ExternalLink className="h-4 w-4 mr-2 inline" />
                Vezi documentația
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
      
      <DrawerFooter>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Închide
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Salvează setările
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default StripePaymentDrawer