// src/components/forms/ServiceDelayForm.tsx
'use client';

import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';

// 1. Update the type for the new dropdown options and to clarify field purposes
type CombinedFormData = {
  modelTypes: string;
  branchLocation: string;
  problemType: 'electrical' | 'mechanical' | 'software' | 'service-delay' | 'other';
  complaintText: string;
  solution: string;
  
  // Checkboxes for 'service-delay'
  backofficeAccess: boolean;
  spareDelay: boolean;
  delayedReporting: boolean;
  communicationBarrier: boolean;

  // Textbox for 'other'
  otherText: string;
};

export default function ServiceDelayForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Update the initial state with the new problemType default
  const [formData, setFormData] = useState<CombinedFormData>({
    modelTypes: '',
    branchLocation: '',
    problemType: 'electrical', // Default selection
    complaintText: '',
    solution: '',
    backofficeAccess: false,
    spareDelay: false,
    delayedReporting: false,
    communicationBarrier: false,
    otherText: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // This universal handler works perfectly for the new dynamic fields
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
    Object.entries(formData).forEach(([key, value]) => {
        submissionData.append(key, String(value));
    });

    if (file) {
      submissionData.append('complaintImage', file);
    }

    console.log('--- Dynamic Service Delay Form Submitted ---');
    console.log('Form Data Object:', formData);
    for (let [key, value] of submissionData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log('------------------------------------------');
    
    alert('Form submitted successfully! Check the browser console for the data.');
  };

  return (
    <div className="form-container">
      <h1>Service Delay & Complaint Form</h1>
      <p>Fill out the details below for a new comprehensive report.</p>
      
      <form onSubmit={handleSubmit} className="report-form">
        
        <div className="form-group">
          <label htmlFor="modelTypes">Model Types</label>
          <input type="text" id="modelTypes" name="modelTypes" value={formData.modelTypes} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="branchLocation">Branch Location</label>
          <input type="text" id="branchLocation" name="branchLocation" value={formData.branchLocation} onChange={handleChange} required />
        </div>

        {/* --- DYNAMIC SECTION START --- */}
        <div className="form-group">
          <label htmlFor="problemType">Problem Type</label>
          {/* 3. Update the dropdown options */}
          <select id="problemType" name="problemType" value={formData.problemType} onChange={handleChange} required >
            <option value="electrical">Electrical</option>
            <option value="mechanical">Mechanical</option>
            <option value="software">Software</option>
            <option value="service-delay">Service Delay</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* 4. Conditionally render the correct follow-up questions */}
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
        {/* --- DYNAMIC SECTION END --- */}

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
        
        <button type="submit" className="submit-button">Submit Full Report</button>
      </form>

      {/* 5. Add styles for the conditional sections */}
      <style jsx>{`
        .form-container { max-width: 800px; margin: 0 auto; padding: 24px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; }
        input[type="text"], textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        
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