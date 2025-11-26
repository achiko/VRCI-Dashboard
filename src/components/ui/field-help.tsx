'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface FieldHelpProps {
  helpText: string;
  className?: string;
}

export function FieldHelp({ helpText, className = '' }: FieldHelpProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${className}`}
          onClick={(e) => e.preventDefault()}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-md p-4">
        <div className="text-sm whitespace-pre-line">{helpText}</div>
      </TooltipContent>
    </Tooltip>
  );
}

interface LabelWithHelpProps {
  htmlFor?: string;
  children: React.ReactNode;
  helpText: string;
  className?: string;
}

export function LabelWithHelp({ htmlFor, children, helpText, className = '' }: LabelWithHelpProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className={`text-sm font-medium ${className}`}>
        {children}
      </label>
      <FieldHelp helpText={helpText} />
    </div>
  );
}

