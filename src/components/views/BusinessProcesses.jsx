import { Power, Mail, MessageSquare, Mic, Facebook, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import externalApiService from '../../services/externalApiService'

const BusinessProcesses = () => {
  
  // State for service status
  const [services, setServices] = useState({
    voiceAgent: {
      name: 'Voice Agent',
      active: false,
      authorized: true, // Voice agent doesn't need external authorization
      status: 'inactive',
      description: 'Agent vocal pentru interacțiuni automate',
      loading: false,
      error: null
    },
    gmail: {
      name: 'Gmail',
      active: false,
      authorized: false,
      status: 'unauthorized',
      description: 'Integrare cu Gmail pentru comunicări automate',
      loading: false,
      error: null
    },
    meta: {
      name: 'Meta',
      active: false,
      authorized: false,
      status: 'unauthorized',
      description: 'Integrare cu Facebook și Instagram',
      loading: false,
      error: null
    },
    sms: {
      name: 'SMS',
      active: false,
      authorized: true, // SMS doesn't need external authorization
      status: 'inactive',
      description: 'Serviciu de mesaje SMS automate',
      loading: false,
      error: null
    }
  });

  // Loading state for checking all services
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check service status on component mount
  useEffect(() => {
    checkAllServicesStatus();
  }, []);

  // Check all services authorization status
  const checkAllServicesStatus = async () => {
    setCheckingStatus(true);
    try {
      const statusResults = await externalApiService.checkAllServicesStatus();
      
      setServices(prev => {
        const updated = { ...prev };
        
        // Update Gmail status
        if (statusResults.gmail) {
          updated.gmail = {
            ...updated.gmail,
            authorized: statusResults.gmail.authorized,
            status: statusResults.gmail.authorized ? 'authorized' : 'unauthorized',
            error: statusResults.gmail.error || null
          };
        }
        
        // Update Meta status
        if (statusResults.meta) {
          updated.meta = {
            ...updated.meta,
            authorized: statusResults.meta.authorized,
            status: statusResults.meta.authorized ? 'authorized' : 'unauthorized',
            error: statusResults.meta.error || null
          };
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Error checking services status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Handle service toggle
  const toggleService = (serviceKey) => {
    setServices(prev => {
      const service = prev[serviceKey];
      const newActive = !service.active;
      
      // Check if service can be activated
      if (newActive && !service.authorized) {
        return prev; // Don't activate if not authorized
      }
      
      return {
        ...prev,
        [serviceKey]: {
          ...service,
          active: newActive,
          status: newActive ? 'active' : 'inactive'
        }
      };
    });
  };

  // Handle authorization
  const handleAuthorization = async (serviceKey) => {
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        loading: true,
        error: null
      }
    }));

    try {
      if (serviceKey === 'gmail') {
        await externalApiService.connectGmail();
        // Note: The page will redirect, so we don't need to update state here
      } else if (serviceKey === 'meta') {
        await externalApiService.connectMeta();
        // Note: The page will redirect, so we don't need to update state here
      } else if (serviceKey === 'voiceAgent') {
        // Handle voice agent session creation
        const ephemeralKey = await externalApiService.createElevenLabsSession();
        console.log('ElevenLabs session created with key:', ephemeralKey);
        
        setServices(prev => ({
          ...prev,
          [serviceKey]: {
            ...prev[serviceKey],
            loading: false,
            authorized: true,
            status: 'authorized'
          }
        }));
      }
    } catch (error) {
      console.error(`Error authorizing ${serviceKey}:`, error);
      setServices(prev => ({
        ...prev,
        [serviceKey]: {
          ...prev[serviceKey],
          loading: false,
          error: error.message
        }
      }));
    }
  };

  // Get status icon and color
  const getStatusInfo = (service) => {
    if (service.loading) {
      return { icon: Loader2, color: 'text-blue-500', text: 'Se conectează...' };
    } else if (service.error) {
      return { icon: XCircle, color: 'text-red-500', text: 'Eroare' };
    } else if (service.active) {
      return { icon: CheckCircle, color: 'text-green-500', text: 'Activ' };
    } else if (service.authorized) {
      return { icon: AlertCircle, color: 'text-yellow-500', text: 'Autorizat' };
    } else {
      return { icon: XCircle, color: 'text-red-500', text: 'Neautorizat' };
    }
  };

  // Get service icon
  const getServiceIcon = (serviceKey) => {
    switch (serviceKey) {
      case 'voiceAgent': return Mic;
      case 'gmail': return Mail;
      case 'meta': return Facebook;
      case 'sms': return MessageSquare;
      default: return Power;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Servicii</h1>
        <p className="text-muted-foreground">Gestionează serviciile și integrarea cu platforme externe</p>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {Object.entries(services).map(([key, service]) => {
          const StatusIcon = getStatusInfo(service).icon;
          const ServiceIcon = getServiceIcon(key);
          
          return (
            <div key={key} className="card">
              <div className="card-content p-4">
                <div className="flex items-center justify-between">
                  {/* Service Info */}
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${service.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <ServiceIcon className={`h-5 w-5 ${service.active ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`h-4 w-4 ${getStatusInfo(service).color}`} />
                        <span className={`text-sm ${getStatusInfo(service).color}`}>
                          {getStatusInfo(service).text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleService(key)}
                      disabled={!service.authorized}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        service.active ? 'bg-green-600' : 'bg-gray-300'
                      } ${!service.authorized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          service.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Authorization Button */}
                    {((key === 'gmail' || key === 'meta') && !service.authorized) || (key === 'voiceAgent' && !service.authorized) ? (
                      <button
                        onClick={() => handleAuthorization(key)}
                        disabled={service.loading}
                        className="btn btn-outline btn-sm flex items-center space-x-2 disabled:opacity-50"
                      >
                        {service.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        <span>
                          {service.loading ? 'Se conectează...' : `Autorizează`}
                        </span>
                      </button>
                    ) : null}

                    {/* Re-authorize Button */}
                    {(key === 'gmail' || key === 'meta') && service.authorized && !service.active && !service.loading && (
                      <button
                        onClick={() => handleAuthorization(key)}
                        className="btn btn-outline btn-sm flex items-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Re-autorizează</span>
                      </button>
                    )}

                    {/* Voice Agent Session Button */}
                    {key === 'voiceAgent' && service.authorized && !service.loading && (
                      <button
                        onClick={() => handleAuthorization(key)}
                        className="btn btn-outline btn-sm flex items-center space-x-2"
                      >
                        <Mic className="h-4 w-4" />
                        <span>Sesiune Voice</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  )
}

export default BusinessProcesses
