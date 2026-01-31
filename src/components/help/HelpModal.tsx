/**
 * Help Modal Container
 *
 * Philosophy: Help should be instantly accessible but never intrusive.
 * Modal overlay allows quick reference without navigation, dismissible with
 * single tap outside. Searchable content prioritizes "find answer fast"
 * over exhaustive reading.
 *
 * Mobile-first: Full screen on mobile with collapsible navigation.
 * Touch-friendly with proper tap targets for sideline use.
 */

import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { HelpSidebar } from './HelpSidebar';
import { HelpContent } from './HelpContent';
import { HelpSearch } from './HelpSearch';

export const HelpModal: React.FC = () => {
  const isHelpOpen = useAppStore((state) => state.isHelpOpen);
  const closeHelp = useAppStore((state) => state.closeHelp);
  const activeHelpSection = useAppStore((state) => state.activeHelpSection);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  if (!isHelpOpen) return null;

  // Close mobile nav when a section is selected
  const handleSectionSelect = () => {
    setIsMobileNavOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={closeHelp}
    >
      <div
        className="bg-white rounded-lg md:rounded-lg shadow-2xl w-full h-full md:max-w-6xl md:h-[90vh] flex flex-col overflow-hidden md:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-raiders-navy text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="touch-target p-2 hover:bg-raiders-navy-light rounded transition-colors md:hidden"
              aria-label={isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <h2 className="text-xl md:text-2xl font-bold">Help & Training</h2>
          </div>
          <button
            onClick={closeHelp}
            className="touch-target p-2 hover:bg-raiders-navy-light rounded transition-colors"
            aria-label="Close help"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <HelpSearch />

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile Navigation Overlay */}
          {isMobileNavOpen && (
            <div
              className="absolute inset-0 bg-black bg-opacity-50 z-10 md:hidden"
              onClick={() => setIsMobileNavOpen(false)}
            />
          )}

          {/* Sidebar - hidden on mobile unless toggled */}
          <div
            className={`
              absolute md:relative inset-y-0 left-0 z-20
              transform transition-transform duration-200 ease-in-out
              ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
              md:translate-x-0
              w-72 md:w-64
              bg-gray-50 border-r border-gray-200
              overflow-y-auto
            `}
          >
            <HelpSidebar onSectionSelect={handleSectionSelect} />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <HelpContent />
          </div>
        </div>

        {/* Mobile: Show current section indicator when nav is closed */}
        {!isMobileNavOpen && activeHelpSection && (
          <div className="md:hidden bg-gray-100 px-4 py-2 text-sm text-gray-600 border-t shrink-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="flex items-center gap-2 text-raiders-navy font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Browse Topics
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
