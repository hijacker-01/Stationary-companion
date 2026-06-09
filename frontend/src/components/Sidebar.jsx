import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { menuTree } from "./menuData";
import { ChevronRight, ChevronDown } from "lucide-react";

export default function Sidebar() {
  const [expandedIds, setExpandedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebar_expanded')) || ["quick-actions", "accounts", "reports", "inventory", "enterprise", "portals"];
    } catch { return ["quick-actions"]; }
  });
  const [activeIndex, setActiveIndex] = useState(-1);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('sidebar_expanded', JSON.stringify(expandedIds));
  }, [expandedIds]);

  // Bottom static links
  const bottomLinks = [
    { id: "bottom-suppliers", to: "/suppliers", label: "Suppliers" },
    { id: "bottom-customers", to: "/customers", label: "Customers" },
    { id: "bottom-salesman", to: "/salesman", label: "Salesman" },
    { id: "bottom-users", to: "/users", label: "Users & Roles" },
    { id: "bottom-settings", to: "/settings", label: "Settings" }
  ];

  // Flatten currently visible nodes
  const visibleNodes = [];
  const flatten = (nodes, depth = 0) => {
    nodes.forEach((node) => {
      const id = node.id || node.label;
      const isExpanded = expandedIds.includes(id);
      visibleNodes.push({ ...node, depth, isExpanded, id });
      if (node.children && isExpanded) {
        flatten(node.children, depth + 1);
      }
    });
  };
  flatten(menuTree);
  
  // Add bottom links to the flattened array so they are keyboard navigable too
  bottomLinks.forEach(bl => visibleNodes.push({ ...bl, depth: 0, isBottom: true }));

  // Auto-select based on current path on initial mount or path change
  useEffect(() => {
    if (activeIndex === -1 || visibleNodes[activeIndex]?.to !== location.pathname) {
      const idx = visibleNodes.findIndex(n => n.to === location.pathname);
      if (idx !== -1) setActiveIndex(idx);
    }
  }, [location.pathname]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleKeyDown = (e) => {
    if (visibleNodes.length === 0) return;
    
    let currentIdx = activeIndex;
    if (currentIdx === -1 && ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
      currentIdx = 0;
      setActiveIndex(0);
      e.preventDefault();
      return;
    }

    const node = visibleNodes[currentIdx];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(Math.min(currentIdx + 1, visibleNodes.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(Math.max(currentIdx - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(visibleNodes.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (node.to) navigate(node.to);
        else if (node.children) toggleExpand(node.id);
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && sidebarRef.current) {
      const activeEl = sidebarRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  return (
    <nav
      ref={sidebarRef}
      tabIndex={0}
      role="tree"
      onKeyDown={handleKeyDown}
      onFocus={() => {
        if (activeIndex === -1 && visibleNodes.length > 0) {
          setActiveIndex(0);
        }
      }}
      className="w-56 h-full bg-[#f4f4f4] border-r border-gray-300 flex flex-col overflow-y-auto shrink-0 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#1b4985]"
      data-section="sidebar"
    >
      <div className="py-2 flex flex-col gap-[1px]">
        {visibleNodes.map((node, i) => {
          if (node.isBottom) return null; // Render bottom links separately
          
          const isActive = activeIndex === i;
          const isRouteActive = node.to && location.pathname === node.to;
          
          return (
            <div
              key={node.id}
              data-index={i}
              role="treeitem"
              aria-expanded={node.children ? node.isExpanded : undefined}
              aria-selected={isActive}
              onClick={() => {
                sidebarRef.current?.focus();
                setActiveIndex(i);
                if (node.to) navigate(node.to);
                else if (node.children) toggleExpand(node.id);
              }}
              className={`cursor-pointer flex items-center justify-between px-3 py-[5px] transition-colors ${
                isActive ? "bg-[#1b4985] text-white outline-none" : 
                isRouteActive ? "bg-[#dbeafe] text-[#1e3a8a] border-l-2 border-[#1e3a8a]" : 
                "text-gray-700 hover:bg-[#e8e8e8]"
              }`}
              style={{ paddingLeft: `${0.75 + node.depth * 0.75}rem` }}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {node.children && (
                  <span className="shrink-0">
                    {node.isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                )}
                {!node.children && node.depth > 0 && <span className="w-3 h-3 shrink-0" />}
                
                <span className={`truncate text-[11.5px] ${node.depth === 0 && node.children ? "font-extrabold uppercase tracking-wider text-[11px]" : "font-medium"} ${node.color && !isActive && !isRouteActive ? node.color : ""}`}>
                  {node.label}
                </span>
              </div>
              {node.badge && (
                <span className={`text-[8px] font-extrabold px-1 rounded ${isActive ? "bg-white text-[#1b4985]" : "bg-purple-100 text-purple-700"}`}>
                  {node.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Bottom Fixed Area */}
      <div className="mt-auto pt-2 pb-4 border-t border-gray-300 bg-[#e4e4e4] flex flex-col gap-1">
        {visibleNodes.map((node, i) => {
          if (!node.isBottom) return null;
          const isActive = activeIndex === i;
          const isRouteActive = node.to && location.pathname === node.to;
          return (
            <div
              key={node.id}
              data-index={i}
              role="treeitem"
              aria-selected={isActive}
              onClick={() => {
                sidebarRef.current?.focus();
                setActiveIndex(i);
                navigate(node.to);
              }}
              className={`cursor-pointer px-4 py-1 text-[11px] font-bold transition-colors ${
                isActive ? "bg-[#1b4985] text-white" : 
                isRouteActive ? "text-[#1e3a8a]" : 
                "text-gray-700 hover:text-blue-700"
              }`}
            >
              {node.label}
            </div>
          );
        })}
      </div>
    </nav>
  );
}