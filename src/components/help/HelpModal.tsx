/**
 * Help Modal Container
 *
 * Philosophy: Help should be instantly accessible but never intrusive.
 * Modal overlay allows quick reference without navigation, dismissible with
 * single tap outside. Searchable content prioritizes "find answer fast"
 * over exhaustive reading.
 */

import React from 'react';
import { useAppStore } from '../../store';
import { HelpSidebar } from './HelpSidebar';
import { HelpContent } from './HelpContent';
import { HelpSearch } from './HelpSearch';

export const HelpModal: React.FC = () => {
  const isHelpOpen = useAppStore((state) => state.isHelpOpen);
  const closeHelp = useAppStore((state) => state.closeHelp);

  if (!isHelpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={closeHelp}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-raiders-navy text-white p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Help & Training</h2>
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
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <HelpSidebar />

          {/* Main Content */}
          <HelpContent />
        </div>
      </div>
    </div>
  );
};
