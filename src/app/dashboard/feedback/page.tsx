'use client';

import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';

// Define a type for this form's data
type FeedbackFormData = {
  branchLocation: string;
  modelType: string;
  feedbackDetails: string;
};

export default function CustomerFeedbackForm() {
  // A ref to control the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to hold the form's text data
  const [formData, setFormData] = useState<FeedbackFormData>({
    branchLocation: '',
    modelType: '',
    feedbackDetails: '',
  });

  // State for the optional image upload
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // A single handler for all text and textarea inputs
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handler for when a file is selected
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };
  
  // Handler for removing the selected file
  const handleRemoveFile = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  // Handler for form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submissionData = new FormData();

    // Append text data
    submissionData.append('branchLocation', formData.branchLocation);
    submissionData.append('modelType', formData.modelType);
    submissionData.append('feedbackDetails', formData.feedbackDetails);
    
    // Append file data if it exists
    if (file) {
      submissionData.append('feedbackImage', file);
    }

    console.log('--- Customer Feedback Form Submitted ---');
    for (let [key, value] of submissionData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log('--------------------------------------');
    
    alert('Feedback submitted successfully! Check the browser console for the data.');
  };

  return (
    <div className="form-container">
      <h1>Customer Feedback & Recommendation</h1>
      <p>Please share your experience or suggestions with us.</p>
      
      <form onSubmit={handleSubmit} className="report-form">
        
        <div className="form-group">
          <label htmlFor="branchLocation">Branch Location</label>
          <input type="text" id="branchLocation" name="branchLocation" value={formData.branchLocation} onChange={handleChange} required />
        </div>
      
        <div className="form-group">
          <label htmlFor="modelType">Model Type</label>
          <input type="text" id="modelType" name="modelType" value={formData.modelType} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackDetails">Feedback, Complaint, or Recommendation</label>
          <textarea id="feedbackDetails" name="feedbackDetails" value={formData.feedbackDetails} onChange={handleChange} rows={5} placeholder="Please provide your detailed feedback here..." required />
          
          <label className="file-input-label">Attach a Supporting Picture (Optional)</label>
          <div className="file-input-wrapper">
             <label htmlFor="feedbackImage" className="file-upload-button">Choose File</label>
             <input 
                type="file" 
                id="feedbackImage" 
                name="feedbackImage" 
                className="file-input-hidden"
                accept="image/png, image/jpeg, image/gif" 
                onChange={handleFileChange}
                ref={fileInputRef}
             />
             {file && <span className="file-name">{file.name}</span>}
          </div>

          {imagePreview && (
            <div className="image-preview">
              <Image src={imagePreview} alt="Feedback preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
              <button type="button" onClick={handleRemoveFile} className="remove-image-button" aria-label="Remove image"></button>
            </div>
          )}
        </div>
        
        <button type="submit" className="submit-button">Submit Feedback</button>
      </form>

      {/* Reusing the consistent styling from your other forms */}
      <style jsx>{`
        .form-container { max-width: 800px; margin: 0 auto; padding: 24px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; }
        input[type="text"], textarea { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        
        .file-input-label { margin-top: 16px; }
        .file-input-wrapper { display: flex; align-items: center; gap: 12px; }
        .file-input-hidden { display: none; }
        .file-upload-button {
          display: inline-block;
          padding: 8px 16px;
          background-color: #edf2f7;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .file-upload-button:hover { background-color: #e2e8f0; }
        .file-name { color: #4a5568; font-size: 14px; }
        
        .image-preview { margin-top: 16px; position: relative; width: 200px; }
        .remove-image-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }
        .remove-image-button:after { content: '×'; }
        .remove-image-button:hover { background-color: rgba(255, 0, 0, 0.8); }

        .submit-button { padding: 12px 20px; background-color: #3182ce; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
        .submit-button:hover { background-color: #2b6cb0; }
      `}</style>
    </div>
  );
}