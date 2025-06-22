// src/components/forms/ComplaintForm.tsx
'use client';

import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react'; // UPDATED: Added useQuery
import { api } from '../../../../../convex/_generated/api';
import { Id, Doc } from '../../../../../convex/_generated/dataModel'; // UPDATED: Added Doc

// The form data type remains the same
type FormData = {
  modelType: string;
  branchLocation: string;
  problemType: '' | 'equipment-fault' | 'poor-experience' | 'other';
  fault_oldAge: boolean;
  fault_frequentBreakdowns: boolean;
  fault_undoneRepairs: boolean;
  experience_paperJamming: boolean;
  experience_noise: boolean;
  experience_freezing: boolean;
  experience_dust: boolean;
  experience_buttonsSticking: boolean;
  otherProblemDetails: string;
  complaintText: string;
  solution: string;
};

const initialState: FormData = {
    modelType: '',
    branchLocation: '',
    problemType: '',
    fault_oldAge: false,
    fault_frequentBreakdowns: false,
    fault_undoneRepairs: false,
    experience_paperJamming: false,
    experience_noise: false,
    experience_freezing: false,
    experience_dust: false,
    experience_buttonsSticking: false,
    otherProblemDetails: '',
    complaintText: '',
    solution: '',
};

export default function ComplaintForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // NEW: Refs for suggestion containers
  const modelTypeContainerRef = useRef<HTMLDivElement>(null);
  const branchLocationContainerRef = useRef<HTMLDivElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const submitComplaint = useMutation(api.complaints.submitComplaint);

  const [formData, setFormData] = useState<FormData>(initialState);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // NEW: State for suggestion visibility
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);

  // NEW: Query for machine suggestions, using `formData.modelType`
  const machineSuggestions = useQuery(
    api.machines.searchByName,
    { searchText: formData.modelType }
  ) ?? [];

  // NEW: Query for branch suggestions
  const branchSuggestions = useQuery(
    api.clients.searchLocations,
    { searchText: formData.branchLocation }
  ) ?? [];

  // UPDATED: handleChange now controls suggestion visibility
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    if (name === 'modelType') setShowModelSuggestions(true);
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
  }
  
  // NEW: Handlers for selecting a suggestion
  const handleModelSuggestionClick = (machineName: string) => {
    setFormData((prevData) => ({ ...prevData, modelType: machineName }));
    setShowModelSuggestions(false);
  };
  
  const handleBranchSuggestionClick = (displayText: string) => {
    setFormData((prevData) => ({ ...prevData, branchLocation: displayText }));
    setShowBranchSuggestions(false);
  };

  // NEW: Handler to close suggestions when clicking away
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
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await submitComplaint({ ...formData, problemType: formData.problemType, imageId });

      alert('Complaint submitted successfully for approval!');
      resetForm();
      setIsReviewing(false);

    } catch (error) {
      console.error("Failed to submit complaint:", error);
      alert("There was an error submitting your complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      {isReviewing ? (
        <div className="review-container">
          {/* ... Review section remains unchanged ... */}
          <h1>Review Your Complaint</h1>
          <p>Please review the details below before the final submission.</p>
          <div className="review-grid">
            <div className="review-item"><strong>Model Type:</strong><p>{formData.modelType}</p></div>
            <div className="review-item"><strong>Branch Location:</strong><p>{formData.branchLocation}</p></div>
            <div className="review-item full-width"><strong>Problem Type:</strong><p style={{textTransform: 'capitalize'}}>{formData.problemType.replace('-', ' ')}</p></div>
            {formData.problemType === 'equipment-fault' && ( <div className="review-item full-width"><strong>Fault Details:</strong><ul> {formData.fault_oldAge && <li>Old Age</li>} {formData.fault_frequentBreakdowns && <li>Frequent Breakdowns</li>} {formData.fault_undoneRepairs && <li>Undone Previous Repairs</li>} </ul> </div> )}
            {formData.problemType === 'poor-experience' && ( <div className="review-item full-width"><strong>Experience Details:</strong><ul> {formData.experience_paperJamming && <li>Paper Jamming</li>} {formData.experience_noise && <li>Noise</li>} {formData.experience_freezing && <li>Freezing</li>} {formData.experience_dust && <li>Dust</li>} {formData.experience_buttonsSticking && <li>Buttons Sticking</li>} </ul> </div> )}
            {formData.problemType === 'other' && ( <div className="review-item full-width"><strong>Specific Problem:</strong><p>{formData.otherProblemDetails}</p></div> )}
            <div className="review-item full-width"><strong>Complaint Details:</strong><p>{formData.complaintText}</p></div>
            <div className="review-item full-width"><strong>Solution Provided:</strong><p>{formData.solution}</p></div>
            {imagePreview && ( <div className="review-item full-width"><strong>Attached Picture:</strong><div className="image-preview" style={{ marginTop: '8px' }}><Image src={imagePreview} alt="Complaint preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/></div></div> )}
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
          <h1>Complaint Logging Form</h1>
          <p>Fill out the details below for a new complaint report.</p>
          
          <form onSubmit={handleProceedToReview} className="report-form">
            {/* UPDATED: Model Type input with suggestions */}
            <div className="form-group" ref={modelTypeContainerRef} onBlur={(e) => handleBlur(e, 'model')}>
              <label htmlFor="modelType">Model Type</label>
              <input type="text" id="modelType" name="modelType" value={formData.modelType} onChange={handleChange} required autoComplete="off" onFocus={() => setShowModelSuggestions(true)} />
              {showModelSuggestions && formData.modelType && machineSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {machineSuggestions.map((machine: Doc<"machines">) => (
                    <li key={machine._id} onClick={() => handleModelSuggestionClick(machine.name)} onMouseDown={(e) => e.preventDefault()}>
                      {machine.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* UPDATED: Branch Location input with suggestions */}
            <div className="form-group" ref={branchLocationContainerRef} onBlur={(e) => handleBlur(e, 'branch')}>
              <label htmlFor="branchLocation">Branch Location</label>
              <input type="text" id="branchLocation" name="branchLocation" value={formData.branchLocation} onChange={handleChange} required autoComplete="off" onFocus={() => setShowBranchSuggestions(true)} />
              {showBranchSuggestions && formData.branchLocation && branchSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {branchSuggestions.map((suggestion) => (
                    <li key={suggestion._id} onClick={() => handleBranchSuggestionClick(suggestion.displayText)} onMouseDown={(e) => e.preventDefault()}>
                      {suggestion.displayText}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ... rest of the form is unchanged ... */}
            <div className="form-group">
              <label htmlFor="problemType">Problem Type</label>
              <select id="problemType" name="problemType" value={formData.problemType} onChange={handleChange} required>
                <option value="" disabled>Choose complaint type...</option>
                <option value="equipment-fault">Equipment Fault</option>
                <option value="poor-experience">Poor Experience</option>
                <option value="other">Other</option>
              </select>
            </div>
            {formData.problemType === 'equipment-fault' && ( <div className="conditional-group"><label>Fault Details (select all that apply)</label><div className="checkbox-grid"><div className="checkbox-group"><input type="checkbox" id="fault_oldAge" name="fault_oldAge" checked={formData.fault_oldAge} onChange={handleChange} /><label htmlFor="fault_oldAge">Old Age</label></div><div className="checkbox-group"><input type="checkbox" id="fault_frequentBreakdowns" name="fault_frequentBreakdowns" checked={formData.fault_frequentBreakdowns} onChange={handleChange} /><label htmlFor="fault_frequentBreakdowns">Frequent Breakdowns</label></div><div className="checkbox-group"><input type="checkbox" id="fault_undoneRepairs" name="fault_undoneRepairs" checked={formData.fault_undoneRepairs} onChange={handleChange} /><label htmlFor="fault_undoneRepairs">Undone Previous Repairs</label></div></div></div> )}
            {formData.problemType === 'poor-experience' && ( <div className="conditional-group"><label>Experience Details (select all that apply)</label><div className="checkbox-grid"><div className="checkbox-group"><input type="checkbox" id="experience_paperJamming" name="experience_paperJamming" checked={formData.experience_paperJamming} onChange={handleChange} /><label htmlFor="experience_paperJamming">Paper Jamming</label></div><div className="checkbox-group"><input type="checkbox" id="experience_noise" name="experience_noise" checked={formData.experience_noise} onChange={handleChange} /><label htmlFor="experience_noise">Noise</label></div><div className="checkbox-group"><input type="checkbox" id="experience_freezing" name="experience_freezing" checked={formData.experience_freezing} onChange={handleChange} /><label htmlFor="experience_freezing">Freezing</label></div><div className="checkbox-group"><input type="checkbox" id="experience_dust" name="experience_dust" checked={formData.experience_dust} onChange={handleChange} /><label htmlFor="experience_dust">Dust</label></div><div className="checkbox-group"><input type="checkbox" id="experience_buttonsSticking" name="experience_buttonsSticking" checked={formData.experience_buttonsSticking} onChange={handleChange} /><label htmlFor="experience_buttonsSticking">Buttons Sticking</label></div></div></div> )}
            {formData.problemType === 'other' && ( <div className="conditional-group"><label htmlFor="otherProblemDetails">Please specify the problem</label><textarea id="otherProblemDetails" name="otherProblemDetails" value={formData.otherProblemDetails} onChange={handleChange} rows={3} placeholder="Describe the specific problem here..." required /></div> )}
            <div className="form-group"><label htmlFor="complaintText">Complaint Details</label><textarea id="complaintText" name="complaintText" value={formData.complaintText} onChange={handleChange} rows={4} placeholder="Provide a full description of the complaint..." required /></div>
            <div className="form-group"><label className="file-input-label">Attach a Picture (Optional)</label><div className="file-input-wrapper"><label htmlFor="complaintImage" className="file-upload-button">Choose File</label><input type="file" id="complaintImage" name="complaintImage" className="file-input-hidden" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} ref={fileInputRef} />{file && <span className="file-name">{file.name}</span>}</div>{imagePreview && ( <div className="image-preview"><Image src={imagePreview} alt="Complaint preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/><button type="button" onClick={handleRemoveFile} className="remove-image-button" aria-label="Remove image"></button></div> )}</div>
            <div className="form-group"><label htmlFor="solution">Solution Provided</label><textarea id="solution" name="solution" value={formData.solution} onChange={handleChange} rows={4} placeholder="Describe the solution implemented..." required /></div>
            <button type="submit" className="submit-button">Review Report</button>
          </form>
        </>
      )}

      {/* UPDATED: Styles added for suggestions */}
      <style jsx>{`
        .form-container { max-width: 800px; margin: 0 auto; padding: 24px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; position: relative; } /* Added position: relative */
        .form-group > label { margin-bottom: 8px; font-weight: 500; }
        input[type="text"], textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        .conditional-group { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-top: -10px; }
        .conditional-group > label { font-weight: 500; margin-bottom: 12px; display: block; }
        .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .checkbox-group { display: flex; align-items: center; }
        .checkbox-group input[type="checkbox"] { width: 20px; height: 20px; margin-right: 10px; cursor: pointer; }
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
        .submit-button, .edit-button { padding: 12px 20px; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; border: none; }
        .submit-button { background-color: #3182ce; color: white; }
        .submit-button:hover { background-color: #2b6cb0; }
        .submit-button:disabled { background-color: #a0aec0; cursor: not-allowed; }
        .edit-button { background-color: #e2e8f0; color: #2d3748; border: 1px solid #cbd5e0; }
        .edit-button:hover { background-color: #cbd5e0; }
        .review-container { display: flex; flex-direction: column; }
        .review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; background-color: #f7fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;}
        .review-item { word-wrap: break-word; }
        .review-item.full-width { grid-column: span 2; }
        .review-item strong { display: block; margin-bottom: 6px; color: #2d3748; }
        .review-item p, .review-item ul { margin: 0; color: #4a5568; white-space: pre-wrap; }
        .review-item ul { padding-left: 20px; list-style: disc; }
        .review-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
        
        /* NEW: Styles for suggestion dropdowns */
        .suggestions-list {
          position: absolute;
          top: 100%;
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
      `}</style>
    </div>
  );
}