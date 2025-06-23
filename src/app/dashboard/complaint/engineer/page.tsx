// app/dashboard/complaint/engineer/page.tsx
'use client';

import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id, Doc } from '../../../../../convex/_generated/dataModel';

// --- All the TypeScript types, initial state, and component logic remain exactly the same ---
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
  const modelTypesContainerRef = useRef<HTMLDivElement>(null);
  const branchLocationContainerRef = useRef<HTMLDivElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const submitServiceReport = useMutation(api.serviceReports.submitServiceReport);

  const [formData, setFormData] = useState<CombinedFormData>(initialState);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const machineSuggestions = useQuery(
    api.machines.searchByName,
    { searchText: formData.modelTypes }
  ) ?? [];

  const branchSuggestions = useQuery(
    api.clients.searchLocations,
    { searchText: formData.branchLocation }
  ) ?? [];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    if (name === 'modelTypes') setShowModelSuggestions(true);
    if (name === 'branchLocation') setShowBranchSuggestions(true);
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
  
  const handleModelSuggestionClick = (machineName: string) => {
    setFormData((prevData) => ({ ...prevData, modelTypes: machineName }));
    setShowModelSuggestions(false);
  };
  
  const handleBranchSuggestionClick = (displayText: string) => {
    setFormData((prevData) => ({ ...prevData, branchLocation: displayText }));
    setShowBranchSuggestions(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>, type: 'model' | 'branch') => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
        setTimeout(() => {
            if (type === 'model') setShowModelSuggestions(false);
            if (type === 'branch') setShowBranchSuggestions(false);
        }, 150);
    }
  };

  const handleProceedToReview = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.problemType === '') {
        alert('Please select a Problem Type from the dropdown.');
        return;
    }
    setIsReviewing(true);
  };
  
  const handleEdit = () => {
    setIsReviewing(false);
  };

  const handleFinalSubmit = async () => {
    if (formData.problemType === '') {
      alert("A problem type must be selected. Please go back and edit your report.");
      setIsReviewing(false);
      return;
    }
    setIsSubmitting(true);
    try {
      let imageId: Id<"_storage"> | undefined = undefined;
      if (file) {
        const uploadUrl = await generateUploadUrl(); 
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        const { storageId } = await result.json();
        imageId = storageId;
      }
      await submitServiceReport({ ...formData, problemType: formData.problemType, imageId: imageId });
      alert('Report submitted successfully for approval!');
      resetForm();
      setIsReviewing(false);
    } catch (error) {
      console.error("Failed to submit report:", error);
      alert("There was an error submitting your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      {isReviewing ? (
        <div className="review-container">
            <h1>Review Your Submission</h1>
            <p>Please review the details below before the final submission.</p>
            <div className="review-grid">
              <div className="review-item"><strong>Model Types:</strong><p>{formData.modelTypes}</p></div>
              <div className="review-item"><strong>Branch Location:</strong><p>{formData.branchLocation}</p></div>
              <div className="review-item full-width"><strong>Problem Type:</strong><p style={{textTransform: 'capitalize'}}>{formData.problemType.replace('-', ' ')}</p></div>
              {formData.problemType === 'service-delay' && ( <div className="review-item full-width"> <strong>Service Delay Details:</strong> <ul> {formData.backofficeAccess && <li>Delayed backoffice access</li>} {formData.spareDelay && <li>Spare delay</li>} {formData.delayedReporting && <li>Delayed reporting</li>} {formData.communicationBarrier && <li>Communication barrier</li>} </ul> </div> )}
              {formData.problemType === 'other' && ( <div className="review-item full-width"><strong>Specific Problem:</strong><p>{formData.otherText}</p></div> )}
              <div className="review-item full-width"><strong>Full Problem Details:</strong><p>{formData.complaintText}</p></div>
              <div className="review-item full-width"><strong>Solution Provided:</strong><p>{formData.solution}</p></div>
              {imagePreview && ( <div className="review-item full-width"> <strong>Attached Picture:</strong> <div className="image-preview" style={{ marginTop: '8px' }}> <Image src={imagePreview} alt="Complaint preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/> </div> </div> )}
            </div>
            <div className="review-actions">
                <button type="button" onClick={handleEdit} className="edit-button">Edit</button>
                <button type="button" onClick={handleFinalSubmit} className="submit-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </button>
            </div>
        </div>
      ) : (
        <>
          <h1>Service Delay & Complaint Form</h1>
          <p>Fill out the details below for a new comprehensive report.</p>
          <form onSubmit={handleProceedToReview} className="report-form">
            <div className="form-group" ref={modelTypesContainerRef} onBlur={(e) => handleBlur(e, 'model')}>
              <label htmlFor="modelTypes">Model Types</label>
              <input type="text" id="modelTypes" name="modelTypes" value={formData.modelTypes} onChange={handleChange} required autoComplete="off" onFocus={() => setShowModelSuggestions(true)} />
              {showModelSuggestions && formData.modelTypes && machineSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {machineSuggestions.map((machine: Doc<"machines">) => (<li key={machine._id} onClick={() => handleModelSuggestionClick(machine.name)} onMouseDown={(e) => e.preventDefault()}>{machine.name}</li>))}
                </ul>
              )}
            </div>
            <div className="form-group" ref={branchLocationContainerRef} onBlur={(e) => handleBlur(e, 'branch')}>
              <label htmlFor="branchLocation">Branch Location</label>
              <input type="text" id="branchLocation" name="branchLocation" value={formData.branchLocation} onChange={handleChange} required autoComplete="off" onFocus={() => setShowBranchSuggestions(true)} />
              {showBranchSuggestions && formData.branchLocation && branchSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {branchSuggestions.map((suggestion) => (<li key={suggestion._id} onClick={() => handleBranchSuggestionClick(suggestion.displayText)} onMouseDown={(e) => e.preventDefault()}>{suggestion.displayText}</li>))}
                </ul>
              )}
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
            {formData.problemType === 'other' && ( <div className="conditional-group"> <label htmlFor="otherText">Please specify the problem</label> <textarea id="otherText" name="otherText" value={formData.otherText} onChange={handleChange} rows={3} placeholder="Describe the specific problem..." required /> </div> )}
            <div className="form-group"> <label htmlFor="complaintText">Full Problem Details</label> <textarea id="complaintText" name="complaintText" value={formData.complaintText} onChange={handleChange} rows={4} placeholder="Describe the issue in detail..." required/> </div>
            <div className="form-group">
              <label className="file-input-label">Attach a Picture (Optional)</label>
              <div className="file-input-wrapper">
                 <label htmlFor="complaintImage" className="file-upload-button">Choose File</label>
                 <input type="file" id="complaintImage" name="complaintImage" className="file-input-hidden" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} ref={fileInputRef}/>
                 {file && <span className="file-name">{file.name}</span>}
              </div>
              {imagePreview && ( <div className="image-preview"> <Image src={imagePreview} alt="Complaint preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/> <button type="button" onClick={handleRemoveFile} className="remove-image-button" aria-label="Remove Image"></button> </div> )}
            </div>
            <div className="form-group"> <label htmlFor="solution">Solution Provided</label> <textarea id="solution" name="solution" value={formData.solution} onChange={handleChange} rows={4} placeholder="Describe the solution..." required /> </div>
            <button type="submit" className="submit-button"> Review Report </button>
          </form>
        </>
      )}

      {/* --- RESPONSIVE CSS UPDATES --- */}
      <style jsx>{`
        /* Mobile-first styles */
        .form-container { max-width: 800px; margin: 0 auto; padding: 16px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; font-size: 14px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; position: relative; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; font-size: 14px; }
        input[type="text"], textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        .suggestions-list { position: absolute; top: 100%; left: 0; right: 0; background-color: white; border: 1px solid #cbd5e0; border-top: none; border-radius: 0 0 6px 6px; list-style-type: none; margin: 0; padding: 0; z-index: 10; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .suggestions-list li { padding: 10px 12px; cursor: pointer; font-size: 14px; }
        .suggestions-list li:hover { background-color: #f7fafc; }
        .conditional-group { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-top: -10px; }
        .conditional-group > label { font-weight: 500; margin-bottom: 12px; display: block; }
        .checkbox-grid { display: grid; grid-template-columns: 1fr; gap: 12px; } /* Single column for mobile */
        .checkbox-group { display: flex; align-items: center; }
        .checkbox-group input[type="checkbox"] { width: 20px; height: 20px; margin-right: 12px; cursor: pointer; flex-shrink: 0; }
        .checkbox-group label { font-weight: normal; cursor: pointer; margin-bottom: 0; }
        .file-input-label { font-weight: 500; }
        .file-input-wrapper { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; } /* Allow wrapping */
        .file-input-hidden { display: none; }
        .file-upload-button { display: inline-block; padding: 8px 16px; background-color: #edf2f7; border: 1px solid #cbd5e0; border-radius: 4px; cursor: pointer; font-weight: 500; transition: background-color 0.2s; white-space: nowrap; }
        .file-upload-button:hover { background-color: #e2e8f0; }
        .file-name { color: #4a5568; font-size: 14px; word-break: break-all; }
        .image-preview { margin-top: 16px; position: relative; width: 100%; max-width: 200px; }
        .remove-image-button { position: absolute; top: 8px; right: 8px; background-color: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; line-height: 1; }
        .remove-image-button:after { content: '×'; }
        .remove-image-button:hover { background-color: rgba(255, 0, 0, 0.8); }
        .submit-button, .edit-button { padding: 12px 20px; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; border: none; width: 100%; } /* Full width buttons */
        .submit-button { background-color: #3182ce; color: white; }
        .submit-button:hover { background-color: #2b6cb0; }
        .submit-button:disabled { background-color: #a0aec0; cursor: not-allowed; }
        .edit-button { background-color: #e2e8f0; color: #2d3748; border: 1px solid #cbd5e0; }
        .edit-button:hover { background-color: #cbd5e0; }
        .review-container { display: flex; flex-direction: column; }
        .review-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 16px; background-color: #f7fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;}
        .review-item { word-wrap: break-word; }
        .review-item.full-width { grid-column: span 1; }
        .review-item strong { display: block; margin-bottom: 6px; color: #2d3748; }
        .review-item p, .review-item ul { margin: 0; color: #4a5568; white-space: pre-wrap; }
        .review-item ul { padding-left: 20px; }
        .review-actions { display: flex; flex-direction: column-reverse; gap: 12px; margin-top: 24px; } /* Stack buttons on mobile */

        /* Styles for medium screens and up (md: 768px) */
        @media (min-width: 768px) {
            .form-container { padding: 24px; }
            h1 { font-size: 24px; }
            p { font-size: 16px; }
            .checkbox-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
            .review-grid { grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px; }
            .review-item.full-width { grid-column: span 2; }
            .review-actions { flex-direction: row; justify-content: flex-end; gap: 16px; }
            .submit-button, .edit-button { width: auto; }
        }
      `}</style>
    </div>
  );
}