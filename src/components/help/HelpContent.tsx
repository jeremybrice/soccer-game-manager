/**
 * Help Content Display
 *
 * Philosophy: Clear typography, scannable content, actionable links.
 * Renders markdown with custom link handling for internal navigation.
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { useAppStore } from '../../store';
import { helpSections } from '../../data/helpContent';

export const HelpContent: React.FC = () => {
  const activeHelpSection = useAppStore((state) => state.activeHelpSection);
  const setActiveHelpSection = useAppStore((state) => state.setActiveHelpSection);

  const currentSection = useMemo(() => {
    return helpSections.find((s) => s.id === activeHelpSection);
  }, [activeHelpSection]);

  // Custom markdown components
  const components: Components = {
    // Custom link handler for internal navigation
    a: ({ node, href, children, ...props }) => {
      if (href?.startsWith('#')) {
        const sectionId = href.substring(1);
        return (
          <button
            onClick={() => setActiveHelpSection(sectionId)}
            className="text-raiders-red hover:underline font-medium"
          >
            {children}
          </button>
        );
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-raiders-red hover:underline"
          {...props}
        >
          {children}
        </a>
      );
    },
    // Style tables
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-gray-300" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th className="bg-raiders-navy text-white px-4 py-2 border border-gray-300 text-left" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="px-4 py-2 border border-gray-300" {...props} />
    ),
    // Style code blocks
    code: ({ node, className, children, ...props }) => {
      const isInline = !className || !className.includes('language-');
      if (isInline) {
        return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-raiders-red" {...props}>{children}</code>;
      }
      return <code className="block bg-gray-100 p-3 rounded my-2 text-sm font-mono overflow-x-auto" {...props}>{children}</code>;
    },
    pre: ({ node, ...props }) => (
      <pre className="bg-gray-100 p-4 rounded my-4 overflow-x-auto" {...props} />
    ),
    // Style headings
    h1: ({ node, ...props }) => (
      <h1 className="text-3xl font-bold mb-4 text-raiders-navy" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-2xl font-bold mt-6 mb-3 text-raiders-navy" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-xl font-bold mt-4 mb-2 text-raiders-navy" {...props} />
    ),
    // Style lists
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside my-3 space-y-1" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside my-3 space-y-1" {...props} />
    ),
    // Style blockquotes
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-raiders-red pl-4 py-2 my-4 italic text-gray-700" {...props} />
    ),
  };

  // Default view: Table of contents
  if (!currentSection) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-raiders-navy">
          Welcome to Raiders Game Manager Help
        </h1>
        <p className="text-gray-700 mb-8">
          Select a topic from the sidebar to get started, or use the search bar above to find what you need.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {helpSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveHelpSection(section.id)}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-raiders-red hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{section.icon}</div>
              <h3 className="text-lg font-semibold text-raiders-navy mb-1">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600">
                {section.content.split('\n').find((line) => line.trim().length > 0 && !line.startsWith('#'))?.substring(0, 100)}...
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Specific section view
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <article className="prose prose-lg max-w-none">
        <ReactMarkdown components={components}>
          {currentSection.content}
        </ReactMarkdown>
      </article>
    </div>
  );
};
