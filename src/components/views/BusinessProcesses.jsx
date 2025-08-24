import { RefreshCw, Plus, Power, PowerOff, Mail, MessageSquare, Mic, Facebook, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { useDrawer } from '../../contexts/DrawerContext'
import { useState } from 'react'

const BusinessProcesses = () => {
  const { openDrawer } = useDrawer();
  
  // State for service status
  const [services, setServices] = useState({
    voiceAgent: {
      name: 'Voice Agent',
      active: false,
      authorized: true, // Voice agent doesn't need external authorization
      status: 'inactive',
      description: 'Agent vocal pentru interacțiuni automate'
    },
    gmail: {
      name: 'Gmail',
      active: false,
      authorized: false,
      status: 'unauthorized',
      description: 'Integrare cu Gmail pentru comunicări automate'
    },
    meta: {
      name: 'Meta',
      active: false,
      authorized: false,
      status: 'unauthorized',
      description: 'Integrare cu Facebook și Instagram'
    },
    sms: {
      name: 'SMS',
      active: false,
      authorized: true, // SMS doesn't need external authorization
      status: 'inactive',
      description: 'Serviciu de mesaje SMS automate'
    }
  });

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
  const handleAuthorization = (serviceKey) => {
    // Simulate authorization process
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        authorized: true,
        status: 'authorized'
      }
    }));
  };

  // Get status icon and color
  const getStatusInfo = (service) => {
    if (service.active) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Procese</h1>
          <p className="text-muted-foreground">Gestionează serviciile și integrarea cu platforme externe</p>
        </div>
        <button onClick={() => openDrawer({ type: 'new-process' })} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Proces nou
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(services).map(([key, service]) => {
          const StatusIcon = getStatusInfo(service).icon;
          const ServiceIcon = getServiceIcon(key);
          
          return (
            <div key={key} className="card">
              <div className="card-content p-6">
                {/* Service Header */}
                <div className="flex items-center justify-between mb-4">
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
                </div>

                {/* Service Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {service.description}
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Toggle Switch */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
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
                  </div>

                  {/* Authorization Button (only for Gmail and Meta) */}
                  {(key === 'gmail' || key === 'meta') && !service.authorized && (
                    <button
                      onClick={() => handleAuthorization(key)}
                      className="w-full btn btn-outline btn-sm flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Autorizează {service.name}</span>
                    </button>
                  )}

                  {/* Re-authorize Button (for authorized but inactive services) */}
                  {(key === 'gmail' || key === 'meta') && service.authorized && !service.active && (
                    <button
                      onClick={() => handleAuthorization(key)}
                      className="w-full btn btn-outline btn-sm flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Re-autorizează</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Process Management */}
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Workflow-uri și Procese</h3>
            <p className="text-muted-foreground mb-4">
              Gestionează workflow-urile și procesele automate pentru serviciile activate.
            </p>
            <button onClick={() => openDrawer({ type: 'new-process' })} className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Creează Workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessProcesses
