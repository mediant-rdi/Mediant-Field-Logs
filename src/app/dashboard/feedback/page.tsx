// app/dashboard/forms/customer-feedback/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id, Doc } from '../../../../convex/_generated/dataModel';

// --- TypeScript types and initial state ---
type BranchSuggestion = Doc<'clientLocations'> & { displayText: string };
type BranchSelection = { locationId: Id<'clientLocations'>; clientId: Id<'clients'>; text: string };
type ModelSelection = { id: Id<'machines'>; text: string };

type FeedbackFormData = {
  branch: BranchSelection | null;
  model: ModelSelection | null;
  feedbackDetails: string;
};

const initialState: FeedbackFormData = {
  branch: null,
  model: null,
  feedbackDetails: '',
};

const MAX_IMAGES = 4;

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

// --- NEW: Success Dialog Component with React Portal ---
const SuccessDialog = ({ isOpen, onClose, title, message }: { isOpen: boolean; onClose: () => void; title: string; message: string; }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon">✓</div>
        <h2 className="dialog-title">{title}</h2>
        <p className="dialog-message">{message}</p>
        <button className="dialog-button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>,
    document.getElementById('dialog-portal')!
  );
};

export default function CustomerFeedbackForm() {
  // --- Refs (unchanged) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelTypeContainerRef = useRef<HTMLDivElement>(null);
  const branchLocationContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Convex Hooks (unchanged) ---
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const submitFeedback = useMutation(api.feedback.submitFeedback);

  // --- Form State (unchanged) ---
  const [formData, setFormData] = useState<FeedbackFormData>(initialState);
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [branchSearchText, setBranchSearchText] = useState('');
  const [modelSearchText, setModelSearchText] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false); // --- NEW: State for dialog

  // --- Debounced Queries ---
  const debouncedModelType = useDebounce(modelSearchText, 300);
  const debouncedBranchLocation = useDebounce(branchSearchText, 300);
  const machineSuggestions = useQuery(api.machines.searchByName, debouncedModelType.length < 2 ? 'skip' : { searchText: debouncedModelType }) ?? [];
  const branchSuggestions: BranchSuggestion[] = useQuery(api.clients.searchLocations, debouncedBranchLocation.length < 2 ? 'skip' : { searchText: debouncedBranchLocation }) ?? [];

  // --- Input Handlers (unchanged) ---
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; if (name === 'modelTypeSearch') { setModelSearchText(value); setShowModelSuggestions(true); } if (name === 'branchLocationSearch') { setBranchSearchText(value); setShowBranchSuggestions(true); } };
  const handleDetailsChange = (e: ChangeEvent<HTMLTextAreaElement>) => { setFormData((prev) => ({ ...prev, feedbackDetails: e.target.value })); };
  const handleClearSelection = (type: 'model' | 'branch') => { setFormData((prev) => ({ ...prev, [type]: null })); if (type === 'model') setModelSearchText(''); if (type === 'branch') setBranchSearchText(''); };
  const handleModelSuggestionClick = (machine: Doc<'machines'>) => { setFormData((prev) => ({ ...prev, model: { id: machine._id, text: machine.name } })); setModelSearchText(''); setShowModelSuggestions(false); };
  
  const handleBranchSuggestionClick = (location: BranchSuggestion) => {
    setFormData((prev) => ({ 
      ...prev, 
      branch: { 
        locationId: location._id, 
        clientId: location.clientId,
        text: location.displayText 
      } 
    }));
    setBranchSearchText('');
    setShowBranchSuggestions(false);
  };

  // --- File & Camera Handlers (unchanged) ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { const selectedFiles = Array.from(e.target.files ?? []); if (!selectedFiles.length) return; const totalFiles = files.length + selectedFiles.length; if (totalFiles > MAX_IMAGES) { alert(`You can only upload a maximum of ${MAX_IMAGES} images.`); return; } const newFiles = [...files, ...selectedFiles]; const newPreviews = [...imagePreviews, ...selectedFiles.map(file => URL.createObjectURL(file))]; setFiles(newFiles); setImagePreviews(newPreviews); stopCamera(); };
  const handleRemoveFile = (index: number) => { URL.revokeObjectURL(imagePreviews[index]); setFiles(files.filter((_, i) => i !== index)); setImagePreviews(imagePreviews.filter((_, i) => i !== index)); if (fileInputRef.current) { fileInputRef.current.value = ''; } };
  const stopCamera = () => { if (stream) stream.getTracks().forEach(track => track.stop()); setIsCameraOpen(false); setStream(null); };
  const startCamera = async () => { if (files.length >= MAX_IMAGES) { alert(`You have reached the maximum of ${MAX_IMAGES} images.`); return; } try { const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setStream(mediaStream); setIsCameraOpen(true); } catch (err) { console.error('Error accessing camera:', err); alert('Could not access camera. Please ensure permissions are granted in your browser settings.'); } };
  const capturePhoto = () => { if (videoRef.current && canvasRef.current) { const canvas = canvasRef.current; const video = videoRef.current; const context = canvas.getContext('2d'); if (!context) return; canvas.width = video.videoWidth; canvas.height = video.videoHeight; context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight); canvas.toBlob((blob) => { if (blob) { if (files.length >= MAX_IMAGES) { alert(`You can only upload a maximum of ${MAX_IMAGES} images.`); } else { const capturedFile = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }); setFiles(prev => [...prev, capturedFile]); setImagePreviews(prev => [...prev, URL.createObjectURL(blob)]); } stopCamera(); } }, 'image/jpeg'); } };
  useEffect(() => { if (isCameraOpen && stream && videoRef.current) { videoRef.current.srcObject = stream; } return () => { if (stream) { stream.getTracks().forEach(track => track.stop()); } }; }, [isCameraOpen, stream]);

  // --- Form Lifecycle (updated for dialog) ---
  const resetForm = () => { setFormData(initialState); setBranchSearchText(''); setModelSearchText(''); imagePreviews.forEach(URL.revokeObjectURL); setFiles([]); setImagePreviews([]); };
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>, type: 'model' | 'branch') => { if (!e.currentTarget.contains(e.relatedTarget)) { setTimeout(() => { if (type === 'model') setShowModelSuggestions(false); if (type === 'branch') setShowBranchSuggestions(false); }, 150); } };
  const handleProceedToReview = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!formData.branch || !formData.model) { alert("Please select a branch and a model type from the suggestions."); return; } setIsReviewing(true); };
  const handleEdit = () => { setIsReviewing(false); };
  
  // --- NEW: Handler to close the dialog and reset the form ---
  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    resetForm();
    setIsReviewing(false);
  };

  // --- MODIFIED: The submission handler now shows the dialog ---
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!formData.branch || !formData.model) {
        throw new Error("Branch and Model must be selected.");
      }
      const uploadPromises = files.map(async (file) => {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        const { storageId } = await result.json();
        return storageId as Id<"_storage">;
      });
      const imageIds = await Promise.all(uploadPromises);
      
      await submitFeedback({
        clientId: formData.branch.clientId,
        machineId: formData.model.id,
        clientName: formData.branch.text,
        machineName: formData.model.text,
        feedbackDetails: formData.feedbackDetails,
        imageIds,
      });

      setShowSuccessDialog(true); // --- MODIFIED: Show dialog instead of alert
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("There was an error submitting your feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Rendering Logic (updated with dialog) ---
  return (
    <div className="form-container">
      {/* --- NEW: Render the Success Dialog --- */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
        title="Submission Successful"
        message="Your feedback has been submitted successfully."
      />

      {isReviewing ? (
        <div className="review-container">
          <h1>Review Your Feedback</h1>
          <p>Please review your feedback details below before the final submission.</p>
          <div className="review-grid">
            <div className="review-item"><strong>Branch Location:</strong><p>{formData.branch?.text}</p></div>
            <div className="review-item"><strong>Model Type:</strong><p>{formData.model?.text}</p></div>
            <div className="review-item full-width"><strong>Feedback Details:</strong><p>{formData.feedbackDetails}</p></div>
            {imagePreviews.length > 0 && (
              <div className="review-item full-width">
                <strong>Attached Pictures ({imagePreviews.length}/{MAX_IMAGES}):</strong>
                <div className="review-image-grid">
                  {imagePreviews.map((src, index) => (
                    <Image key={index} src={src} alt={`Feedback preview ${index + 1}`} width={100} height={100} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
                  ))}
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
              <label htmlFor="branchLocationSearch">Branch Location</label>
              {formData.branch ? (
                <div className="selected-item">
                  <span>{formData.branch.text}</span>
                  <button type="button" onClick={() => handleClearSelection('branch')} className="clear-selection-button" aria-label="Clear selection"></button>
                </div>
              ) : (
                <input type="text" id="branchLocationSearch" name="branchLocationSearch" value={branchSearchText} onChange={handleSearchChange} required={!formData.branch} autoComplete="off" onFocus={() => setShowBranchSuggestions(true)} placeholder="Search for a branch..." />
              )}
              {showBranchSuggestions && branchSearchText && branchSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {branchSuggestions.map((suggestion) => (
                    <li key={suggestion._id} onClick={() => handleBranchSuggestionClick(suggestion)} onMouseDown={(e) => e.preventDefault()}>{suggestion.displayText}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-group" ref={modelTypeContainerRef} onBlur={(e) => handleBlur(e, 'model')}>
              <label htmlFor="modelTypeSearch">Model Type</label>
              {formData.model ? (
                <div className="selected-item">
                  <span>{formData.model.text}</span>
                  <button type="button" onClick={() => handleClearSelection('model')} className="clear-selection-button" aria-label="Clear selection"></button>
                </div>
              ) : (
                <input type="text" id="modelTypeSearch" name="modelTypeSearch" value={modelSearchText} onChange={handleSearchChange} required={!formData.model} autoComplete="off" onFocus={() => setShowModelSuggestions(true)} placeholder="Search for a model..."/>
              )}
              {showModelSuggestions && modelSearchText && machineSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {machineSuggestions.map((machine: Doc<"machines">) => (
                    <li key={machine._id} onClick={() => handleModelSuggestionClick(machine)} onMouseDown={(e) => e.preventDefault()}>{machine.name}</li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="feedbackDetails">Feedback, Complaint, or Recommendation</label>
              <textarea id="feedbackDetails" name="feedbackDetails" value={formData.feedbackDetails} onChange={handleDetailsChange} rows={5} placeholder="Please provide your detailed feedback here..." required />
            </div>

            <div className="form-group">
                <label className="file-input-label">Attach Supporting Pictures (Optional, up to {MAX_IMAGES})</label>
                {imagePreviews.length > 0 && (
                    <div className="image-preview-grid">
                        {imagePreviews.map((src, index) => (
                            <div key={index} className="image-preview">
                                <Image src={src} alt={`Preview ${index + 1}`} width={100} height={100} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
                                <button type="button" onClick={() => handleRemoveFile(index)} className="remove-image-button" aria-label="Remove image"></button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="attachment-area">
                    {isCameraOpen ? (
                        <div className="camera-view-container">
                            <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
                            <div className="file-input-wrapper">
                                <button type="button" onClick={capturePhoto} className="file-upload-button camera-capture">Capture</button>
                                <button type="button" onClick={stopCamera} className="file-upload-button">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        files.length < MAX_IMAGES && (
                            <div className="file-input-wrapper">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="file-upload-button">Choose from Library</button>
                                <button type="button" onClick={startCamera} className="file-upload-button">Take Picture</button>
                            </div>
                        )
                    )}
                </div>
                <input type="file" id="feedbackImage" ref={fileInputRef} className="file-input-hidden" accept="image/*" onChange={handleFileChange} multiple />
                <canvas ref={canvasRef} className="file-input-hidden" />
            </div>
            
            <button type="submit" className="submit-button">Review Feedback</button>
          </form>
        </>
      )}

      <style jsx>{`
        /* --- All CSS is unchanged --- */
        .form-container { max-width: 800px; margin: 0 auto; padding: 16px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; font-size: 14px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; position: relative; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; font-size: 14px; }
        input[type="text"], textarea { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, textarea:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        .file-input-label { font-weight: 500; }
        .file-input-wrapper { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 8px; }
        .file-input-hidden { display: none; }
        .file-upload-button { display: inline-block; padding: 8px 16px; background-color: #edf2f7; border: 1px solid #cbd5e0; border-radius: 4px; cursor: pointer; font-weight: 500; transition: background-color 0.2s; white-space: nowrap; }
        .file-upload-button:hover { background-color: #e2e8f0; }
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
        .attachment-area { margin-top: 8px; }
        .selected-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; background-color: #e2e8f0; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; }
        .clear-selection-button { background-color: transparent; border: none; cursor: pointer; width: 20px; height: 20px; position: relative; opacity: 0.6; transition: opacity 0.2s; }
        .clear-selection-button:hover { opacity: 1; }
        .clear-selection-button:before, .clear-selection-button:after { position: absolute; left: 9px; top: 1px; content: ' '; height: 18px; width: 2px; background-color: #4a5568; }
        .clear-selection-button:before { transform: rotate(45deg); }
        .clear-selection-button:after { transform: rotate(-45deg); }
        .image-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-top: 12px; }
        .image-preview { position: relative; width: 100%; padding-top: 100%; /* 1:1 Aspect Ratio */ }
        .image-preview > :global(img) { position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; object-fit: cover; border-radius: 8px; }
        .remove-image-button { position: absolute; top: -6px; right: -6px; background-color: rgba(0, 0, 0, 0.7); color: white; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; line-height: 1; z-index: 1; }
        .remove-image-button:after { content: '×'; }
        .remove-image-button:hover { background-color: rgba(255, 0, 0, 0.8); }
        .camera-view-container { margin-top: 8px; width: 100%; }
        .camera-feed { width: 100%; max-width: 400px; border-radius: 8px; background-color: #000; border: 1px solid #cbd5e0; }
        .file-upload-button.camera-capture { background-color: #3182ce; color: white; border-color: #3182ce; }
        .file-upload-button.camera-capture:hover { background-color: #2b6cb0; }
        .review-image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-top: 8px; }
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
      <style jsx global>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
        }

        .dialog-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          text-align: center;
          max-width: 90%;
          width: 400px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: dialog-appear 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }

        @keyframes dialog-appear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .dialog-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #22c55e; /* green-500 */
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 16px;
        }

        .dialog-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827; /* gray-900 */
          margin: 0 0 8px;
        }

        .dialog-message {
          font-size: 16px;
          color: #4b5563; /* gray-600 */
          margin: 0 0 24px;
          line-height: 1.5;
        }

        .dialog-button {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 8px;
          background-color: #3b82f6; /* blue-500 */
          color: white;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .dialog-button:hover {
          background-color: #2563eb; /* blue-600 */
        }
      `}</style>
    </div>
  );
}