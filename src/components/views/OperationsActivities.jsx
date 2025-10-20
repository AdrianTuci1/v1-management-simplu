import { Activity, MessageSquare, Mic, Mail, Facebook, Clock, CheckCircle, AlertCircle, Calendar, Users, Phone, Mail as MailIcon, MessageCircle, Zap, Eye, MoreHorizontal, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import ActivityDrawer from '../drawers/ActivityDrawer.jsx'
import { useAgentLogs } from '../../hooks/useAgentLogs.js'

const OperationsActivities = () => {
  // Folosim hook-ul pentru a încărca datele reale
  const { logs: activities, loading, error, loadAgentLogs } = useAgentLogs()
  
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Încarcă activitățile la prima montare și când se schimbă data
  useEffect(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0]
    loadAgentLogs(1, 100, { date: selectedDateStr })
  }, [selectedDate, loadAgentLogs])

  // Funcție pentru a obține iconița acțiunii (bazată pe actionType)
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'sms': return MessageSquare;
      case 'email': return Mail;
      case 'voice_call': return Mic;
      case 'meta_message': return Facebook;
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

  // Funcție pentru a formata ora
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('ro-RO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Funcție pentru a formata data pentru buton
  const formatDateForButton = (date) => {
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filtrare activități după dată
  const filteredActivities = (activities || []).filter(activity => {
    const activityDate = new Date(activity.timestamp);
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
    return activityDateOnly.getTime() === selectedDateOnly.getTime();
  });

  // Statistici rapide - folosim datele reale în loc de mock
  const stats = {
    total: activities?.length || 0,
    success: activities?.filter(a => a.status === 'success').length || 0,
    error: activities?.filter(a => a.status === 'error').length || 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Chip cu titlul */}
          <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-sm">
            <span className="font-semibold text-sm">Activități Agent</span>
          </div>

          {/* Separator subtil */}
          <div className="h-6 w-px bg-gray-200"></div>

          {/* Date Picker Button */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 rounded-full text-sm shadow-sm">
                <Calendar className="mr-2 h-4 w-4" />
                {formatDateForButton(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setDatePickerOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

      </div>

      {/* Tabel compact */}
      <Card>
        <CardContent className="p-0">
          {loading && filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Se încarcă activitățile...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Eroare</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loadAgentLogs(1, 100, { date: selectedDate.toISOString().split('T')[0] })}>
                Încearcă din nou
              </Button>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există activități</h3>
              <p className="text-muted-foreground">
                Nu au fost găsite activități pentru data selectată.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Acțiune</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tip</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Descriere</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ora</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity, index) => {
                  const ActionIcon = getActionIcon(activity.service); // service conține acum actionType
                  const CategoryIcon = getCategoryIcon(activity.category);
                  const actionInfo = getActionInfo(activity.action);
                  
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
                      {/* Acțiune */}
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${actionInfo.bgColor} ${actionInfo.color}`}>
                          {actionInfo.text}
                        </span>
                      </td>

                      {/* Tip Acțiune */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-2">
                          <ActionIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">
                            {activity.service === 'voice_call' ? 'Apel' : 
                             activity.service === 'meta_message' ? 'Social' : 
                             activity.service}
                          </span>
                        </div>
                      </td>

                      {/* Descriere */}
                      <td className="p-4 align-middle">
                        <div className="max-w-xs">
                          <div className="font-medium text-sm truncate">{activity.description}</div>
                          <div className="text-xs text-muted-foreground truncate">{activity.details}</div>
                        </div>
                      </td>

                      {/* Ora */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{formatTime(activity.timestamp)}</span>
                        </div>
                      </td>

                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
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
          detailedData={selectedActivity._rawData || selectedActivity.metadata}
        />
      )}
    </div>
  )
}

export default OperationsActivities
