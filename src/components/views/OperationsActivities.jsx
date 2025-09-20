import { Activity, MessageSquare, Mic, Mail, Facebook, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

const OperationsActivities = () => {
  // Mock data pentru activitățile agentului
  const [activities] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minute în urmă
      action: 'POST',
      resourceType: 'appointment',
      service: 'sms',
      description: 'Batch SMS trimis pentru confirmare programări',
      details: '12 mesaje SMS trimise pentru confirmarea programărilor de mâine',
      status: 'success'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minute în urmă
      action: 'PATCH',
      resourceType: 'appointment',
      service: 'elevenLabs',
      description: 'Rezervare preluată telefonic',
      details: 'Pacientul a confirmat programarea prin apel vocal automat',
      status: 'success'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minute în urmă
      action: 'POST',
      resourceType: 'appointment',
      service: 'meta',
      description: 'Rezervare Instagram',
      details: 'Programare creată prin comentariu Instagram și confirmată automat',
      status: 'success'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minute în urmă
      action: 'POST',
      resourceType: 'email',
      service: 'gmail',
      description: 'Răspuns automat Gmail',
      details: 'Răspuns automat trimis la cererea de informații despre tratamente',
      status: 'success'
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 oră în urmă
      action: 'PATCH',
      resourceType: 'appointment',
      service: 'elevenLabs',
      description: 'Rezervare anulată telefonic',
      details: 'Pacientul a anulat programarea prin apel vocal automat',
      status: 'success'
    },
    {
      id: 6,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ore în urmă
      action: 'POST',
      resourceType: 'reminder',
      service: 'sms',
      description: 'Reminder SMS trimis',
      details: 'Mesaj de reamintire trimis pentru programarea de mâine',
      status: 'success'
    },
    {
      id: 7,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 ore în urmă
      action: 'POST',
      resourceType: 'appointment',
      service: 'meta',
      description: 'Rezervare Facebook',
      details: 'Programare creată prin mesaj privat Facebook',
      status: 'error'
    }
  ]);

  // Funcție pentru a obține iconița serviciului
  const getServiceIcon = (service) => {
    switch (service) {
      case 'sms': return MessageSquare;
      case 'elevenLabs': return Mic;
      case 'gmail': return Mail;
      case 'meta': return Facebook;
      default: return Activity;
    }
  };

  // Funcție pentru a obține culoarea și textul acțiunii
  const getActionInfo = (action) => {
    switch (action) {
      case 'POST': return { color: 'text-green-600', bgColor: 'bg-green-100', text: 'Creat' };
      case 'PATCH': return { color: 'text-blue-600', bgColor: 'bg-blue-100', text: 'Modificat' };
      case 'DELETE': return { color: 'text-red-600', bgColor: 'bg-red-100', text: 'Șters' };
      default: return { color: 'text-gray-600', bgColor: 'bg-gray-100', text: action };
    }
  };

  // Funcție pentru a formata timestamp-ul
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) {
      return `${minutes} min în urmă`;
    } else if (hours < 24) {
      return `${hours} ore în urmă`;
    } else {
      return timestamp.toLocaleDateString('ro-RO');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Activități Agent</h1>
        <p className="text-muted-foreground">
          Jurnalul acțiunilor automate realizate de agentul inteligent
        </p>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities.map((activity) => {
          const ServiceIcon = getServiceIcon(activity.service);
          const actionInfo = getActionInfo(activity.action);
          const StatusIcon = activity.status === 'success' ? CheckCircle : AlertCircle;
          
          return (
            <div key={activity.id} className="card">
              <div className="card-content p-6">
                <div className="flex items-center space-x-4">
                  {/* Service Icon */}
                  <div className={`flex-shrink-0 p-3 rounded-full ${activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <ServiceIcon className={`h-6 w-6 ${activity.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  
                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mt-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${actionInfo.bgColor} ${actionInfo.color}`}>
                        {actionInfo.text}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {activity.resourceType}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm font-medium text-gray-600">
                        {activity.service}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">
                      {activity.description}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {activity.details}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-xs">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500 font-medium">{formatTimestamp(activity.timestamp)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`h-4 w-4 ${activity.status === 'success' ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`font-medium ${activity.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {activity.status === 'success' ? 'Succes' : 'Eroare'}
                        </span>
                      </div>
                    </div>
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

export default OperationsActivities
