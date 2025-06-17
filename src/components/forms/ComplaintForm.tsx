// src/components/forms/ComplaintForm.tsx
'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';

type FormData = {
  modelTypes: string;
  branchLocation: string;
  problemType: string;
  complaintText: string;
  solution: string;
};

export default function ComplaintForm() {
  const problemTypeOptions = ['electrical', 'mechanical', 'software', 'user error'];

  const [formData, setFormData] = useState<FormData>({
    modelTypes: '',
    branchLocation: '',
    problemType: problemTypeOptions[0],
    complaintText: '',
    solution: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    } else {
      setFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submissionData = new FormData();
    submissionData.append('modelTypes', formData.modelTypes);
    submissionData.append('branchLocation', formData.branchLocation);
    submissionData.append('problemType', formData.problemType);
    submissionData.append('complaintText', formData.complaintText);
    submissionData.append('solution', formData.solution);
    if (file) {
      submissionData.append('complaintImage', file);
    }

    console.log('--- Form Submitted ---');
    for (let [key, value] of submissionData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log('--------------------');
    
    alert('Form submitted successfully! Check the browser console for the data.');
  };

  return (
    <div className="form-container">
      <h1>Complaint Logging Form</h1>
      <p>Fill out the details below for a new complaint report.</p>
      
      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label htmlFor="modelTypes">Model Types</label>
          <input type="text" id="modelTypes" name="modelTypes" value={formData.modelTypes} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="branchLocation">Branch Location</label>
          <input type="text" id="branchLocation" name="branchLocation" value={formData.branchLocation} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="problemType">Problem Type</label>
          <select id="problemType" name="problemType" value={formData.problemType} onChange={handleChange} required >
            {problemTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="complaintText">Complaint Details</label>
          <textarea id="complaintText" name="complaintText" value={formData.complaintText} onChange={handleChange} rows={4} placeholder="Describe the issue..."/>
          
          <label htmlFor="complaintImage" className="file-label">Attach a Picture (Optional)</label>
          <input type="file" id="complaintImage" name="complaintImage" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} />
          {imagePreview && (
            <div className="image-preview">
              <Image src={imagePreview} alt="Complaint preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="solution">Solution</label>
          <textarea id="solution" name="solution" value={formData.solution} onChange={handleChange} rows={4} placeholder="Describe the solution..." required />
        </div>
        
        <button type="submit" className="submit-button">Submit Report</button>
      </form>

      {/* This styling is scoped to this component */}
      <style jsx>{`
        .form-container { max-width: 800px; margin: 0 auto; padding: 24px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; }
        label { margin-bottom: 8px; font-weight: 500; }
        input, textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        .file-label { margin-top: 16px; }
        .image-preview { margin-top: 16px; }
        .submit-button { padding: 12px 20px; background-color: #3182ce; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
        .submit-button:hover { background-color: #2b6cb0; }
      `}</style>
    </div>
  );
}