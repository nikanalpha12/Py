import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, User, MapPin, MessageSquare, Sparkles, Users } from "lucide-react";
import { User as UserEntity } from "@/entities/User";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: "Posts", path: createPageUrl("Feed"), icon: MapPin },
    { name: "Summary", path: createPageUrl("Summary"), icon: Sparkles },
    { name: "Home", path: createPageUrl("Chat"), icon: Home },
    { name: "Friends", path: createPageUrl("Friends"), icon: Users },
    { name: "Profile", path: createPageUrl("Profile"), icon: User }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f9fafb, #ffffff, #dbeafe)',
      color: '#1f2937'
    }}>
      <style>{`
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        background: 'rgba(255, 255, 255, 0.7)',
        borderBottom: '1px solid rgba(191, 219, 254, 0.5)'
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={createPageUrl("Chat")} className="flex items-center gap-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: '#3B82F6' }}>
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#3B82F6]">
                Proximity
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                    style={{
                      background: isActive ? '#3B82F6' : 'transparent',
                      color: isActive ? '#ffffff' : '#6b7280',
                      boxShadow: isActive ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(243, 244, 246, 0.8)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backdropFilter: 'blur(12px)',
        background: 'rgba(255, 255, 255, 0.9)',
        borderTop: '1px solid rgba(191, 219, 254, 0.5)',
        zIndex: 50,
        boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.1)'
      }} className="md:hidden">
        <div className="grid grid-cols-5 h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isCenter = item.name === "Home";
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200"
                style={{
                  color: isActive ? '#3B82F6' : '#6b7280',
                  background: (isCenter && isActive) ? 'rgba(239, 246, 255, 1)' : 'transparent'
                }}
              >
                <item.icon 
                  className={`transition-all duration-200 ${isActive ? "scale-110" : ""} ${isCenter && isActive ? "w-6 h-6" : "w-5 h-5"}`}
                />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
