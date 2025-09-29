import React, { useState } from "react";
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
  ChevronDown as ChevronDownIcon,
  Eye,
  Ruler,
} from "lucide-react";
import LocationSwitcher from './LocationSwitcher';
import { useBusinessConfig } from '../config/businessConfig';
import { useHealthRepository } from '../hooks/useHealthRepository';
import { useAuth } from "react-oidc-context";
import { LogOut } from "lucide-react";

// Softer spring animation curve
const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

/* ----------------------------- Brand / Logos ----------------------------- */

function BusinessLogoSquare() {
  return (
    <div className="aspect-[24/24] grow min-h-px min-w-px overflow-clip relative shrink-0">
      <div className="absolute aspect-[24/16] left-0 right-0 top-1/2 -translate-y-1/2">
        <svg className="block size-full" fill="none" viewBox="0 0 24 16">
          <g>
            <path d="M0.32 0C0.20799 0 0.151984 0 0.109202 0.0217987C0.0715695 0.0409734 0.0409734 0.0715695 0.0217987 0.109202C0 0.151984 0 0.20799 0 0.32V6.68C0 6.79201 0 6.84801 0.0217987 6.8908C0.0409734 6.92843 0.0715695 6.95902 0.109202 6.9782C0.151984 7 0.207989 7 0.32 7L3.68 7C3.79201 7 3.84802 7 3.8908 6.9782C3.92843 6.95903 3.95903 6.92843 3.9782 6.8908C4 6.84801 4 6.79201 4 6.68V4.32C4 4.20799 4 4.15198 4.0218 4.1092C4.04097 4.07157 4.07157 4.04097 4.1092 4.0218C4.15198 4 4.20799 4 4.32 4L19.68 4C19.792 4 19.848 4 19.8908 4.0218C19.9284 4.04097 19.959 4.07157 19.9782 4.1092C20 4.15198 20 4.20799 20 4.32V6.68C20 6.79201 20 6.84802 20.0218 6.8908C20.041 6.92843 20.0716 6.95903 20.1092 6.9782C20.152 7 20.208 7 20.32 7L23.68 7C23.792 7 23.848 7 23.8908 6.9782C23.9284 6.95903 23.959 6.92843 23.9782 6.8908C24 6.84802 24 6.79201 24 6.68V0.32C24 0.20799 24 0.151984 23.9782 0.109202C23.959 0.0715695 23.9284 0.0409734 23.8908 0.0217987C23.848 0 23.792 0 23.68 0H0.32Z" fill="#FAFAFA" />
            <path d="M0.32 16C0.20799 16 0.151984 16 0.109202 15.9782C0.0715695 15.959 0.0409734 15.9284 0.0217987 15.8908C0 15.848 0 15.792 0 15.68V9.32C0 9.20799 0 9.15198 0.0217987 9.1092C0.0409734 9.07157 0.0715695 9.04097 0.109202 9.0218C0.151984 9 0.207989 9 0.32 9H3.68C3.79201 9 3.84802 9 3.8908 9.0218C3.92843 9.04097 3.95903 9.07157 3.9782 9.1092C4 9.15198 4 9.20799 4 9.32V11.68C4 11.792 4 11.848 4.0218 11.8908C4.04097 11.9284 4.07157 11.959 4.1092 11.9782C4.15198 12 4.20799 12 4.32 12L19.68 12C19.792 12 19.848 12 19.8908 11.9782C19.9284 11.959 19.959 11.9284 19.9782 11.8908C20 11.848 20 11.792 20 11.68V9.32C20 9.20799 20 9.15199 20.0218 9.1092C20.041 9.07157 20.0716 9.04098 20.1092 9.0218C20.152 9 20.208 9 20.32 9H23.68C23.792 9 23.848 9 23.8908 9.0218C23.9284 9.04098 23.959 9.07157 23.9782 9.1092C24 9.15199 24 9.20799 24 9.32V15.68C24 15.792 24 15.848 23.9782 15.8908C23.959 15.9284 23.9284 15.959 23.8908 15.9782C23.848 16 23.792 16 23.68 16H0.32Z" fill="#FAFAFA" />
            <path d="M6.32 10C6.20799 10 6.15198 10 6.1092 9.9782C6.07157 9.95903 6.04097 9.92843 6.0218 9.8908C6 9.84802 6 9.79201 6 9.68V6.32C6 6.20799 6 6.15198 6.0218 6.1092C6.04097 6.07157 6.07157 6.04097 6.1092 6.0218C6.15198 6 6.20799 6 6.32 6L17.68 6C17.792 6 17.848 6 17.8908 6.0218C17.9284 6.04097 17.959 6.07157 17.9782 6.1092C18 6.15198 18 6.20799 18 6.32V9.68C18 9.79201 18 9.84802 17.9782 9.8908C17.959 9.92843 17.9284 9.95903 17.8908 9.9782C17.848 10 17.792 10 17.68 10H6.32Z" fill="#FAFAFA" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function BrandBadge({ businessName, BusinessIcon, isHealthy, isOffline, isServerDown, isDemoMode }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex items-center p-1 w-full">
        <div className="h-10 w-8 flex items-center justify-center pl-2">
          <div className="relative">
            <BusinessIcon className="h-5 w-5" />
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
              title={
                isHealthy 
                  ? 'Sistem online și funcțional' 
                  : isOffline 
                    ? 'Fără conexiune la internet' 
                    : isServerDown 
                      ? 'Server indisponibil' 
                      : 'Verificare în curs...'
              }
            />
          </div>
        </div>
        <div className="px-2 py-1">
          <div className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-gray-900">
            {businessName}
          </div>
          {isDemoMode && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
              DEMO
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Avatar -------------------------------- */

function AvatarCircle() {
  return (
    <div className="relative rounded-full shrink-0 size-8 bg-black">
      <div className="flex items-center justify-center size-8">
        <User size={16} className="text-gray-700" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-gray-800 pointer-events-none"
      />
    </div>
  );
}


/* --------------------------- Types / Content Map -------------------------- */

function getSidebarContent(activeSection, currentView) {
  const contentMap = {
    dashboard: {
      title: "Dashboard",
      sections: [
        {
          title: "Overview",
          items: [
            { icon: <Home size={16} className="text-gray-700" />, label: "Dashboard", isActive: currentView === 'dashboard' },
          ],
        },
      ],
    },

    operations: {
      title: "OPERAȚIUNI",
      sections: [
        {
          title: "Planning",
          items: [
            { icon: <Calendar size={16} className="text-gray-700" />, label: "Planificare", isActive: currentView === 'operations-planning' },
            { icon: <Users size={16} className="text-gray-700" />, label: "Pacienți", isActive: currentView === 'operations-people' },
            { icon: <Pill size={16} className="text-gray-700" />, label: "Tratamente", isActive: currentView === 'operations-treatments' },
          ],
        },
        {
          title: "Activities",
          items: [
            { icon: <Activity size={16} className="text-gray-700" />, label: "Activități", isActive: currentView === 'operations-activities' },
          ],
        },
      ],
    },

    business: {
      title: "BUSINESS",
      sections: [
        {
          title: "Sales & Inventory",
          items: [
            { icon: <TrendingUp size={16} className="text-gray-700" />, label: "Vânzări", isActive: currentView === 'business-sales' },
            { icon: <Package size={16} className="text-gray-700" />, label: "Inventar", isActive: currentView === 'business-inventory' },
          ],
        },
        {
          title: "Processes",
          items: [
            { icon: <RefreshCw size={16} className="text-gray-700" />, label: "Procese", isActive: currentView === 'business-processes' },
          ],
        },
        {
          title: "Financial Management",
          items: [
            { icon: <CreditCard size={16} className="text-gray-700" />, label: "Facturare", isActive: currentView === 'financial-billing' },
            { icon: <DollarSign size={16} className="text-gray-700" />, label: "Contabilitate", isActive: currentView === 'financial-accounting' },
          ],
        },
      ],
    },

    analytics: {
      title: "ANALIZE",
      sections: [
        {
          title: "Reports & Analytics",
          items: [
            { icon: <Ruler size={16} className="text-gray-700" />, label: "Rapoarte", isActive: currentView === 'analytics-reports' },
            { icon: <PieChart size={16} className="text-gray-700" />, label: "Dashboard", isActive: currentView === 'analytics-dashboard' },
          ],
        },
      ],
    },

    admin: {
      title: "ADMINISTRARE",
      sections: [
        {
          title: "Access Control",
          items: [
            { icon: <Shield size={16} className="text-gray-700" />, label: "Control Acces", isActive: currentView === 'admin-access' },
            { icon: <User size={16} className="text-gray-700" />, label: "Medici", isActive: currentView === 'admin-users' },
            { icon: <Settings size={16} className="text-gray-700" />, label: "Setări", isActive: currentView === 'admin-settings' },
          ],
        },
      ],
    },
  };

  return contentMap[activeSection] || contentMap.dashboard;
}

/* ---------------------------- Left Icon Nav Rail -------------------------- */

function IconNavButton({
  children,
  isActive = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center rounded-lg size-10 min-w-10 transition-colors duration-500
        ${isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"}`}
      style={{ transitionTimingFunction: softSpringEasing }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IconNavigation({
  activeSection,
  onSectionChange,
}) {
  // Get business config and health status
  const { businessName, BusinessIcon } = useBusinessConfig();
  const { isHealthy, isOffline, isServerDown } = useHealthRepository();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const navItems = [
    { id: "dashboard", icon: <Home size={16} />, label: "Dashboard" },
    { id: "operations", icon: <Activity size={16} />, label: "Operațiuni" },
    { id: "business", icon: <TrendingUp size={16} />, label: "Business" },
    { id: "analytics", icon: <BarChart3 size={16} />, label: "Analize" },
    { id: "admin", icon: <Settings size={16} />, label: "Admin" },
  ];

  return (
    <aside className="bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col gap-2 items-center p-4 w-16 h-full shadow-lg rounded-lg">
      {/* Logo with Status */}
      <div className="mb-2 size-10 flex items-center justify-center">
        <div className="relative">
          <BusinessIcon className="h-5 w-5" />
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
            title={
              isHealthy 
                ? 'Sistem online și funcțional' 
                : isOffline 
                  ? 'Fără conexiune la internet' 
                  : isServerDown 
                    ? 'Server indisponibil' 
                    : 'Verificare în curs...'
            }
          />
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-2 w-full items-center">
        {navItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon}
          </IconNavButton>
        ))}
      </div>

      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-2 w-full items-center">
        <button
          onClick={() => {
            const clientId = "ar2m2qg3gp4a0b4cld09aegdb";
            const logoutUri = window.location.href;
            const cognitoDomain = "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_KUaE0MTcQ";
            window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
          }}
          className="h-8 w-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
          title="Deconectare"
        >
          <LogOut className="h-4 w-4 text-red-600" />
        </button>
      </div>
    </aside>
  );
}

/* ------------------------------ Right Sidebar ----------------------------- */

function SectionTitle({
  title,
  onToggleCollapse,
  isCollapsed,
}) {
  if (isCollapsed) {
    return (
      <div className="w-full flex justify-center transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500 hover:bg-gray-800 text-gray-400 hover:text-gray-300"
          style={{ transitionTimingFunction: softSpringEasing }}
          aria-label="Expand sidebar"
        >
          <span className="inline-block rotate-180">
            <ChevronDownIcon size={16} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center h-10">
          <div className="px-2 py-1">
            <div className="font-['Lexend:SemiBold',_sans-serif] text-[18px] text-gray-900 leading-[27px]">
              {title}
            </div>
          </div>
        </div>
        <div className="pr-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500 hover:bg-gray-800 text-gray-400 hover:text-gray-300"
            style={{ transitionTimingFunction: softSpringEasing }}
            aria-label="Collapse sidebar"
          >
            <ChevronDownIcon size={16} className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSidebar({ activeSection, currentView, onViewChange, currentLocation, onLocationChange }) {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const content = getSidebarContent(activeSection, currentView);
  
  // Get business config and health status
  const { businessName, BusinessIcon } = useBusinessConfig();
  const { isHealthy, isOffline, isServerDown } = useHealthRepository();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const toggleExpanded = (itemKey) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleCollapse = () => setIsCollapsed((s) => !s);

  return (
    <aside
      className={`bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col gap-4 items-start p-4 transition-all duration-500 h-full shadow-lg rounded-lg ${
        isCollapsed ? "w-16 min-w-16 !px-0 justify-center" : "w-80"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >

      <SectionTitle title={content.title} onToggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />

      <div
        className={`flex flex-col w-full overflow-y-auto transition-all duration-500 ${
          isCollapsed ? "gap-2 items-center" : "gap-4 items-start"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
            isCollapsed={isCollapsed}
            onViewChange={onViewChange}
          />
        ))}
      </div>

      {/* Location Switcher */}
      {!isCollapsed && (
        <div className="w-full mt-auto pt-2 border-t border-gray-200">
          <LocationSwitcher
            collapsed={isCollapsed}
            currentLocation={currentLocation}
            onLocationChange={onLocationChange}
          />
        </div>
      )}

      {!isCollapsed && (
        <div className="w-full pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-gray-900">v1.0.0</div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ------------------------------ Menu Elements ---------------------------- */

function MenuItem({
  item,
  isExpanded,
  onToggle,
  onItemClick,
  isCollapsed,
}) {
  const handleClick = () => {
    if (item.hasDropdown && onToggle) onToggle();
    else onItemClick?.();
  };

  return (
    <div
      className={`relative shrink-0 transition-all duration-500 ${
        isCollapsed ? "w-full flex justify-center" : "w-full"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div
        className={`rounded-lg cursor-pointer transition-all duration-500 flex items-center relative ${
          item.isActive ? "bg-blue-100" : "hover:bg-gray-100"
        } ${isCollapsed ? "w-10 min-w-10 h-10 justify-center p-4" : "w-full h-10 px-4 py-2"}`}
        style={{ transitionTimingFunction: softSpringEasing }}
        onClick={handleClick}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center justify-center shrink-0">{item.icon}</div>

        <div
          className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-3"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-gray-900 leading-[20px] truncate">
            {item.label}
          </div>
        </div>

        {item.hasDropdown && (
          <div
            className={`flex items-center justify-center shrink-0 transition-opacity duration-500 ${
              isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-2"
            }`}
            style={{ transitionTimingFunction: softSpringEasing }}
          >
            <ChevronDownIcon
              size={16}
              className="text-gray-700 transition-transform duration-500"
              style={{
                transitionTimingFunction: softSpringEasing,
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SubMenuItem({ item, onItemClick }) {
  return (
    <div className="w-full pl-9 pr-1 py-[1px]">
      <div
        className="h-10 w-full rounded-lg cursor-pointer transition-colors hover:bg-gray-100 flex items-center px-3 py-1"
        onClick={onItemClick}
      >
        <div className="flex-1 min-w-0">
          <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-gray-600 leading-[18px] truncate">
            {item.label}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuSection({
  section,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
  onViewChange,
}) {
  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative shrink-0 w-full transition-all duration-500 overflow-hidden ${
          isCollapsed ? "h-0 opacity-0" : "h-10 opacity-100"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        <div className="flex items-center h-10 px-4">
          <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-gray-400">
            {section.title}
          </div>
        </div>
      </div>

      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`;
        const isExpanded = expandedItems.has(itemKey);
        return (
          <div key={itemKey} className="w-full flex flex-col">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={() => {
                if (item.isActive !== undefined) {
                  // This is a direct navigation item
                  if (item.isActive) {
                    onViewChange('dashboard');
                  } else {
                    // Map labels to view names
                    const viewMap = {
                      'Planificare': 'operations-planning',
                      'Pacienți': 'operations-people', 
                      'Tratamente': 'operations-treatments',
                      'Activități': 'operations-activities',
                      'Procese': 'business-processes',
                      'Vânzări': 'business-sales',
                      'Inventar': 'business-inventory',
                      'Facturare': 'financial-billing',
                      'Contabilitate': 'financial-accounting',
                      'Rapoarte': 'analytics-reports',
                      'Dashboard': 'analytics-dashboard',
                      'Control Acces': 'admin-access',
                      'Medici': 'admin-users',
                      'Setări': 'admin-settings'
                    };
                    const viewName = viewMap[item.label] || item.label.toLowerCase().replace(/\s+/g, '-');
                    onViewChange(viewName);
                  }
                } else {
                  console.log(`Clicked ${item.label}`);
                }
              }}
              isCollapsed={isCollapsed}
            />
            {isExpanded && item.children && !isCollapsed && (
              <div className="flex flex-col gap-1 mb-2">
                {item.children.map((child, childIndex) => (
                  <SubMenuItem
                    key={`${itemKey}-${childIndex}`}
                    item={child}
                    onItemClick={() => console.log(`Clicked ${child.label}`)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Layout -------------------------------- */

function NewSidebar({ 
  collapsed, 
  currentView, 
  onViewChange, 
  onToggle, 
  currentLocation, 
  onLocationChange 
}) {
  const [activeSection, setActiveSection] = useState("dashboard");

  // Map current view to active section
  React.useEffect(() => {
    if (currentView === 'dashboard') {
      setActiveSection('dashboard');
    } else if (currentView.startsWith('operations-') || currentView === 'operations-activities') {
      setActiveSection('operations');
    } else if (currentView.startsWith('business-') || currentView.startsWith('financial-')) {
      setActiveSection('business');
    } else if (currentView.startsWith('analytics-')) {
      setActiveSection('analytics');
    } else if (currentView.startsWith('admin-')) {
      setActiveSection('admin');
    }
  }, [currentView]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Set default view for each section
    const defaultViews = {
      'dashboard': 'dashboard',
      'operations': 'operations-planning',
      'business': 'business-sales',
      'analytics': 'analytics-reports',
      'admin': 'admin-access'
    };
    if (defaultViews[section]) {
      onViewChange(defaultViews[section]);
    }
  };

  return (
    <div className="flex flex-row h-full">
      <IconNavigation activeSection={activeSection} onSectionChange={handleSectionChange} />
      <DetailSidebar 
        activeSection={activeSection} 
        currentView={currentView}
        onViewChange={onViewChange}
        currentLocation={currentLocation}
        onLocationChange={onLocationChange}
      />
    </div>
  );
}

export default NewSidebar;
