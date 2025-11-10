/**
 * Help Icon Button
 *
 * Philosophy: Help should be accessible but unobtrusive.
 * Single tap opens comprehensive documentation.
 */

import React from 'react';
import { useAppStore } from '../../store';

export const HelpIcon: React.FC = () => {
  const openHelp = useAppStore((state) => state.openHelp);

  return (
    <button
      data-tour="help-icon"
      onClick={() => openHelp()}
      className="touch-target p-2 text-white hover:text-raiders-red transition-colors"
      aria-label="Help and documentation"
      title="Help"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
  );
};
