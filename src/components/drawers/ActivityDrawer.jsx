import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  Activity, 
  MessageSquare, 
  Mic, 
  Mail, 
  Facebook, 
  Calendar, 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  Info,
  Mail as MailIcon,
} from 'lucide-react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerNavigation, 
  DrawerContent 
} from '../ui/drawer'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
// import { Badge } from '../ui/badge.tsx'

const ActivityDrawer = ({ onClose, activity, detailedData }) => {
  const [activeTab, setActiveTab] = useState('summary')
  const [isPlaying, setIsPlaying] = useState(false)

  console.log('ActivityDrawer rendered with activity:', activity, 'detailedData:', detailedData)

  if (!activity) return null

  // Funcții helper pentru iconițe și culori
  const getServiceIcon = (service) => {
    switch (service) {
      case 'sms': return MessageSquare
      case 'elevenLabs': return Mic
      case 'gmail': return Mail
      case 'meta': return Facebook
      default: return Activity
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'appointment': return Calendar
      case 'communication': return MessageCircle
      case 'social': return Users
      default: return Activity
    }
  }

  const getActionInfo = (action) => {
    switch (action) {
      case 'POST': return { color: 'text-green-600', bgColor: 'bg-green-100', text: 'Creat' }
      case 'PATCH': return { color: 'text-blue-600', bgColor: 'bg-blue-100', text: 'Modificat' }
      case 'DELETE': return { color: 'text-red-600', bgColor: 'bg-red-100', text: 'Șters' }
      default: return { color: 'text-gray-600', bgColor: 'bg-gray-100', text: action }
    }
  }

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high': return { color: 'text-red-600', bgColor: 'bg-red-50', text: 'Înaltă' }
      case 'medium': return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', text: 'Medie' }
      case 'low': return { color: 'text-green-600', bgColor: 'bg-green-50', text: 'Scăzută' }
      default: return { color: 'text-gray-600', bgColor: 'bg-gray-50', text: priority }
    }
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (minutes < 60) {
      return `${minutes} min în urmă`
    } else if (hours < 24) {
      return `${hours} ore în urmă`
    } else {
      return timestamp.toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatDetailedTimestamp = (timestamp) => {
    return timestamp.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const ServiceIcon = getServiceIcon(activity.service)
  const CategoryIcon = getCategoryIcon(activity.category)
  const actionInfo = getActionInfo(activity.action)
  const priorityInfo = getPriorityInfo(activity.priority)
  const StatusIcon = activity.status === 'success' ? CheckCircle : AlertCircle

  const navigationItems = [
    { id: 'summary', label: 'Summary', icon: Activity },
    { id: 'transcription', label: 'Transcription', icon: Mic },
    { id: 'metadata', label: 'Metadata', icon: Info }
  ]

  const renderSummary = () => (
    <div className="py-8">
      {/* Summary Content */}
      <div>
        <p className="text-sm text-foreground font-medium mb-2">Summary</p>
        <p className="text-sm text-foreground font-normal">{activity.details}</p>
      </div>

      {/* Status Information */}
      <div className="flex items-center justify-between border-t border-b border-gray-200 py-3">
        <p className="text-sm text-foreground font-medium">Call status</p>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border border-transparent cursor-pointer ${
          activity.status === 'success' ? 'bg-green-100 text-green-950' : 'bg-red-100 text-red-950'
        }`}>
          {activity.status === 'success' ? 'Successful' : 'Failed'}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200 py-3">
        <p className="text-sm text-foreground font-medium cursor-pointer underline underline-offset-2 decoration-dotted decoration-gray-400">
          Activity ID
        </p>
        <p className="text-sm text-muted-foreground font-normal">{activity.id}</p>
      </div>

      {/* Service-specific information */}
      <div className="space-y-4 mt-6">
        {activity.service === 'elevenLabs' && detailedData?.elevenLabsDetails && (
          <div className="p-4 flex gap-1.5 text-sm font-medium rounded-xl bg-gray-100 text-foreground">
            <Info className="w-5 h-5 shrink-0" />
            <div className="px-1.5 mr-auto">
              <p className="text-foreground font-normal text-sm">
                This activity includes audio recording. You can review the conversation quality in the Transcription tab.
              </p>
            </div>
          </div>
        )}

        {activity.service === 'sms' && detailedData?.smsDetails && (
          <div className="p-4 flex gap-1.5 text-sm font-medium rounded-xl bg-blue-50 text-foreground">
            <MessageSquare className="w-5 h-5 shrink-0" />
            <div className="px-1.5 mr-auto">
              <p className="text-foreground font-normal text-sm">
                SMS message sent to {detailedData.smsDetails.recipientCount} recipients via {detailedData.smsDetails.provider}.
              </p>
            </div>
          </div>
        )}

        {activity.service === 'meta' && detailedData?.metaDetails && (
          <div className="p-4 flex gap-1.5 text-sm font-medium rounded-xl bg-blue-50 text-foreground">
            <Facebook className="w-5 h-5 shrink-0" />
            <div className="px-1.5 mr-auto">
              <p className="text-foreground font-normal text-sm">
                Social media interaction on {detailedData.metaDetails.platform}. Response time: {detailedData.metaDetails.responseTime}s.
              </p>
            </div>
          </div>
        )}

        {activity.service === 'gmail' && detailedData?.gmailDetails && (
          <div className="p-4 flex gap-1.5 text-sm font-medium rounded-xl bg-blue-50 text-foreground">
            <Mail className="w-5 h-5 shrink-0" />
            <div className="px-1.5 mr-auto">
              <p className="text-foreground font-normal text-sm">
                Email sent to {detailedData.gmailDetails.recipientEmail} with template {detailedData.gmailDetails.templateUsed}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderTranscription = () => (
    <div className="space-y-6">
      {/* Audio Player Simulation pentru ElevenLabs */}
      {activity.service === 'elevenLabs' && detailedData?.elevenLabsDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Mic className="h-4 w-4" />
              <span>Audio Recording</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Audio waveform simulation */}
            <div className="mb-4">
              <div className="h-11 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {isPlaying ? '0:45' : '0:00'} / {Math.floor(detailedData.elevenLabsDetails.audioDuration / 60)}:{String(detailedData.elevenLabsDetails.audioDuration % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Transcription */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Transcriere:</p>
              <p className="text-sm text-foreground">"{detailedData.elevenLabsDetails.transcription}"</p>
            </div>
            
            {/* Audio details */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Model voce</span>
                <span className="text-sm font-medium">{detailedData.elevenLabsDetails.voiceModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Încredere</span>
                <span className="text-sm font-medium">{(detailedData.elevenLabsDetails.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sentiment</span>
                <span className={`text-sm font-medium capitalize ${
                  detailedData.elevenLabsDetails.sentiment === 'positive' ? 'text-green-600' : 
                  detailedData.elevenLabsDetails.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {detailedData.elevenLabsDetails.sentiment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cost</span>
                <span className="text-sm font-medium">${detailedData.elevenLabsDetails.totalCost}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text transcription pentru alte servicii */}
      {activity.service !== 'elevenLabs' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Text Content</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.service === 'sms' && detailedData?.smsDetails && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Template SMS:</p>
                  <p className="text-sm text-foreground">"{detailedData.smsDetails.messageTemplate}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Destinatari</span>
                    <span className="text-sm font-medium">{detailedData.smsDetails.recipientCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Limba</span>
                    <span className="text-sm font-medium">{detailedData.smsDetails.language}</span>
                  </div>
                </div>
              </div>
            )}

            {activity.service === 'meta' && detailedData?.metaDetails && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Text original:</p>
                  <p className="text-sm text-foreground">"{detailedData.metaDetails.commentText}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Platformă</span>
                    <span className="text-sm font-medium">{detailedData.metaDetails.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Post ID</span>
                    <span className="text-sm font-medium font-mono text-xs">{detailedData.metaDetails.postId}</span>
                  </div>
                </div>
              </div>
            )}

            {activity.service === 'gmail' && detailedData?.gmailDetails && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Subiect email:</p>
                  <p className="text-sm text-foreground">"{detailedData.gmailDetails.subject}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Destinatar</span>
                    <span className="text-sm font-medium">{detailedData.gmailDetails.recipientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Template</span>
                    <span className="text-sm font-medium">{detailedData.gmailDetails.templateUsed}</span>
                  </div>
                </div>
                {detailedData.gmailDetails.attachments && detailedData.gmailDetails.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Atașamente:</p>
                    <div className="space-y-1">
                      {detailedData.gmailDetails.attachments.map((attachment, index) => (
                        <div key={index} className="text-sm text-muted-foreground bg-gray-50 px-2 py-1 rounded">
                          {attachment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )


  const renderMetadata = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Coloana stânga - Metadata principală */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between">
              <p className="text-sm text-foreground font-medium">Data</p>
              <p className="text-sm text-foreground font-normal">
                {formatDetailedTimestamp(activity.timestamp)}
              </p>
            </div>
            
            <div className="flex justify-between">
              <p className="text-sm text-foreground font-medium cursor-pointer underline underline-offset-2 decoration-dotted decoration-gray-400">
                Durată execuție
              </p>
              <p className="text-sm text-foreground font-normal">
                {detailedData?.technical?.duration || 0}ms
              </p>
            </div>

            <div className="flex justify-between">
              <div>
                <p className="text-sm text-foreground font-medium">Credite consumate</p>
                <p className="text-xs text-muted-foreground font-normal">AI processing</p>
              </div>
              <p className="text-sm text-foreground font-normal">
                {detailedData?.technical?.creditsUsed || 0}
              </p>
            </div>

            <div className="flex justify-between">
              <div>
                <p className="text-sm text-foreground font-medium cursor-pointer underline underline-offset-2 decoration-dotted decoration-gray-400">
                  Cost estimat
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-foreground font-normal">$0.00{(detailedData?.technical?.creditsUsed || 0) / 1000} / execuție</p>
                <p className="text-xs text-muted-foreground font-normal">
                  Total: $0.00{((detailedData?.technical?.creditsUsed || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <p className="text-sm text-foreground font-medium cursor-pointer underline underline-offset-2 decoration-dotted decoration-gray-400">
                API Calls
              </p>
              <p className="text-sm text-foreground font-normal">{detailedData?.technical?.apiCalls || 0}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-sm text-foreground font-medium">User Agent</p>
              <p className="text-sm text-muted-foreground font-normal">AI-Agent/1.0</p>
            </div>

            <div className="flex justify-between">
              <p className="text-sm text-foreground font-medium">IP Source</p>
              <p className="text-sm text-muted-foreground font-normal">192.168.1.{Math.floor(Math.random() * 255)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detalii tehnice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">HTTP Method</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${actionInfo.bgColor} ${actionInfo.color} mt-1`}>
                  {activity.action}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serviciu</p>
                <div className="flex items-center space-x-2 mt-1">
                  <ServiceIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{activity.service}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categorie</p>
                <div className="flex items-center space-x-2 mt-1">
                  <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{activity.category}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retry Count</p>
                <span className="text-sm font-medium mt-1">{detailedData?.technical?.retryCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coloana dreapta - Context și erori */}
      <div className="space-y-6">
        {/* Context Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Context și trigger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Trigger</span>
              <span className="text-sm font-medium">{detailedData?.context?.trigger}</span>
            </div>
            {detailedData?.context?.patientId && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ID Pacient</span>
                <span className="text-sm font-medium">{detailedData.context.patientId}</span>
              </div>
            )}
            {detailedData?.context?.appointmentId && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ID Programare</span>
                <span className="text-sm font-medium">{detailedData.context.appointmentId}</span>
              </div>
            )}
            {detailedData?.context?.location && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Locație</span>
                <span className="text-sm font-medium">{detailedData.context.location}</span>
              </div>
            )}
            {detailedData?.context?.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Telefon</span>
                <span className="text-sm font-medium">{detailedData.context.phoneNumber}</span>
              </div>
            )}
            {detailedData?.context?.socialMediaId && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ID Social Media</span>
                <span className="text-sm font-medium">{detailedData.context.socialMediaId}</span>
              </div>
            )}
            {detailedData?.context?.campaign && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Campanie</span>
                <span className="text-sm font-medium">{detailedData.context.campaign}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Details (if applicable) */}
        {activity.status === 'error' && detailedData?.technical?.errorDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-600">Detalii eroare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cod eroare</span>
                <span className="text-sm font-medium text-red-600">{detailedData.technical.errorDetails.code}</span>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Mesaj:</p>
                <p className="text-sm font-medium text-red-800">{detailedData.technical.errorDetails.message}</p>
              </div>
              {detailedData.technical.errorDetails.retryAfter && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Retry după</span>
                  <span className="text-sm font-medium">{Math.floor(detailedData.technical.errorDetails.retryAfter / 60)} min</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Metrici de performanță</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Error Rate</span>
              <span className="text-sm font-medium">{detailedData?.technical?.errorRate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="text-sm font-medium">{100 - (detailedData?.technical?.errorRate || 0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Response Time</span>
              <span className="text-sm font-medium">{detailedData?.technical?.duration || 0}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Retries</span>
              <span className="text-sm font-medium">{detailedData?.technical?.retryCount || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const drawerContent = (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Drawer positioned at top */}
      <div className="relative z-10 w-full h-full max-h-screen flex flex-col bg-white shadow-xl">
        <div className="h-full px-6">
          <DrawerHeader
            title={
              <div className="flex items-center gap-1 flex-wrap">
                <span className="pr-3 mr-auto">Conversation with <span className="underline">Support agent</span></span>
                <p className="text-sm text-muted-foreground font-normal cursor-pointer max-md:pr-6">
                  conv_{activity.id.toString().padStart(24, '0')}
                </p>
              </div>
            }
            onClose={onClose}
          />

          {/* Tab Navigation */}
          <div className="overflow-auto scroll-smooth flex snap-x snap-mandatory no-scrollbar mt-4 w-full">
            <div className="min-w-max w-full">
              <div className="inline-flex text-muted-foreground gap-3.5 border-b-[1px] w-full h-11 pt-0.5">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === item.id}
                      className={`whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 inline-flex -mb-[1px] items-center justify-center border-b-[1.5px] px-0 py-1 text-sm font-medium border-transparent ${
                        activeTab === item.id 
                          ? 'border-gray-800 text-foreground' 
                          : 'border-transparent text-muted-foreground'
                      }`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area - Layout din 2 coloane */}
          <div className="pb-6 overflow-y-auto overflow-x-hidden -mr-6 pr-6">
            <div className="flex h-full gap-6">
              {/* Coloana stânga - Conținutul principal */}
              <div className="flex-1">
                {activeTab === 'summary' && renderSummary()}
                {activeTab === 'transcription' && renderTranscription()}
                {activeTab === 'metadata' && renderMetadata()}
              </div>

              {/* Coloana dreapta - Metadata sidebar */}
              <div className="w-[300px] shrink-0 border-l border-gray-200 p-6">
                <h2 className="text-lg font-medium text-foreground flex items-center gap-3 mb-8">
                  Metadata
                </h2>
                <div className="space-y-8">
                  <div className="flex justify-between">
                    <p className="text-sm text-foreground font-medium">Date</p>
                    <p className="text-sm text-foreground font-normal">
                      {formatDetailedTimestamp(activity.timestamp)}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-foreground font-medium cursor-pointer underline underline-offset-2 decoration-dotted decoration-gray-400">
                      Connection duration
                    </p>
                    <p className="text-sm text-foreground font-normal">
                      {Math.floor((detailedData?.technical?.duration || 0) / 1000)}s
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-foreground font-medium">Credits (call)</p>
                      <p className="text-xs text-muted-foreground font-normal">Development discount applied</p>
                    </div>
                    <p className="text-sm text-foreground font-normal">{detailedData?.technical?.creditsUsed || 0}</p>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-foreground font-medium">Credits (LLM)</p>
                    </div>
                    <p className="text-sm text-foreground font-normal">{Math.floor((detailedData?.technical?.creditsUsed || 0) / 10)}</p>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-foreground font-medium cursor-pointer underline underline-offset-2 decoration-dotted decoration-gray-400">
                        LLM Cost
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground font-normal">$0.00{((detailedData?.technical?.creditsUsed || 0) / 1000).toFixed(3)} / min</p>
                      <p className="text-xs text-muted-foreground font-normal">
                        Total: $0.00{((detailedData?.technical?.creditsUsed || 0) / 10000).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Return portal that renders at the top of the page
  return createPortal(drawerContent, document.body)
}

export default ActivityDrawer
