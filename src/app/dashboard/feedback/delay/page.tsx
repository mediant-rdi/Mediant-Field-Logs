// src/components/forms/ServiceDelayForm.tsx
'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

// Define a type for this specific form's data
type ServiceDelayData = {
  backofficeAccess: boolean;
  spareDelay: boolean;
  delayedReporting: boolean;
  communicationBarrier: boolean;
  otherText: string;
};

export default function ServiceDelayForm() {
  // State to hold the form's data (checkboxes and text)
  const [delayData, setDelayData] = useState<ServiceDelayData>({
    backofficeAccess: false,
    spareDelay: false,
    delayedReporting: false,
    communicationBarrier: false,
    otherText: '',
  });

  // Handler for checkbox changes
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setDelayData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };
  
  // Handler for the "others" text area
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setDelayData((prevData) => ({
          ...prevData,
          [name]: value,
      }));
  };

  // Handler for form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('--- Service Delay Form Submitted ---');
    console.log(delayData);
    console.log('---------------------------------');
    
    alert('Service Delay form submitted successfully! Check the browser console for the data.');
    
    // Optional: Reset form after submission
    setDelayData({
      backofficeAccess: false,
      spareDelay: false,
      delayedReporting: false,
      communicationBarrier: false,
      otherText: '',
    });
  };

  return (
    <div className="form-container">
      <h1>Service Delay Report</h1>
      <p>Please select the reasons for the delay and provide details if necessary.</p>
      
      <form onSubmit={handleSubmit} className="report-form">
        {/* Checkboxes */}
        <div className="form-group">
          <label>Reasons for Delay (select all that apply)</label>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="backofficeAccess"
              name="backofficeAccess"
              checked={delayData.backofficeAccess}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="backofficeAccess">Delayed backoffice access</label>
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="spareDelay"
              name="spareDelay"
              checked={delayData.spareDelay}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="spareDelay">Spare delay</label>
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="delayedReporting"
              name="delayedReporting"
              checked={delayData.delayedReporting}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="delayedReporting">Delayed reporting</label>
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="communicationBarrier"
              name="communicationBarrier"
              checked={delayData.communicationBarrier}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="communicationBarrier">Communication barrier</label>
          </div>
        </div>

        {/* Other text box */}
        <div className="form-group">
          <label htmlFor="otherText">Other (Please specify)</label>
          <textarea
            id="otherText"
            name="otherText"
            value={delayData.otherText}
            onChange={handleTextChange}
            rows={3}
            placeholder="If other reasons, please describe here..."
          />
        </div>
        
        <button type="submit" className="submit-button">Submit Delay Report</button>
      </form>

      {/* This styling is copied from ComplaintForm.tsx and extended for checkboxes */}
      <style jsx>{`
        .form-container { max-width: 800px; margin: 0 auto; padding: 24px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; }
        input[type="text"], textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        
        /* New styles for checkbox groups */
        .checkbox-group {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .checkbox-group input[type="checkbox"] {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          cursor: pointer;
        }
        .checkbox-group label {
          font-weight: normal;
          cursor: pointer;
        }

        .submit-button { padding: 12px 20px; background-color: #3182ce; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
        .submit-button:hover { background-color: #2b6cb0; }
      `}</style>
    </div>
  );
}