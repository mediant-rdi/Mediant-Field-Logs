// app/dashboard/complaint/engineer/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id, Doc } from '../../../../../convex/_generated/dataModel';

// --- MODIFIED: New types for structured selections ---
type BranchSuggestion = Doc<'clientLocations'> & { displayText: string };
type BranchSelection = { locationId: Id<'clientLocations'>; clientId: Id<'clients'>; text: string };
type ModelSelection = { id: Id<'machines'>; text: string };

// --- MODIFIED: Added machineSerialNumber ---
type CombinedFormData = {
  branch: BranchSelection | null;
  model: ModelSelection | null;
  machineSerialNumber: string;
  problemType: '' | 'electrical' | 'mechanical' | 'software' | 'service-delay' | 'other';
  complaintText: string;
  solution: string;
  backofficeAccess: boolean;
  spareDelay: boolean;
  delayedReporting: boolean;
  communicationBarrier: boolean;
  otherText: string;
};

// --- MODIFIED: Added machineSerialNumber ---
const initialState: CombinedFormData = {
  branch: null,
  model: null,
  machineSerialNumber: '',
  problemType: '',
  complaintText: '',
  solution: '',
  backofficeAccess: false,
  spareDelay: false,
  delayedReporting: false,
  communicationBarrier: false,
  otherText: '',
};

const MAX_IMAGES = 4;

// --- NEW: Debounce hook for search inputs ---
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


export default function ServiceDelayForm() {
  // --- Refs (updated for camera) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelTypesContainerRef = useRef<HTMLDivElement>(null);
  const branchLocationContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Convex Hooks (unchanged) ---
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const submitServiceReport = useMutation(api.serviceReports.submitServiceReport);

  // --- Form State (updated for selections and multiple files) ---
  const [formData, setFormData] = useState<CombinedFormData>(initialState);
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [branchSearchText, setBranchSearchText] = useState('');
  const [modelSearchText, setModelSearchText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false); // --- NEW: State for dialog

  // --- Debounced Queries ---
  const debouncedModelType = useDebounce(modelSearchText, 300);
  const debouncedBranchLocation = useDebounce(branchSearchText, 300);
  const machineSuggestions = useQuery(api.machines.searchByName, debouncedModelType.length < 2 ? 'skip' : { searchText: debouncedModelType }) ?? [];
  const branchSuggestions: BranchSuggestion[] = useQuery(api.clients.searchLocations, debouncedBranchLocation.length < 2 ? 'skip' : { searchText: debouncedBranchLocation }) ?? [];

  // --- Form Handlers (updated for new state) ---
  const handleNonSelectionChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    let value: string | boolean = isCheckbox 
      ? (e.target as HTMLInputElement).checked 
      : (e.target as HTMLInputElement).value;

    if (name === 'machineSerialNumber' && typeof value === 'string') {
      // This regex replaces any character that is not a digit with an empty string.
      value = value.replace(/\D/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'modelTypeSearch') { setModelSearchText(value); setShowModelSuggestions(true); }
    if (name === 'branchLocationSearch') { setBranchSearchText(value); setShowBranchSuggestions(true); }
  };
  const handleClearSelection = (type: 'model' | 'branch') => {
    setFormData((prev) => ({ ...prev, [type]: null }));
    if (type === 'model') setModelSearchText('');
    if (type === 'branch') setBranchSearchText('');
  };
  const handleModelSuggestionClick = (machine: Doc<'machines'>) => {
    setFormData((prev) => ({ ...prev, model: { id: machine._id, text: machine.name } }));
    setModelSearchText(''); setShowModelSuggestions(false);
  };
  const handleBranchSuggestionClick = (location: BranchSuggestion) => {
    setFormData((prev) => ({ ...prev, branch: { locationId: location._id, clientId: location.clientId, text: location.displayText } }));
    setBranchSearchText(''); setShowBranchSuggestions(false);
  };
  
  // --- File & Camera Handlers (updated for multiple files) ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (!selectedFiles.length) return;
    const totalFiles = files.length + selectedFiles.length;
    if (totalFiles > MAX_IMAGES) { alert(`You can only upload a maximum of ${MAX_IMAGES} images.`); return; }
    const newFiles = [...files, ...selectedFiles];
    const newPreviews = [...imagePreviews, ...selectedFiles.map(file => URL.createObjectURL(file))];
    setFiles(newFiles); setImagePreviews(newPreviews); stopCamera();
  };
  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setFiles(files.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };
  const stopCamera = () => { if (stream) stream.getTracks().forEach(track => track.stop()); setIsCameraOpen(false); setStream(null); };
  const startCamera = async () => {
    if (files.length >= MAX_IMAGES) { alert(`You have reached the maximum of ${MAX_IMAGES} images.`); return; }
    try { const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setStream(mediaStream); setIsCameraOpen(true); } catch (err) { console.error('Error accessing camera:', err); alert('Could not access camera. Please ensure permissions are granted.'); }
  };
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current; const video = videoRef.current; const context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      canvas.toBlob((blob) => {
        if (blob) {
          if (files.length >= MAX_IMAGES) { alert(`You can only upload a maximum of ${MAX_IMAGES} images.`); } else {
            const capturedFile = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFiles(prev => [...prev, capturedFile]); setImagePreviews(prev => [...prev, URL.createObjectURL(blob)]);
          } stopCamera();
        }
      }, 'image/jpeg');
    }
  };
  useEffect(() => { if (isCameraOpen && stream && videoRef.current) { videoRef.current.srcObject = stream; } return () => { if (stream) { stream.getTracks().forEach(track => track.stop()); } }; }, [isCameraOpen, stream]);

  // --- Form Lifecycle (updated) ---
  const resetForm = () => { setFormData(initialState); setBranchSearchText(''); setModelSearchText(''); imagePreviews.forEach(URL.revokeObjectURL); setFiles([]); setImagePreviews([]); };
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>, type: 'model' | 'branch') => { if (!e.currentTarget.contains(e.relatedTarget)) { setTimeout(() => { if (type === 'model') setShowModelSuggestions(false); if (type === 'branch') setShowBranchSuggestions(false); }, 150); } };
  const handleProceedToReview = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.branch || !formData.model) { alert("Please select a branch and a model type from the suggestions."); return; }
    if (formData.problemType === '') { alert('Please select a Problem Type from the dropdown.'); return; }
    setIsReviewing(true);
  };
  const handleEdit = () => { setIsReviewing(false); };
  
  // --- NEW: Handler to close the dialog and reset the form ---
  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    resetForm();
    setIsReviewing(false);
  };

  // --- MODIFIED: Final submit handler sends new data structure ---
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!formData.branch || !formData.model || formData.problemType === '') {
        throw new Error("Branch, Model, and Problem Type must be selected.");
      }
      const uploadPromises = files.map(async (file) => {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        const { storageId } = await result.json();
        return storageId as Id<"_storage">;
      });
      const imageIds = await Promise.all(uploadPromises);
      
      await submitServiceReport({
        clientId: formData.branch.clientId,
        locationId: formData.branch.locationId,
        machineId: formData.model.id,
        branchLocation: formData.branch.text,
        machineName: formData.model.text,
        machineSerialNumber: formData.machineSerialNumber || undefined,
        complaintText: formData.complaintText,
        solution: formData.solution,
        problemType: formData.problemType,
        backofficeAccess: formData.backofficeAccess,
        spareDelay: formData.spareDelay,
        delayedReporting: formData.delayedReporting,
        communicationBarrier: formData.communicationBarrier,
        otherText: formData.otherText,
        imageIds,
      });

      setShowSuccessDialog(true); // --- MODIFIED: Show dialog instead of alert
    } catch (error) {
      console.error("Failed to submit report:", error);
      alert("There was an error submitting your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      {/* --- NEW: Render the Success Dialog --- */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
        title="Submission Successful"
        message="Your report has been submitted for approval."
      />

      {isReviewing ? (
        <div className="review-container">
          <h1>Review Your Submission</h1>
          <p>Please review the details below before the final submission.</p>
          {/* --- MODIFIED: Added serial number to review screen --- */}
          <div className="review-grid">
            <div className="review-item"><strong>Model:</strong><p>{formData.model?.text}</p></div>
            {formData.machineSerialNumber && (
              <div className="review-item"><strong>Machine Serial Number:</strong><p>{formData.machineSerialNumber}</p></div>
            )}
            <div className="review-item"><strong>Branch Location:</strong><p>{formData.branch?.text}</p></div>
            <div className="review-item full-width"><strong>Problem Type:</strong><p style={{textTransform: 'capitalize'}}>{formData.problemType.replace('-', ' ')}</p></div>
            {formData.problemType === 'service-delay' && ( <div className="review-item full-width"> <strong>Service Delay Details:</strong> <ul> {formData.backofficeAccess && <li>Delayed backoffice access</li>} {formData.spareDelay && <li>Spare delay</li>} {formData.delayedReporting && <li>Delayed reporting</li>} {formData.communicationBarrier && <li>Communication barrier</li>} </ul> </div> )}
            {formData.problemType === 'other' && ( <div className="review-item full-width"><strong>Specific Problem:</strong><p>{formData.otherText}</p></div> )}
            <div className="review-item full-width"><strong>Full Problem Details:</strong><p>{formData.complaintText}</p></div>
            <div className="review-item full-width"><strong>Solution Provided:</strong><p>{formData.solution}</p></div>
            {imagePreviews.length > 0 && (
              <div className="review-item full-width">
                <strong>Attached Pictures ({imagePreviews.length}/{MAX_IMAGES}):</strong>
                <div className="review-image-grid">
                  {imagePreviews.map((src, index) => (
                    <Image key={index} src={src} alt={`Report preview ${index + 1}`} width={100} height={100} style={{ objectFit: 'cover', borderRadius: '8px' }}/>
                  ))}
                </div>
              </div>
            )}
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
          {/* --- MODIFIED: Added serial number input field --- */}
          <form onSubmit={handleProceedToReview} className="report-form">
            <div className="form-group" ref={branchLocationContainerRef} onBlur={(e) => handleBlur(e, 'branch')}>
              <label htmlFor="branchLocationSearch">Branch Location</label>
              {formData.branch ? (
                <div className="selected-item"><span>{formData.branch.text}</span><button type="button" onClick={() => handleClearSelection('branch')} className="clear-selection-button" aria-label="Clear selection"></button></div>
              ) : (
                <input type="text" id="branchLocationSearch" name="branchLocationSearch" value={branchSearchText} onChange={handleSearchChange} required={!formData.branch} autoComplete="off" onFocus={() => setShowBranchSuggestions(true)} placeholder="Search for a branch..."/>
              )}
              {showBranchSuggestions && branchSearchText && branchSuggestions.length > 0 && (
                <ul className="suggestions-list">{branchSuggestions.map((s) => (<li key={s._id} onClick={() => handleBranchSuggestionClick(s)} onMouseDown={(e) => e.preventDefault()}>{s.displayText}</li>))}</ul>
              )}
            </div>

            <div className="form-group" ref={modelTypesContainerRef} onBlur={(e) => handleBlur(e, 'model')}>
              <label htmlFor="modelTypeSearch">Model Type</label>
              {formData.model ? (
                <div className="selected-item"><span>{formData.model.text}</span><button type="button" onClick={() => handleClearSelection('model')} className="clear-selection-button" aria-label="Clear selection"></button></div>
              ) : (
                <input type="text" id="modelTypeSearch" name="modelTypeSearch" value={modelSearchText} onChange={handleSearchChange} required={!formData.model} autoComplete="off" onFocus={() => setShowModelSuggestions(true)} placeholder="Search for a model..."/>
              )}
              {showModelSuggestions && modelSearchText && machineSuggestions.length > 0 && (
                <ul className="suggestions-list">{machineSuggestions.map((m: Doc<"machines">) => (<li key={m._id} onClick={() => handleModelSuggestionClick(m)} onMouseDown={(e) => e.preventDefault()}>{m.name}</li>))}</ul>
              )}
            </div>

            {/* --- MODIFIED: Machine Serial Number Input Field --- */}
            <div className="form-group">
              <label htmlFor="machineSerialNumber">Machine Serial Number (Optional)</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                id="machineSerialNumber"
                name="machineSerialNumber"
                value={formData.machineSerialNumber}
                onChange={handleNonSelectionChange}
                placeholder="Enter serial number if known"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="problemType">Problem Type</label>
              <select id="problemType" name="problemType" value={formData.problemType} onChange={handleNonSelectionChange} required >
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
                  <div className="checkbox-group"><input type="checkbox" id="backofficeAccess" name="backofficeAccess" checked={formData.backofficeAccess} onChange={handleNonSelectionChange} /><label htmlFor="backofficeAccess">Delayed backoffice access</label></div>
                  <div className="checkbox-group"><input type="checkbox" id="spareDelay" name="spareDelay" checked={formData.spareDelay} onChange={handleNonSelectionChange} /><label htmlFor="spareDelay">Spare delay</label></div>
                  <div className="checkbox-group"><input type="checkbox" id="delayedReporting" name="delayedReporting" checked={formData.delayedReporting} onChange={handleNonSelectionChange} /><label htmlFor="delayedReporting">Delayed reporting</label></div>
                  <div className="checkbox-group"><input type="checkbox" id="communicationBarrier" name="communicationBarrier" checked={formData.communicationBarrier} onChange={handleNonSelectionChange} /><label htmlFor="communicationBarrier">Communication barrier</label></div>
                </div>
              </div>
            )}
            {formData.problemType === 'other' && ( <div className="conditional-group"> <label htmlFor="otherText">Please specify the problem</label> <textarea id="otherText" name="otherText" value={formData.otherText} onChange={handleNonSelectionChange} rows={3} placeholder="Describe the specific problem..." required /> </div> )}
            <div className="form-group"> <label htmlFor="complaintText">Full Problem Details</label> <textarea id="complaintText" name="complaintText" value={formData.complaintText} onChange={handleNonSelectionChange} rows={4} placeholder="Describe the issue in detail..." required/> </div>
            
            <div className="form-group">
                <label className="file-input-label">Attach Supporting Pictures (Optional, up to {MAX_IMAGES})</label>
                {imagePreviews.length > 0 && (<div className="image-preview-grid">{imagePreviews.map((src, index) => (<div key={index} className="image-preview"><Image src={src} alt={`Preview ${index + 1}`} width={100} height={100} style={{ objectFit: 'cover', borderRadius: '8px' }}/><button type="button" onClick={() => handleRemoveFile(index)} className="remove-image-button" aria-label="Remove image"></button></div>))}</div>)}
                <div className="attachment-area">
                    {isCameraOpen ? (<div className="camera-view-container"><video ref={videoRef} autoPlay playsInline muted className="camera-feed" /><div className="file-input-wrapper"><button type="button" onClick={capturePhoto} className="file-upload-button camera-capture">Capture</button><button type="button" onClick={stopCamera} className="file-upload-button">Cancel</button></div></div>)
                    : (files.length < MAX_IMAGES && (<div className="file-input-wrapper"><button type="button" onClick={() => fileInputRef.current?.click()} className="file-upload-button">Choose from Library</button><button type="button" onClick={startCamera} className="file-upload-button">Take Picture</button></div>))}
                </div>
                <input type="file" id="reportImage" ref={fileInputRef} className="file-input-hidden" accept="image/*" onChange={handleFileChange} multiple />
                <canvas ref={canvasRef} className="file-input-hidden" />
            </div>

            <div className="form-group"> <label htmlFor="solution">Solution Provided</label> <textarea id="solution" name="solution" value={formData.solution} onChange={handleNonSelectionChange} rows={4} placeholder="Describe the solution..." required /> </div>
            <button type="submit" className="submit-button"> Review Report </button>
          </form>
        </>
      )}

      <style jsx>{`
        /* --- CSS styles are now aligned with the other modernized forms --- */
        .form-container { max-width: 800px; margin: 0 auto; padding: 16px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        p { color: #4a5568; margin-bottom: 24px; font-size: 14px; }
        .report-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; position: relative; }
        .form-group > label { margin-bottom: 8px; font-weight: 500; font-size: 14px; }
        input[type="text"], input[type="tel"], textarea, select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; width: 100%; box-sizing: border-box; }
        input[type="text"]:focus, input[type="tel"]:focus, textarea:focus, select:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2); }
        .suggestions-list { position: absolute; top: 100%; left: 0; right: 0; background-color: white; border: 1px solid #cbd5e0; border-top: none; border-radius: 0 0 6px 6px; list-style-type: none; margin: 0; padding: 0; z-index: 10; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .suggestions-list li { padding: 10px 12px; cursor: pointer; font-size: 14px; }
        .suggestions-list li:hover { background-color: #f7fafc; }
        .conditional-group { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-top: -10px; }
        .conditional-group > label { font-weight: 500; margin-bottom: 12px; display: block; }
        .checkbox-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .checkbox-group { display: flex; align-items: center; }
        .checkbox-group input[type="checkbox"] { width: 20px; height: 20px; margin-right: 12px; cursor: pointer; flex-shrink: 0; }
        .checkbox-group label { font-weight: normal; cursor: pointer; margin-bottom: 0; }
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
        .review-item p, .review-item ul { margin: 0; color: #4a5568; white-space: pre-wrap; }
        .review-item ul { padding-left: 20px; }
        .review-actions { display: flex; flex-direction: column-reverse; gap: 12px; margin-top: 24px; }
        .attachment-area { margin-top: 8px; }
        .camera-view-container { margin-top: 8px; width: 100%; }
        .camera-feed { width: 100%; max-width: 400px; border-radius: 8px; background-color: #000; border: 1px solid #cbd5e0; }
        .file-upload-button.camera-capture { background-color: #3182ce; color: white; border-color: #3182ce; }
        .file-upload-button.camera-capture:hover { background-color: #2b6cb0; }
        .selected-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; background-color: #e2e8f0; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; }
        .clear-selection-button { background-color: transparent; border: none; cursor: pointer; width: 20px; height: 20px; position: relative; opacity: 0.6; transition: opacity 0.2s; }
        .clear-selection-button:hover { opacity: 1; }
        .clear-selection-button:before, .clear-selection-button:after { position: absolute; left: 9px; top: 1px; content: ' '; height: 18px; width: 2px; background-color: #4a5568; }
        .clear-selection-button:before { transform: rotate(45deg); }
        .clear-selection-button:after { transform: rotate(-45deg); }
        .image-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-top: 12px; }
        .image-preview { position: relative; width: 100%; padding-top: 100%; }
        .image-preview > :global(img) { position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; object-fit: cover; border-radius: 8px; }
        .remove-image-button { position: absolute; top: -6px; right: -6px; background-color: rgba(0, 0, 0, 0.7); color: white; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; line-height: 1; z-index: 1; }
        .remove-image-button:after { content: '×'; }
        .remove-image-button:hover { background-color: rgba(255, 0, 0, 0.8); }
        .review-image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-top: 8px; }

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