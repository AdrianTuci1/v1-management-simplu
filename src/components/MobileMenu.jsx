import React, { useState } from 'react';
import {
  Home,
  Activity,
  TrendingUp,
  Package,
  RefreshCw,
  CreditCard,
  DollarSign,
  BarChart3,
  PieChart,
  Shield,
  User,
  Settings,
  Bot,
  Pill,
  Calendar,
  Users,
  X,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import LocationSwitcher from './LocationSwitcher';
import { useBusinessConfig } from '../config/businessConfig';
import { useHealthRepository } from '../hooks/useHealthRepository';
import cognitoAuthService from '../services/cognitoAuthService';

const navigationStructure = {
  dashboard: {
    title: 'Dashboard',
    icon: Home,
    view: 'dashboard',
  },
  operations: {
    title: 'OPERAȚIUNI',
    icon: Activity,
    items: [
      { icon: Calendar, label: 'Planificare', view: 'operations-planning' },
      { icon: Users, label: 'Pacienți', view: 'operations-people' },
      { icon: Pill, label: 'Tratamente', view: 'operations-treatments' },
      { icon: Activity, label: 'Activități', view: 'operations-activities' },
    ],
  },
  business: {
    title: 'BUSINESS',
    icon: TrendingUp,
    items: [
      { icon: TrendingUp, label: 'Vânzări', view: 'business-sales' },
      { icon: Package, label: 'Inventar', view: 'business-inventory' },
      { icon: RefreshCw, label: 'Procese', view: 'business-processes' },
      { icon: CreditCard, label: 'Facturare', view: 'financial-billing' },
      { icon: DollarSign, label: 'Contabilitate', view: 'financial-accounting' },
    ],
  },
  analytics: {
    title: 'ANALIZE',
    icon: BarChart3,
    items: [
      { icon: BarChart3, label: 'Rapoarte', view: 'analytics-reports' },
      { icon: PieChart, label: 'Dashboard', view: 'analytics-dashboard' },
    ],
  },
  admin: {
    title: 'ADMINISTRARE',
    icon: Settings,
    items: [
      { icon: Shield, label: 'Control Acces', view: 'admin-access' },
      { icon: User, label: 'Medici', view: 'admin-users' },
      { icon: Settings, label: 'Setări', view: 'admin-settings' },
    ],
  },
};

function MobileMenu({ isOpen, onClose, currentView, onViewChange, currentLocation, onLocationChange }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const { businessName, BusinessIcon } = useBusinessConfig();
  const { isHealthy, isOffline, isServerDown } = useHealthRepository();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  if (!isOpen) return null;

  const handleViewSelect = (view) => {
    onViewChange(view);
    onClose();
  };

  const toggleSection = (sectionKey) => {
    if (navigationStructure[sectionKey].items) {
      setExpandedSection(expandedSection === sectionKey ? null : sectionKey);
    } else {
      handleViewSelect(navigationStructure[sectionKey].view);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BusinessIcon className="h-6 w-6" />
            {/* Health indicator dot */}
            <div 
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                isHealthy 
                  ? 'bg-green-500' 
                  : isOffline 
                    ? 'bg-gray-400' 
                    : isServerDown 
                      ? 'bg-red-500' 
                      : 'bg-yellow-500'
              }`}
            />
          </div>
          <span className="text-lg font-semibold">{businessName}</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {Object.entries(navigationStructure).map(([key, section]) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSection === key;
            const isActive = currentView === section.view || 
              (section.items && section.items.some(item => item.view === currentView));

            return (
              <div key={key} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <SectionIcon className="h-5 w-5" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  {section.items && (
                    <ChevronRight 
                      className={`h-5 w-5 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Section Items */}
                {section.items && isExpanded && (
                  <div className="ml-4 space-y-1">
                    {section.items.map((item, idx) => {
                      const ItemIcon = item.icon;
                      const isItemActive = currentView === item.view;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleViewSelect(item.view)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isItemActive 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <ItemIcon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Special Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
          {/* AI Assistant - only show if not in demo mode */}
          {!isDemoMode && (
            <button
              onClick={() => {
                // TODO: Open AI Assistant in mobile view
                onClose();
              }}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Bot className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-700">AI Assistant</span>
            </button>
          )}

          {/* User Profile */}
          <button
            onClick={() => {
              // TODO: Open user profile in mobile view
              onClose();
            }}
            className="w-full flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <User className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Profil Utilizator</span>
          </button>
        </div>
      </div>

      {/* Footer with Location Switcher and Logout */}
      <div className="border-t border-gray-200 p-4 space-y-3 bg-white">
        {/* Location Switcher */}
        <div className="mb-2">
          <LocationSwitcher
            collapsed={false}
            currentLocation={currentLocation}
            onLocationChange={onLocationChange}
          />
        </div>

        {/* Logout Button */}
        <button
          onClick={async () => {
            await cognitoAuthService.signOut();
            window.location.reload();
          }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Deconectare</span>
        </button>

        {/* Version */}
        <div className="text-center text-sm text-gray-500">
          v1.0.0
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;

