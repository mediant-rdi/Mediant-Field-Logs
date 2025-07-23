// src/components/forms/AddManualForm.tsx
'use client';

import { useState, FormEvent, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Check, UploadCloud, File as FileIcon, X, PlusCircle } from 'lucide-react';

export function AddManualForm() {
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CONVEX HOOKS: Updated to use `manuals` and `machines` API ---
  // Assuming a query exists to get machines, we can reuse it. Let's create `api.machines.getMachineOptions`.
  const machines = useQuery(api.machines.getMachineOptions); 
  const generateUploadUrl = useMutation(api.reports.generateUploadUrl); // File upload URL generation can be reused.
  const createManual = useMutation(api.manuals.createManual);

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
      // Step 1: Get a URL to upload the file to
      const postUrl = await generateUploadUrl();
      
      // Step 2: Upload the file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // Step 3: Create the manual record in the database with the file's storage ID
      await createManual({
        machineId: selectedMachine as Id<'machines'>,
        description,
        fileStorageId: storageId, // Use the correct field name from the mutation
        fileName: file.name,
        fileType: file.type,
      });

      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      let errorMessage = 'Failed to add manual. Please try again.';
      if (err instanceof Error) { 
        errorMessage = err.message; 
      } else {
        errorMessage = "An unexpected error occurred. Please try again.";
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 text-center rounded-lg">
        <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Manual Added Successfully!</h3>
        <p className="text-sm text-gray-600 mt-2 mb-4">
          The new manual is now available for the selected machine.
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Another Manual
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <div>
        <label htmlFor="machine" className="block text-sm font-medium text-gray-700">
          Machine Model
        </label>
        <select
          id="machine"
          value={selectedMachine}
          onChange={(e) => setSelectedMachine(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Brief Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter a brief description of the manual..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Manual File
        </label>
        {file ? (
          <div className="mt-1 flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileIcon className="h-6 w-6 text-gray-500 flex-shrink-0" />
              <div className="text-sm overflow-hidden">
                <p className="font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-200 flex-shrink-0 ml-2"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label htmlFor="file-upload" className="mt-1 flex justify-center items-center gap-2 w-full px-6 py-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
            <UploadCloud className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Choose a file to upload</span>
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
      
      <button 
        type="submit" 
        disabled={isSubmitting || !selectedMachine || !description || !file} 
        className="w-full flex justify-center items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-blue-300"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Submitting...
          </>
        ) : (
          "Add Manual"
        )}
      </button>
    </form>
  );
}