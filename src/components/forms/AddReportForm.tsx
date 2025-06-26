// src/components/forms/AddReportForm.tsx
'use client';

import { useState, FormEvent, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Check, AlertCircle, Cog, FileText, UploadCloud, PlusCircle, File as FileIcon, X } from 'lucide-react';

export function AddReportForm() {
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex hooks
  const machines = useQuery(api.reports.getMachinesForSelect);
  const generateUploadUrl = useMutation(api.reports.generateUploadUrl);
  const addReport = useMutation(api.reports.addReport);

  const resetForm = () => {
    setSelectedMachine('');
    setDescription('');
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setError('');
    setSuccess(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !description || !file) {
      setError('Please fill out all fields and select a file.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await addReport({
        machineId: selectedMachine as Id<'machines'>,
        description,
        storageId,
        fileName: file.name,
        fileType: file.type,
      });

      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      let errorMessage = 'Failed to add report. Please try again.';
      if (err instanceof Error) { 
        errorMessage = err.message; 
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 text-green-900 border border-green-200 rounded-lg text-center">
        <div className="flex items-center justify-center mb-2">
          <Check className="h-6 w-6 text-green-600 mr-2" />
          <p className="font-semibold text-base">Report Added Successfully!</p>
        </div>
        <p className="text-sm text-green-700 mb-4">
          The new report is now available in the machine development reports list.
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Another Report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="machine" className="block text-sm font-medium text-slate-700 mb-1">
            <Cog className="h-4 w-4 inline mr-1.5" />
            Machine Model
          </label>
          <select
            id="machine"
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="block w-full rounded-md border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-400"
            required
          >
            <option value="" disabled>
              {machines === undefined ? "Loading..." : "Select a machine"}
            </option>
            {machines?.map((machine) => (
              <option key={machine._id} value={machine._id}>
                {machine.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            <FileText className="h-4 w-4 inline mr-1.5" />
            Brief Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-400"
            placeholder="Enter a brief description of the report..."
            required
          />
        </div>

        {/* --- MOBILE-FRIENDLY FILE INPUT --- */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <UploadCloud className="h-4 w-4 inline mr-1.5" />
            Report File
          </label>
          {file ? (
            <div className="mt-2 flex items-center justify-between p-3 border rounded-md bg-slate-50">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="h-6 w-6 text-slate-500 flex-shrink-0" />
                <div className="text-sm overflow-hidden">
                  <p className="font-medium text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 flex-shrink-0 ml-2"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label htmlFor="file-upload" className="mt-2 flex justify-center items-center gap-2 w-full px-6 py-4 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
              <UploadCloud className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Choose a file to upload</span>
              <input 
                ref={fileInputRef} 
                id="file-upload" 
                type="file" 
                className="sr-only" 
                accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} 
                required 
              />
            </label>
          )}
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting || !selectedMachine || !description || !file} 
        className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Submitting Report...
          </>
        ) : (
          <>
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Report
          </>
        )}
      </button>
    </form>
  );
}