import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Send, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Menu,
  X,
  Link2,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/attribution', label: 'Attribution Flow', icon: TrendingUp },
  { path: '/offline-conversions', label: 'Offline Conversions', icon: Send },
  { path: '/company-funnel', label: 'Company Funnel', icon: Users },
  { path: '/payments', label: 'Payments Flow', icon: DollarSign },
];

const hubspotItems = [
  { path: '/hubspot/push', label: 'Push Flow', icon: ArrowUpRight },
  { path: '/hubspot/pull', label: 'Pull Flow', icon: ArrowDownLeft },
  { path: '/hubspot/scheduled', label: 'Scheduled Jobs', icon: Clock },
];

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hubspotExpanded, setHubspotExpanded] = useState(false);
  const location = useLocation();

  // Auto-expand HubSpot menu if on a HubSpot page
  const isHubspotActive = location.pathname.startsWith('/hubspot');
  const showHubspotExpanded = hubspotExpanded || isHubspotActive;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-slate-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Matrix Flow Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Data Flow Visualization</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}

          {/* HubSpot Integration Collapsible Menu */}
          <div className="pt-2">
            <button
              onClick={() => setHubspotExpanded(!showHubspotExpanded)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isHubspotActive
                  ? 'bg-orange-600/20 text-orange-300'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Link2 size={20} />
                <span className="font-medium">HubSpot Integration</span>
              </div>
              <ChevronDown 
                size={18} 
                className={`transition-transform duration-200 ${showHubspotExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* HubSpot Sub-items */}
            <div className={`overflow-hidden transition-all duration-200 ${
              showHubspotExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-4">
                {hubspotItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={16} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {/* Data Quality - after HubSpot */}
          <NavLink
            to="/data-quality"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <AlertTriangle size={20} />
            <span className="font-medium">Data Quality</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500">
            <p>Last Updated: Nov 27, 2025</p>
            <p className="mt-1">v1.1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
