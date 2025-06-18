// src/components/forms/ComplaintForm.tsx
'use client';

import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';

// 1. Define a more complex state type to hold all possible fields
type FormData = {
  modelType: string;
  branchLocation: string;
  problemType: 'equipment-fault' | 'poor-experience' | 'other';
  
  // Checkboxes for 'equipment-fault'
  fault_oldAge: boolean;
  fault_frequentBreakdowns: boolean;
  fault_undoneRepairs: boolean;
  
  // Checkboxes for 'poor-experience'
  experience_paperJamming: boolean;
  experience_noise: boolean;
  experience_freezing: boolean;
  experience_dust: boolean;
  experience_buttonsSticking: boolean;

  // Textbox for 'other'
  otherProblemDetails: string;

  // Final fields
  complaintText: string;
  solution: string;
};

export default function ComplaintForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Initialize the comprehensive state object
  const [formData, setFormData] = useState<FormData>({
    modelType: '',
    branchLocation: '',
    problemType: 'equipment-fault', // Default selection
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
  });

  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 3. A universal handler that works for text inputs, textareas, selects, and checkboxes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const isCheckbox = type === 'checkbox';
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submissionData = new FormData();
    
    // Append all data to the FormData object for submission
    Object.entries(formData).forEach(([key, value]) => {
      submissionData.append(key, String(value));
    });

    if (file) {
      submissionData.append('complaintImage', file);
    }

    console.log('--- Dynamic Form Submitted ---');
    for (let [key, value] of submissionData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log('----------------------------');
    
    alert('Form submitted successfully! Check the browser console for the data.');
  };

  return (
    <div className="form-container">
      <h1>Complaint Logging Form</h1>
      <p>Fill out the details below for a new complaint report.</p>
      
      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label htmlFor="modelType">Model Type</label>
          <input type="text" id="modelType" name="modelType" value={formData.modelType} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="branchLocation">Branch Location</label>
          <input type="text" id="branchLocation" name="branchLocation" value={formData.branchLocation} onChange={handleChange} required />
        </div>

        {/* --- DYNAMIC SECTION START --- */}
        <div className="form-group">
          <label htmlFor="problemType">Problem Type</label>
          <select id="problemType" name="problemType" value={formData.problemType} onChange={handleChange} required>
            <option value="equipment-fault">Equipment Fault</option>
            <option value="poor-experience">Poor Experience</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* 4. Conditionally render the correct follow-up questions based on problemType */}
        {formData.problemType === 'equipment-fault' && (
          <div className="conditional-group">
            <label>Fault Details (select all that apply)</label>
            <div className="checkbox-grid">
              <div className="checkbox-group"><input type="checkbox" id="fault_oldAge" name="fault_oldAge" checked={formData.fault_oldAge} onChange={handleChange} /><label htmlFor="fault_oldAge">Old Age</label></div>
              <div className="checkbox-group"><input type="checkbox" id="fault_frequentBreakdowns" name="fault_frequentBreakdowns" checked={formData.fault_frequentBreakdowns} onChange={handleChange} /><label htmlFor="fault_frequentBreakdowns">Frequent Breakdowns</label></div>
              <div className="checkbox-group"><input type="checkbox" id="fault_undoneRepairs" name="fault_undoneRepairs" checked={formData.fault_undoneRepairs} onChange={handleChange} /><label htmlFor="fault_undoneRepairs">Undone Previous Repairs</label></div>
            </div>
          </div>
        )}

        {formData.problemType === 'poor-experience' && (
          <div className="conditional-group">
            <label>Experience Details (select all that apply)</label>
            <div className="checkbox-grid">
              <div className="checkbox-group"><input type="checkbox" id="experience_paperJamming" name="experience_paperJamming" checked={formData.experience_paperJamming} onChange={handleChange} /><label htmlFor="experience_paperJamming">Paper Jamming</label></div>
              <div className="checkbox-group"><input type="checkbox" id="experience_noise" name="experience_noise" checked={formData.experience_noise} onChange={handleChange} /><label htmlFor="experience_noise">Noise</label></div>
              <div className="checkbox-group"><input type="checkbox" id="experience_freezing" name="experience_freezing" checked={formData.experience_freezing} onChange={handleChange} /><label htmlFor="experience_freezing">Freezing</label></div>
              <div className="checkbox-group"><input type="checkbox" id="experience_dust" name="experience_dust" checked={formData.experience_dust} onChange={handleChange} /><label htmlFor="experience_dust">Dust</label></div>
              <div className="checkbox-group"><input type="checkbox" id="experience_buttonsSticking" name="experience_buttonsSticking" checked={formData.experience_buttonsSticking} onChange={handleChange} /><label htmlFor="experience_buttonsSticking">Buttons Sticking</label></div>
            </div>
          </div>
        )}

        {formData.problemType === 'other' && (
          <div className="conditional-group">
            <label htmlFor="otherProblemDetails">Please specify the problem</label>
            <textarea id="otherProblemDetails" name="otherProblemDetails" value={formData.otherProblemDetails} onChange={handleChange} rows={3} placeholder="Describe the specific problem here..." required />
          </div>
        )}
        {/* --- DYNAMIC SECTION END --- */}

        <div className="form-group">
          <label className="file-input-label">Attach a Picture (Optional)</label>
          <div className="file-input-wrapper">
             <label htmlFor="complaintImage" className="file-upload-button">Choose File</label>
             <input type="file" id="complaintImage" name="complaintImage" className="file-input-hidden" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} ref={fileInputRef} />
             {file && <span className="file-name">{file.name}</span>}
          </div>
          {imagePreview && (
            <div className="image-preview">
              <Image src={imagePreview} alt="Complaint preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
              <button type="button" onClick={handleRemoveFile} className="remove-image-button" aria-label="Remove image"></button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="complaintText">Complaint Details</label>
          <textarea id="complaintText" name="complaintText" value={formData.complaintText} onChange={handleChange} rows={4} placeholder="Provide a full description of the complaint..." required />
        </div>

        <div className="form-group">
          <label htmlFor="solution">Solution Provided</label>
          <textarea id="solution" name="solution" value={formData.solution} onChange={handleChange} rows={4} placeholder="Describe the solution implemented..." required />
        </div>
        
        <button type="submit" className="submit-button">Submit Report</button>
      </form>

      <style jsx>{`
        .form-container { max-width: 800px; margin: 0 auto; padding: 24px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; }
        input[type="text"], textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        
        /* 5. Styling for the new dynamic sections */
        .conditional-group {
          background-color: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          margin-top: -10px; /* Pulls it closer to the dropdown above */
        }
        .conditional-group > label { font-weight: 500; margin-bottom: 12px; display: block; }
        
        .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        .checkbox-group { display: flex; align-items: center; }
        .checkbox-group input[type="checkbox"] { width: 20px; height: 20px; margin-right: 10px; cursor: pointer; }
        .checkbox-group label { font-weight: normal; cursor: pointer; margin-bottom: 0; }
        
        .file-input-label { margin-top: 16px; font-weight: 500; }
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