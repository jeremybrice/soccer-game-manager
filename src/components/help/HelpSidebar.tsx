/**
 * Help Sidebar Navigation
 *
 * Philosophy: Organized sections with visual hierarchy.
 * Grouped by category for easy browsing.
 * Touch-friendly with proper tap targets for mobile use.
 */

import React, { useMemo } from 'react';
import { useAppStore } from '../../store';
import { helpSections } from '../../data/helpContent';
import type { HelpCategory } from '../../types';

interface HelpSidebarProps {
  onSectionSelect?: () => void;
}

export const HelpSidebar: React.FC<HelpSidebarProps> = ({ onSectionSelect }) => {
  const activeHelpSection = useAppStore((state) => state.activeHelpSection);
  const setActiveHelpSection = useAppStore((state) => state.setActiveHelpSection);

  // Group sections by category
  const categories = useMemo(() => {
    return {
      'getting-started': helpSections.filter((s) => s.category === 'getting-started'),
      'features': helpSections.filter((s) => s.category === 'features'),
      'reference': helpSections.filter((s) => s.category === 'reference'),
      'advanced': helpSections.filter((s) => s.category === 'advanced'),
    };
  }, []);

  const categoryLabels: Record<HelpCategory, string> = {
    'getting-started': '🚀 Getting Started',
    'features': '⚙️ Features',
    'reference': '📚 Reference',
    'advanced': '🎯 Advanced',
  };

  return (
    <div className="h-full overflow-y-auto">
      {Object.entries(categories).map(([category, sections]) => {
        if (sections.length === 0) return null;

        return (
          <div key={category} className="mb-4">
            <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 uppercase">
              {categoryLabels[category as HelpCategory]}
            </h3>
            <nav>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveHelpSection(section.id);
                    onSectionSelect?.();
                  }}
                  className={`w-full text-left px-4 py-3 md:py-2 text-base md:text-sm transition-colors touch-target ${
                    activeHelpSection === section.id
                      ? 'bg-raiders-red text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        );
      })}
    </div>
  );
};
