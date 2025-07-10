// app/dashboard/forms/customer-feedback/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id, Doc } from '../../../../convex/_generated/dataModel';

// --- TypeScript types and initial state (unchanged) ---
type FeedbackFormData = {
  branchLocation: string;
  modelType: string;
  feedbackDetails: string;
};

const initialState: FeedbackFormData = {
  branchLocation: '',
  modelType: '',
  feedbackDetails: '',
};

// --- useDebounce hook (unchanged) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function CustomerFeedbackForm() {
  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelTypeContainerRef = useRef<HTMLDivElement>(null);
  const branchLocationContainerRef = useRef<HTMLDivElement>(null);
  // --- MODIFIED --- Add refs for the inline camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Convex Hooks (unchanged) ---
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const submitFeedback = useMutation(api.feedback.submitFeedback);

  // --- Form State ---
  const [formData, setFormData] = useState<FeedbackFormData>(initialState);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);

  // --- NEW --- State to manage the camera view
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // --- Debounced Queries (unchanged) ---
  const debouncedModelType = useDebounce(formData.modelType, 300);
  const debouncedBranchLocation = useDebounce(formData.branchLocation, 300);
  const machineSuggestions = useQuery(api.machines.searchByName, debouncedModelType.length < 2 ? 'skip' : { searchText: debouncedModelType }) ?? [];
  const branchSuggestions = useQuery(api.clients.searchLocations, debouncedBranchLocation.length < 2 ? 'skip' : { searchText: debouncedBranchLocation }) ?? [];

  // --- Form Handlers (mostly unchanged) ---
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'modelType') setShowModelSuggestions(true);
    if (name === 'branchLocation') setShowBranchSuggestions(true);
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      stopCamera(); // Close camera if user chooses a file while it's open
    }
  };
  
  const handleRemoveFile = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // --- Unchanged Form Logic ---
  const resetForm = () => { setFormData(initialState); handleRemoveFile(); };
  const handleModelSuggestionClick = (machineName: string) => { setFormData((prevData) => ({ ...prevData, modelType: machineName })); setShowModelSuggestions(false); };
  const handleBranchSuggestionClick = (displayText: string) => { setFormData((prevData) => ({ ...prevData, branchLocation: displayText })); setShowBranchSuggestions(false); };
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>, type: 'model' | 'branch') => { if (!e.currentTarget.contains(e.relatedTarget)) { setTimeout(() => { if (type === 'model') setShowModelSuggestions(false); if (type === 'branch') setShowBranchSuggestions(false); }, 150); } };
  const handleProceedToReview = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setIsReviewing(true); };
  const handleEdit = () => { setIsReviewing(false); };
  const handleFinalSubmit = async () => { setIsSubmitting(true); try { let imageId: Id<"_storage"> | undefined = undefined; if (file) { const uploadUrl = await generateUploadUrl(); const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file }); const { storageId } = await result.json(); imageId = storageId; } await submitFeedback({ ...formData, imageId }); alert('Feedback submitted successfully!'); resetForm(); setIsReviewing(false); } catch (error) { console.error("Failed to submit feedback:", error); alert("There was an error submitting your feedback. Please try again."); } finally { setIsSubmitting(false); }};

  // --- NEW --- Camera Logic Integrated Into Form
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    setStream(null);
  };

  const startCamera = async () => {
    handleRemoveFile(); // Clear any existing file
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please ensure permissions are granted in your browser settings.');
    }
  };
  
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFile(capturedFile);
          setImagePreview(URL.createObjectURL(blob));
          stopCamera(); // This will close the camera view and show the preview
        }
      }, 'image/jpeg');
    }
  };

  return (
    <div className="form-container">
      {isReviewing ? (
        <div className="review-container">
          <h1>Review Your Feedback</h1>
          <p>Please review your feedback details below before the final submission.</p>
          <div className="review-grid">
            <div className="review-item"><strong>Branch Location:</strong><p>{formData.branchLocation}</p></div>
            <div className="review-item"><strong>Model Type:</strong><p>{formData.modelType}</p></div>
            <div className="review-item full-width"><strong>Feedback Details:</strong><p>{formData.feedbackDetails}</p></div>
            {imagePreview && (
              <div className="review-item full-width">
                <strong>Attached Picture:</strong>
                <div className="image-preview" style={{ marginTop: '8px' }}>
                  <Image src={imagePreview} alt="Feedback preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
                </div>
              </div>
            )}
          </div>
          <div className="review-actions">
            <button type="button" onClick={handleEdit} className="edit-button">Edit</button>
            <button type="button" onClick={handleFinalSubmit} className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit Feedback'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1>Customer Feedback & Recommendation</h1>
          <p>Please share your experience or suggestions with us.</p>
          <form onSubmit={handleProceedToReview} className="report-form">
            <div className="form-group" ref={branchLocationContainerRef} onBlur={(e) => handleBlur(e, 'branch')}>
              <label htmlFor="branchLocation">Branch Location</label>
              <input type="text" id="branchLocation" name="branchLocation" value={formData.branchLocation} onChange={handleChange} required autoComplete="off" onFocus={() => setShowBranchSuggestions(true)} />
              {showBranchSuggestions && formData.branchLocation && branchSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {branchSuggestions.map((suggestion) => (<li key={suggestion._id} onClick={() => handleBranchSuggestionClick(suggestion.displayText)} onMouseDown={(e) => e.preventDefault()}>{suggestion.displayText}</li>))}
                </ul>
              )}
            </div>
            <div className="form-group" ref={modelTypeContainerRef} onBlur={(e) => handleBlur(e, 'model')}>
              <label htmlFor="modelType">Model Type</label>
              <input type="text" id="modelType" name="modelType" value={formData.modelType} onChange={handleChange} required autoComplete="off" onFocus={() => setShowModelSuggestions(true)} />
              {showModelSuggestions && formData.modelType && machineSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {machineSuggestions.map((machine: Doc<"machines">) => (<li key={machine._id} onClick={() => handleModelSuggestionClick(machine.name)} onMouseDown={(e) => e.preventDefault()}>{machine.name}</li>))}
                </ul>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="feedbackDetails">Feedback, Complaint, or Recommendation</label>
              <textarea id="feedbackDetails" name="feedbackDetails" value={formData.feedbackDetails} onChange={handleChange} rows={5} placeholder="Please provide your detailed feedback here..." required />
              
              <label className="file-input-label">Attach a Supporting Picture (Optional)</label>
              
              {/* --- MODIFIED --- This section now handles all attachment states (buttons, camera, preview) --- */}
              <div className="attachment-area">
                {isCameraOpen ? (
                  <div className="camera-view-container">
                    <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
                    <div className="file-input-wrapper">
                      <button type="button" onClick={capturePhoto} className="file-upload-button camera-capture">Capture</button>
                      <button type="button" onClick={stopCamera} className="file-upload-button">Cancel</button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  <div className="image-preview">
                    <Image src={imagePreview} alt="Feedback preview" width={200} height={200} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
                    <button type="button" onClick={handleRemoveFile} className="remove-image-button" aria-label="Remove image"></button>
                  </div>
                ) : (
                  <div className="file-input-wrapper">
                    {/* The `onClick` for these buttons now calls the new camera/file logic */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="file-upload-button">Choose from Library</button>
                    <button type="button" onClick={startCamera} className="file-upload-button">Take Picture</button>
                  </div>
                )}
              </div>
              
              {/* These are always present but hidden, just as you had them */}
              <input type="file" id="feedbackImage" ref={fileInputRef} className="file-input-hidden" accept="image/*" onChange={handleFileChange} />
              <canvas ref={canvasRef} className="file-input-hidden" />
            </div>
            
            <button type="submit" className="submit-button">Review Feedback</button>
          </form>
        </>
      )}

      <style jsx>{`
        /* --- YOUR ORIGINAL CSS (UNCHANGED) --- */
        .form-container { max-width: 800px; margin: 0 auto; padding: 16px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; font-size: 14px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; position: relative; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; font-size: 14px; }
        input[type="text"], textarea { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        .file-input-label { margin-top: 20px; font-weight: 500; }
        .file-input-wrapper { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 8px; }
        .file-input-hidden { display: none; }
        .file-upload-button { display: inline-block; padding: 8px 16px; background-color: #edf2f7; border: 1px solid #cbd5e0; border-radius: 4px; cursor: pointer; font-weight: 500; transition: background-color 0.2s; white-space: nowrap; }
        .file-upload-button:hover { background-color: #e2e8f0; }
        .file-name { color: #4a5568; font-size: 14px; word-break: break-all; }
        .image-preview { margin-top: 16px; position: relative; width: 100%; max-width: 200px; }
        .remove-image-button { position: absolute; top: 8px; right: 8px; background-color: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; line-height: 1; }
        .remove-image-button:after { content: '×'; }
        .remove-image-button:hover { background-color: rgba(255, 0, 0, 0.8); }
        .submit-button, .edit-button { padding: 12px 20px; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; border: none; width: 100%; }
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
        .review-item p { margin: 0; color: #4a5568; white-space: pre-wrap; }
        .review-actions { display: flex; flex-direction: column-reverse; gap: 12px; margin-top: 24px; }
        .suggestions-list { position: absolute; top: 100%; left: 0; right: 0; background-color: white; border: 1px solid #cbd5e0; border-top: none; border-radius: 0 0 6px 6px; list-style-type: none; margin: 0; padding: 0; z-index: 10; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .suggestions-list li { padding: 10px 12px; cursor: pointer; font-size: 14px; }
        .suggestions-list li:hover { background-color: #f7fafc; }

        /* --- NEW, MINIMAL CSS FOR INLINE CAMERA --- */
        .camera-view-container {
            margin-top: 8px;
            width: 100%;
        }
        .camera-feed {
            width: 100%;
            max-width: 400px;
            border-radius: 8px;
            background-color: #000;
            border: 1px solid #cbd5e0;
        }
        .file-upload-button.camera-capture {
            background-color: #3182ce;
            color: white;
            border-color: #3182ce;
        }
        .file-upload-button.camera-capture:hover {
            background-color: #2b6cb0;
        }
        
        /* --- YOUR ORIGINAL MEDIA QUERIES (UNCHANGED) --- */
        @media (min-width: 768px) {
            .form-container { padding: 24px; }
            h1 { font-size: 24px; }
            p { font-size: 16px; }
            .submit-button, .edit-button { width: auto; }
            .review-grid { grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px; }
            .review-item.full-width { grid-column: span 2; }
            .review-actions { flex-direction: row; justify-content: flex-end; gap: 16px; }
        }
      `}</style>
    </div>
  );
}