/**
 * Help Sidebar Navigation
 *
 * Philosophy: Organized sections with visual hierarchy.
 * Filtered by search query, grouped by category.
 */

import React, { useMemo } from 'react';
import { useAppStore } from '../../store';
import { helpSections } from '../../data/helpContent';
import type { HelpCategory } from '../../types';

export const HelpSidebar: React.FC = () => {
  const activeHelpSection = useAppStore((state) => state.activeHelpSection);
  const setActiveHelpSection = useAppStore((state) => state.setActiveHelpSection);
  const searchQuery = useAppStore((state) => state.searchQuery);

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections;

    const query = searchQuery.toLowerCase();
    return helpSections.filter((section) =>
      section.title.toLowerCase().includes(query) ||
      section.keywords.some((kw) => kw.includes(query)) ||
      section.content.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group by category
  const categories = useMemo(() => {
    return {
      'getting-started': filteredSections.filter((s) => s.category === 'getting-started'),
      'features': filteredSections.filter((s) => s.category === 'features'),
      'reference': filteredSections.filter((s) => s.category === 'reference'),
      'advanced': filteredSections.filter((s) => s.category === 'advanced'),
    };
  }, [filteredSections]);

  const categoryLabels: Record<HelpCategory, string> = {
    'getting-started': '🚀 Getting Started',
    'features': '⚙️ Features',
    'reference': '📚 Reference',
    'advanced': '🎯 Advanced',
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
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
                  onClick={() => setActiveHelpSection(section.id)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
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

      {filteredSections.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          No results found for "{searchQuery}"
        </div>
      )}
    </div>
  );
};
