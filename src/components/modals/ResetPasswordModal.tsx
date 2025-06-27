// src/components/modals/ResetPasswordModal.tsx
"use client";

import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetUrl: string;
}

export function ResetPasswordModal({ isOpen, onClose, resetUrl }: ResetPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!resetUrl) return;
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Reset Link Generated</h3>
            <p className="mt-2 text-sm text-slate-600">
                Securely share this one-time link with the user. It will expire in 1 hour.
            </p>
        </div>

        <div className="mt-6">
            <label htmlFor="reset-url" className="text-sm font-medium text-slate-700">Password Reset Link</label>
            <div className="mt-1 flex items-center">
                <input
                    id="reset-url"
                    type="text"
                    readOnly
                    value={resetUrl}
                    className="flex-1 rounded-l-md border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-0 font-mono"
                />
                <button
                    type="button"
                    onClick={handleCopy}
                    className={`relative flex h-[42px] w-28 items-center justify-center rounded-r-md px-3 text-white transition-colors ${
                        copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    title={copied ? "Copied!" : "Copy to clipboard"}
                >
                    {copied ? (
                        <>
                            <Check className="h-5 w-5 mr-1" /> Copied
                        </>
                    ) : (
                        <>
                            <Copy className="h-5 w-5 mr-1" /> Copy
                        </>
                    )}
                </button>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
            <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}