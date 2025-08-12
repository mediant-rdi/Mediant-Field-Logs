// src/components/modals/CompletionNotesModal.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface CompletionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
  isSubmitting: boolean;
}

export function CompletionNotesModal({ isOpen, onClose, onSubmit, isSubmitting }: CompletionNotesModalProps) {
  const [notes, setNotes] = useState('');

  // Reset notes when the modal is closed and then reopened
  useEffect(() => {
    if (isOpen) {
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(notes);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg p-4 mx-4 bg-white rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <h2 id="modal-title" className="text-xl font-bold text-gray-900">
              Add Completion Notes
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {/* FIX: Replaced literal quotes with &quot; HTML entity */}
              Please provide any notes for this job (e.g., &quot;Went with engineer X&quot;, &quot;Client was helpful&quot;). This is optional.
            </p>

            <div className="mt-4">
              <label htmlFor="completion-notes" className="sr-only">Completion Notes</label>
              <textarea
                id="completion-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Type your notes here..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm & Finish Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}