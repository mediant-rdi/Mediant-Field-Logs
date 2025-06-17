// src/components/forms/PoorExperienceForm.tsx
'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

// Define a type for this form's specific data
type PoorExperienceData = {
  paperJamming: boolean;
  noise: boolean;
  freezing: boolean;
  dust: boolean;
  buttonsSticking: boolean;
  otherText: string;
};

export default function PoorExperienceForm() {
  // State to hold the form's data
  const [experienceData, setExperienceData] = useState<PoorExperienceData>({
    paperJamming: false,
    noise: false,
    freezing: false,
    dust: false,
    buttonsSticking: false,
    otherText: '',
  });

  // Handler for checkbox changes
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setExperienceData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };
  
  // Handler for the "others" text area
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setExperienceData((prevData) => ({
          ...prevData,
          [name]: value,
      }));
  };

  // Handler for form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('--- Poor Experience Form Submitted ---');
    console.log(experienceData);
    console.log('------------------------------------');
    
    alert('Poor Experience form submitted successfully! Check the browser console for the data.');
    
    // Optional: Reset form after submission
    setExperienceData({
      paperJamming: false,
      noise: false,
      freezing: false,
      dust: false,
      buttonsSticking: false,
      otherText: '',
    });
  };

  return (
    <div className="form-container">
      <h1>Poor Experience Report</h1>
      <p>Please select the issues contributing to the poor experience.</p>
      
      <form onSubmit={handleSubmit} className="report-form">
        {/* Checkboxes for poor experience reasons */}
        <div className="form-group">
          <label>Observed Issues (select all that apply)</label>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="paperJamming"
              name="paperJamming"
              checked={experienceData.paperJamming}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="paperJamming">Paper jamming</label>
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="noise"
              name="noise"
              checked={experienceData.noise}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="noise">Noise</label>
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="freezing"
              name="freezing"
              checked={experienceData.freezing}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="freezing">Freezing</label>
          </div>
           <div className="checkbox-group">
            <input
              type="checkbox"
              id="dust"
              name="dust"
              checked={experienceData.dust}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="dust">Dust</label>
          </div>
           <div className="checkbox-group">
            <input
              type="checkbox"
              id="buttonsSticking"
              name="buttonsSticking"
              checked={experienceData.buttonsSticking}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="buttonsSticking">Buttons sticking</label>
          </div>
        </div>

        {/* Other text box */}
        <div className="form-group">
          <label htmlFor="otherText">Other (Please specify)</label>
          <textarea
            id="otherText"
            name="otherText"
            value={experienceData.otherText}
            onChange={handleTextChange}
            rows={3}
            placeholder="If other issues, please describe here..."
          />
        </div>
        
        <button type="submit" className="submit-button">Submit Experience Report</button>
      </form>

      {/* This styling is identical to the other forms for consistency */}
      <style jsx>{`
        .form-container { max-width: 800px; margin: 0 auto; padding: 24px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; }
        input[type="text"], textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        
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