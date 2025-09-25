import { Activity, MessageSquare, Mic, Mail, Facebook, Clock, CheckCircle, AlertCircle, Filter, Search, Calendar, Users, Phone, Mail as MailIcon, MessageCircle, Zap, Eye, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import ActivityDrawer from '../drawers/ActivityDrawer.jsx'

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
      status: 'success',
      priority: 'high',
      category: 'communication'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minute în urmă
      action: 'PATCH',
      resourceType: 'appointment',
      service: 'elevenLabs',
      description: 'Rezervare preluată telefonic',
      details: 'Pacientul a confirmat programarea prin apel vocal automat',
      status: 'success',
      priority: 'medium',
      category: 'appointment'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minute în urmă
      action: 'POST',
      resourceType: 'appointment',
      service: 'meta',
      description: 'Rezervare Instagram',
      details: 'Programare creată prin comentariu Instagram și confirmată automat',
      status: 'success',
      priority: 'medium',
      category: 'social'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minute în urmă
      action: 'POST',
      resourceType: 'email',
      service: 'gmail',
      description: 'Răspuns automat Gmail',
      details: 'Răspuns automat trimis la cererea de informații despre tratamente',
      status: 'success',
      priority: 'low',
      category: 'communication'
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 oră în urmă
      action: 'PATCH',
      resourceType: 'appointment',
      service: 'elevenLabs',
      description: 'Rezervare anulată telefonic',
      details: 'Pacientul a anulat programarea prin apel vocal automat',
      status: 'success',
      priority: 'high',
      category: 'appointment'
    },
    {
      id: 6,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ore în urmă
      action: 'POST',
      resourceType: 'reminder',
      service: 'sms',
      description: 'Reminder SMS trimis',
      details: 'Mesaj de reamintire trimis pentru programarea de mâine',
      status: 'success',
      priority: 'medium',
      category: 'communication'
    },
    {
      id: 7,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 ore în urmă
      action: 'POST',
      resourceType: 'appointment',
      service: 'meta',
      description: 'Rezervare Facebook',
      details: 'Programare creată prin mesaj privat Facebook',
      status: 'error',
      priority: 'high',
      category: 'social'
    }
  ]);

  // Obiect separat pentru datele detaliate - indexat după ID
  const [detailedData] = useState({
    1: {
      // Detalii specifice SMS
      smsDetails: {
        recipientCount: 12,
        messageTemplate: 'Confirmare programare pentru {{date}} la {{time}}',
        deliveryRate: 100,
        costPerSMS: 0.05,
        totalCost: 0.60,
        provider: 'Twilio',
        language: 'ro'
      },
      // Metadata tehnică
      technical: {
        duration: 250,
        apiCalls: 1,
        creditsUsed: 15,
        errorRate: 0,
        retryCount: 0
      },
      // Context
      context: {
        trigger: 'scheduled_batch',
        patientIds: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112],
        location: 'Clinică Centrală'
      }
    },
    2: {
      // Detalii specifice ElevenLabs
      elevenLabsDetails: {
        audioDuration: 125,
        voiceModel: 'Nova',
        language: 'ro',
        transcription: 'Da, confirm programarea pentru mâine la ora 10.',
        sentiment: 'positive',
        confidence: 0.92,
        costPerMinute: 0.30,
        totalCost: 0.0625
      },
      // Metadata tehnică
      technical: {
        duration: 890,
        apiCalls: 3,
        creditsUsed: 45,
        errorRate: 0,
        retryCount: 0
      },
      // Context
      context: {
        trigger: 'incoming_call',
        patientId: 203,
        appointmentId: 456,
        phoneNumber: '+40712345678'
      }
    },
    3: {
      // Detalii specifice Meta
      metaDetails: {
        platform: 'Instagram',
        postId: 'ig_7890123456789',
        commentText: '@clinica_mea vreau o programare pentru mâine',
        responseTime: 45,
        engagement: {
          likes: 2,
          replies: 0,
          shares: 0
        },
        userProfile: {
          followers: 150,
          verified: false,
          location: 'București'
        }
      },
      // Metadata tehnică
      technical: {
        duration: 320,
        apiCalls: 2,
        creditsUsed: 25,
        errorRate: 0,
        retryCount: 0
      },
      // Context
      context: {
        trigger: 'social_mention',
        patientId: 304,
        socialMediaId: 'ig_user_789',
        campaign: 'social_booking'
      }
    },
    4: {
      // Detalii specifice Gmail
      gmailDetails: {
        recipientEmail: 'pacient@email.com',
        subject: 'Informații despre tratamentele disponibile',
        templateUsed: 'treatment_info_template',
        attachments: ['price_list.pdf', 'treatment_options.pdf'],
        openRate: 0,
        clickRate: 0,
        responseTime: 120
      },
      // Metadata tehnică
      technical: {
        duration: 180,
        apiCalls: 1,
        creditsUsed: 8,
        errorRate: 0,
        retryCount: 0
      },
      // Context
      context: {
        trigger: 'email_inquiry',
        patientId: 405,
        inquiryType: 'treatment_info',
        sourceEmail: 'info@clinica.com'
      }
    },
    5: {
      // Detalii specifice ElevenLabs
      elevenLabsDetails: {
        audioDuration: 95,
        voiceModel: 'Nova',
        language: 'ro',
        transcription: 'Nu mai pot veni mâine, vă rog să anulați programarea.',
        sentiment: 'neutral',
        confidence: 0.88,
        costPerMinute: 0.30,
        totalCost: 0.0475
      },
      // Metadata tehnică
      technical: {
        duration: 650,
        apiCalls: 4,
        creditsUsed: 38,
        errorRate: 0,
        retryCount: 0
      },
      // Context
      context: {
        trigger: 'incoming_call',
        patientId: 506,
        appointmentId: 789,
        phoneNumber: '+40787654321',
        cancellationReason: 'schedule_conflict'
      }
    },
    6: {
      // Detalii specifice SMS
      smsDetails: {
        recipientCount: 1,
        messageTemplate: 'Reamintire: Programarea dumneavoastră este mâine la {{time}}',
        deliveryRate: 100,
        costPerSMS: 0.05,
        totalCost: 0.05,
        provider: 'Twilio',
        language: 'ro'
      },
      // Metadata tehnică
      technical: {
        duration: 150,
        apiCalls: 1,
        creditsUsed: 12,
        errorRate: 0,
        retryCount: 0
      },
      // Context
      context: {
        trigger: 'scheduled_reminder',
        patientId: 607,
        appointmentId: 890,
        reminderType: '24h_before'
      }
    },
    7: {
      // Detalii specifice Meta
      metaDetails: {
        platform: 'Facebook',
        messageId: 'fb_msg_123456789',
        errorMessage: 'Rate limit exceeded for Facebook API',
        retryAttempts: 3,
        lastRetry: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      // Metadata tehnică
      technical: {
        duration: 5000,
        apiCalls: 5,
        creditsUsed: 0,
        errorRate: 100,
        retryCount: 3,
        errorDetails: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests to Facebook API',
          retryAfter: 3600
        }
      },
      // Context
      context: {
        trigger: 'direct_message',
        patientId: 708,
        socialMediaId: 'fb_user_456',
        campaign: 'social_booking'
      }
    }
  });

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Funcție pentru a obține iconița categoriei
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'appointment': return Calendar;
      case 'communication': return MessageCircle;
      case 'social': return Users;
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

  // Funcție pentru a obține culoarea priorității
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high': return { color: 'text-red-600', bgColor: 'bg-red-50', text: 'Înaltă' };
      case 'medium': return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', text: 'Medie' };
      case 'low': return { color: 'text-green-600', bgColor: 'bg-green-50', text: 'Scăzută' };
      default: return { color: 'text-gray-600', bgColor: 'bg-gray-50', text: priority };
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

  // Filtrare activități
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Statistici rapide
  const stats = {
    total: activities.length,
    success: activities.filter(a => a.status === 'success').length,
    error: activities.filter(a => a.status === 'error').length,
    highPriority: activities.filter(a => a.priority === 'high').length
  };

  return (
    <div className="space-y-6">
      {/* Header cu statistici */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activități Agent</h1>
          <p className="text-muted-foreground">
            Jurnalul acțiunilor automate realizate de agentul inteligent
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            <div className="text-sm text-muted-foreground">Succes</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">{stats.error}</div>
            <div className="text-sm text-muted-foreground">Erori</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">{stats.highPriority}</div>
            <div className="text-sm text-muted-foreground">Prioritate înaltă</div>
          </div>
        </div>
      </div>

      {/* Filtre și căutare */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Command>
                <CommandInput 
                  placeholder="Caută activități..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
              </Command>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={filterCategory === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('all')}
              >
                Toate
              </Button>
              <Button
                variant={filterCategory === 'appointment' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('appointment')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Programări
              </Button>
              <Button
                variant={filterCategory === 'communication' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('communication')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Comunicare
              </Button>
              <Button
                variant={filterCategory === 'social' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('social')}
              >
                <Users className="h-4 w-4 mr-2" />
                Social
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel compact */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Acțiune</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Serviciu</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Descriere</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Prioritate</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Timp</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, index) => {
                  const ServiceIcon = getServiceIcon(activity.service);
                  const CategoryIcon = getCategoryIcon(activity.category);
                  const actionInfo = getActionInfo(activity.action);
                  const priorityInfo = getPriorityInfo(activity.priority);
                  const StatusIcon = activity.status === 'success' ? CheckCircle : AlertCircle;
                  
                  return (
                    <tr 
                      key={activity.id} 
                      className={`border-b transition-colors hover:bg-muted/50 cursor-pointer ${
                        selectedActivity?.id === activity.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        console.log('Opening drawer for activity:', activity);
                        setSelectedActivity(activity);
                        setDrawerOpen(true);
                      }}
                    >
                      {/* Status */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`h-4 w-4 ${activity.status === 'success' ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                      </td>

                      {/* Acțiune */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${actionInfo.bgColor} ${actionInfo.color}`}>
                            {actionInfo.text}
                          </span>
                        </div>
                      </td>

                      {/* Serviciu */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-2">
                          <ServiceIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{activity.service}</span>
                        </div>
                      </td>

                      {/* Descriere */}
                      <td className="p-4 align-middle">
                        <div className="max-w-xs">
                          <div className="font-medium text-sm truncate">{activity.description}</div>
                          <div className="text-xs text-muted-foreground truncate">{activity.details}</div>
                        </div>
                      </td>

                      {/* Prioritate */}
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                          {priorityInfo.text}
                        </span>
                      </td>

                      {/* Timp */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Activity Drawer */}
      {drawerOpen && selectedActivity && (
        <ActivityDrawer
          onClose={() => {
            setDrawerOpen(false);
            setSelectedActivity(null);
          }}
          activity={selectedActivity}
          detailedData={detailedData[selectedActivity.id]}
        />
      )}
    </div>
  )
}

export default OperationsActivities
