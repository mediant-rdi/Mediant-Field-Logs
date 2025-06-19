'use client';

import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api'; // Adjust path if needed
import { Id, Doc } from '../../../../../convex/_generated/dataModel';

// The form data type no longer includes engineerName or serviceDate
type CombinedFormData = {
  modelTypes: string;
  branchLocation: string;
  problemType: '' | 'electrical' | 'mechanical' | 'software' | 'service-delay' | 'other';
  complaintText: string;
  solution: string;
  backofficeAccess: boolean;
  spareDelay: boolean;
  delayedReporting: boolean;
  communicationBarrier: boolean;
  otherText: string;
};

const initialState: CombinedFormData = {
  // engineerName and serviceDate are removed from the initial state
  modelTypes: '',
  branchLocation: '',
  problemType: '',
  complaintText: '',
  solution: '',
  backofficeAccess: false,
  spareDelay: false,
  delayedReporting: false,
  communicationBarrier: false,
  otherText: '',
};

export default function ServiceDelayForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelTypesContainerRef = useRef<HTMLDivElement>(null); // Ref for the container

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const submitServiceReport = useMutation(api.serviceReports.submitServiceReport);

  const [formData, setFormData] = useState<CombinedFormData>(initialState);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- NEW: Use Convex's useQuery to get machine suggestions ---
  const machineSuggestions = useQuery(
    api.machines.searchByName,
    // The query will re-run whenever `formData.modelTypes` changes
    { searchText: formData.modelTypes }
  ) ?? []; // Default to an empty array if the query is loading

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    if (name === 'modelTypes') {
      setShowSuggestions(true); // Show suggestions when user types in the modelTypes field
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData(initialState);
    handleRemoveFile();
  };
  
  // --- NEW: Handle clicking on a suggestion ---
  const handleSuggestionClick = (machineName: string) => {
    setFormData((prevData) => ({ ...prevData, modelTypes: machineName }));
    setShowSuggestions(false); // Hide the list after selection
  };
  
  // --- NEW: Hide suggestions when clicking outside ---
  // A simple way is to use the onBlur event on the container
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // We use a timeout to allow click events on suggestions to register
    if (!e.currentTarget.contains(e.relatedTarget)) {
        setTimeout(() => setShowSuggestions(false), 100);
    }
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.problemType === '') {
        alert('Please select a Problem Type from the dropdown.');
        return;
    }

    setIsSubmitting(true);
    
    try {
      let imageId: Id<"_storage"> | undefined = undefined;
      if (file) {
        const uploadUrl = await generateUploadUrl(); 
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await submitServiceReport({
        ...formData,
        problemType: formData.problemType,
        imageId: imageId,
      });
      
      alert('Report submitted successfully for approval!');
      resetForm();

    } catch (error) {
      console.error("Failed to submit report:", error);
      alert("There was an error submitting your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Service Delay & Complaint Form</h1>
      <p>Fill out the details below for a new comprehensive report.</p>
      
      <form onSubmit={handleSubmit} className="report-form">
        
        {/* --- UPDATED: Model Types input with Autocomplete --- */}
        <div 
            className="form-group" 
            ref={modelTypesContainerRef} 
            onBlur={handleBlur} // Use onBlur on the container
        >
          <label htmlFor="modelTypes">Model Types</label>
          <input 
            type="text" 
            id="modelTypes" 
            name="modelTypes" 
            value={formData.modelTypes} 
            onChange={handleChange} 
            required 
            autoComplete="off" // Disable browser's native autocomplete
            onFocus={() => setShowSuggestions(true)} // Show on focus
          />
          {showSuggestions && formData.modelTypes && machineSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {machineSuggestions.map((machine: Doc<"machines">) => (
                <li
                  key={machine._id}
                  onClick={() => handleSuggestionClick(machine.name)}
                  // Use onMouseDown to prevent blur event from firing first
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {machine.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="branchLocation">Branch Location</label>
          <input type="text" id="branchLocation" name="branchLocation" value={formData.branchLocation} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="problemType">Problem Type</label>
          <select id="problemType" name="problemType" value={formData.problemType} onChange={handleChange} required >
            <option value="" disabled>Choose problem type...</option>
            <option value="electrical">Electrical</option>
            <option value="mechanical">Mechanical</option>
            <option value="software">Software</option>
            <option value="service-delay">Service Delay</option>
            <option value="other">Other</option>
          </select>
        </div>

        {formData.problemType === 'service-delay' && (
          <div className="conditional-group">
            <label>Service Delay Details (select all that apply)</label>
            <div className="checkbox-grid">
              <div className="checkbox-group"><input type="checkbox" id="backofficeAccess" name="backofficeAccess" checked={formData.backofficeAccess} onChange={handleChange} /><label htmlFor="backofficeAccess">Delayed backoffice access</label></div>
              <div className="checkbox-group"><input type="checkbox" id="spareDelay" name="spareDelay" checked={formData.spareDelay} onChange={handleChange} /><label htmlFor="spareDelay">Spare delay</label></div>
              <div className="checkbox-group"><input type="checkbox" id="delayedReporting" name="delayedReporting" checked={formData.delayedReporting} onChange={handleChange} /><label htmlFor="delayedReporting">Delayed reporting</label></div>
              <div className="checkbox-group"><input type="checkbox" id="communicationBarrier" name="communicationBarrier" checked={formData.communicationBarrier} onChange={handleChange} /><label htmlFor="communicationBarrier">Communication barrier</label></div>
            </div>
          </div>
        )}

        {formData.problemType === 'other' && (
          <div className="conditional-group">
            <label htmlFor="otherText">Please specify the problem</label>
            <textarea id="otherText" name="otherText" value={formData.otherText} onChange={handleChange} rows={3} placeholder="Describe the specific problem..." required />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="complaintText">Full Problem Details</label>
          <textarea id="complaintText" name="complaintText" value={formData.complaintText} onChange={handleChange} rows={4} placeholder="Describe the issue in detail..." required/>
        </div>

        <div className="form-group">
          <label className="file-input-label">Attach a Picture (Optional)</label>
          <div className="file-input-wrapper">
             <label htmlFor="complaintImage" className="file-upload-button">Choose File</label>
             <input type="file" id="complaintImage" name="complaintImage" className="file-input-hidden" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} ref={fileInputRef}/>
             {file && <span className="file-name">{file.name}</span>}
          </div>

          {imagePreview && (
            <div className="image-preview">
              <Image src={imagePreview} alt="Complaint preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
              <button type="button" onClick={handleRemoveFile} className="remove-image-button" aria-label="Remove Image"></button>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="solution">Solution Provided</label>
          <textarea id="solution" name="solution" value={formData.solution} onChange={handleChange} rows={4} placeholder="Describe the solution..." required />
        </div>
        
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Full Report'}
        </button>
      </form>

      {/* --- ADD NEW STYLES for the suggestions list --- */}
      <style jsx>{`
        .form-container { max-width: 800px; margin: 0 auto; padding: 24px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; position: relative; } /* Added position: relative */
        .form-group > label { margin-bottom: 8px; font-weight: 500; }
        input[type="text"], textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        .submit-button:disabled { background-color: #a0aec0; cursor: not-allowed; }
        
        /* --- Styles for the new suggestions dropdown --- */
        .suggestions-list {
          position: absolute;
          top: 100%; /* Position it right below the input */
          left: 0;
          right: 0;
          background-color: white;
          border: 1px solid #cbd5e0;
          border-top: none;
          border-radius: 0 0 6px 6px;
          list-style-type: none;
          margin: 0;
          padding: 0;
          z-index: 10;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .suggestions-list li {
          padding: 10px 12px;
          cursor: pointer;
        }
        .suggestions-list li:hover {
          background-color: #f7fafc;
        }
        /* --- End of new styles --- */

        .conditional-group { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-top: -10px; }
        .conditional-group > label { font-weight: 500; margin-bottom: 12px; display: block; }
        
        .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
        .checkbox-group { display: flex; align-items: center; }
        .checkbox-group input[type="checkbox"] { width: 20px; height: 20px; margin-right: 12px; cursor: pointer; }
        .checkbox-group label { font-weight: normal; cursor: pointer; margin-bottom: 0; }

        .file-input-label { font-weight: 500; }
        .file-input-wrapper { display: flex; align-items: center; gap: 12px; }
        .file-input-hidden { display: none; }
        .file-upload-button { display: inline-block; padding: 8px 16px; background-color: #edf2f7; border: 1px solid #cbd5e0; border-radius: 4px; cursor: pointer; font-weight: 500; transition: background-color 0.2s; }
        .file-upload-button:hover { background-color: #e2e8f0; }
        .file-name { color: #4a5568; font-size: 14px; }
        
        .image-preview { margin-top: 16px; position: relative; width: 200px; }
        .remove-image-button { position: absolute; top: 8px; right: 8px; background-color: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; line-height: 1; }
        .remove-image-button:after { content: '×'; }
        .remove-image-button:hover { background-color: rgba(255, 0, 0, 0.8); }

        .submit-button { padding: 12px 20px; background-color: #3182ce; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
        .submit-button:hover { background-color: #2b6cb0; }
      `}</style>
    </div>
  );
}