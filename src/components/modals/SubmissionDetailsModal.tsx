// components/modals/SubmissionDetailsModal.tsx
'use client';

import { useState } from 'react';
import { EnrichedReport, StatusBadge } from '@/components/forms/DashboardForm';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Image from 'next/image';
import { Id } from '../../../convex/_generated/dataModel';
import { CheckCircle, XCircle, Settings } from 'lucide-react';

type SubmissionDetailsModalProps = {
  submission: EnrichedReport | null;
  onClose: () => void;
};

const DetailRow = ({ label, value }: { label: React.ReactNode; value?: React.ReactNode }) => {
  if (!value && value !== 0 && typeof value !== 'boolean') return null;
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
      </p>
      <div style={{ marginTop: '4px', color: '#111827', fontSize: '16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
};

const FeedbackStatusManager = ({ submission, onClose }: { submission: EnrichedReport; onClose: () => void }) => {
  const updateStatusMutation = useMutation(api.feedback.updateFeedbackStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [actionTakenText, setActionTakenText] = useState('');

  type FeedbackStatus = 'pending' | 'can_be_implemented' | 'cannot_be_implemented' | 'waiting' | 'in_progress' | 'resolved';

  const handleUpdate = async (newStatus: FeedbackStatus) => {
    if (submission.type !== 'feedback') return;
    setIsUpdating(true);
    try {
      await updateStatusMutation({
        feedbackId: submission._id,
        status: newStatus,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update feedback status:", error);
      alert("Error updating status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (submission.type !== 'feedback' || actionTakenText.trim() === '') return;
    setIsUpdating(true);
    try {
      await updateStatusMutation({
        feedbackId: submission._id,
        status: 'resolved',
        actionTaken: actionTakenText,
      });
      onClose();
    } catch (error) {
      console.error("Failed to resolve feedback:", error);
      alert(`Error resolving feedback: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setIsUpdating(false);
      setIsResolving(false);
      setActionTakenText('');
    }
  };
  
  const buttonBaseStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    flex: 1, padding: '8px 12px', fontSize: '14px', fontWeight: 500,
    borderRadius: '6px', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s'
  };

  if (isResolving) {
    return (
      <div>
        <label htmlFor="actionTaken" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
          Action Taken
        </label>
        <textarea
          id="actionTaken"
          value={actionTakenText}
          onChange={(e) => setActionTakenText(e.target.value)}
          placeholder="Describe the steps taken to resolve this feedback..."
          rows={3}
          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            style={{ ...buttonBaseStyle, borderColor: '#d1d5db', color: '#4b5563', backgroundColor: '#f9fafb' }}
            onClick={() => setIsResolving(false)}
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            style={{
              ...buttonBaseStyle,
              borderColor: '#34d399', color: '#047857', backgroundColor: '#d1fae5',
              opacity: actionTakenText.trim() === '' || isUpdating ? 0.6 : 1,
              cursor: actionTakenText.trim() === '' || isUpdating ? 'not-allowed' : 'pointer',
            }}
            onClick={handleConfirmResolve}
            disabled={actionTakenText.trim() === '' || isUpdating}
          >
            {isUpdating ? 'Resolving...' : <><CheckCircle size={16} /> Confirm & Resolve</>}
          </button>
        </div>
      </div>
    );
  }
  
  const renderActions = () => {
    switch (submission.status) {
      case 'pending':
        return (
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button style={{ ...buttonBaseStyle, borderColor: '#34d399', color: '#047857', backgroundColor: '#d1fae5' }} onClick={() => handleUpdate('waiting')}><CheckCircle size={16} /> Can Implement</button>
            <button style={{ ...buttonBaseStyle, borderColor: '#fca5a5', color: '#b91c1c', backgroundColor: '#fee2e2' }} onClick={() => handleUpdate('cannot_be_implemented')}><XCircle size={16} /> Cannot Implement</button>
          </div>
        );
      case 'waiting':
        return (
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
             <button style={{ ...buttonBaseStyle, borderColor: '#818cf8', color: '#4c1d95', backgroundColor: '#e0e7ff' }} onClick={() => handleUpdate('in_progress')}><Settings size={16} /> Start Progress</button>
             <button style={{ ...buttonBaseStyle, borderColor: '#34d399', color: '#047857', backgroundColor: '#d1fae5' }} onClick={() => setIsResolving(true)}><CheckCircle size={16} /> Mark as Resolved</button>
          </div>
        );
      case 'in_progress':
        return (
          <div style={{ display: 'flex', marginTop: '4px' }}>
            <button style={{ ...buttonBaseStyle, borderColor: '#34d399', color: '#047857', backgroundColor: '#d1fae5' }} onClick={() => setIsResolving(true)}><CheckCircle size={16} /> Mark as Resolved</button>
          </div>
        );
      default:
        return null;
    }
  }

  if (submission.status === 'resolved' || submission.status === 'cannot_be_implemented') {
    return null;
  }

  return (
    <DetailRow
      label="Manage Status"
      value={isUpdating ? <span style={{ fontSize: '14px', color: '#6b7280' }}>Updating...</span> : renderActions()}
    />
  )
};

const SpecificDetails = ({ submission, onImageView, onClose }: { submission: EnrichedReport, onImageView: (url: string) => void, onClose: () => void }) => {
  let storageIdsToFetch: Id<"_storage">[] | 'skip' = 'skip';
  
  if ('imageIds' in submission && submission.imageIds && submission.imageIds.length > 0) {
    storageIdsToFetch = submission.imageIds;
  } else if ('imageId' in submission && typeof submission.imageId === 'string' && submission.imageId) {
    storageIdsToFetch = [submission.imageId as Id<"_storage">];
  }

  const imageUrls = useQuery(api.files.getMultipleImageUrls, storageIdsToFetch !== 'skip' ? { storageIds: storageIdsToFetch } : 'skip');
  const currentUser = useQuery(api.users.current);
  const isAdmin = currentUser?.isAdmin === true;

  let specificContent;
  switch (submission.type) {
    case 'serviceReport':
    case 'complaint':
      specificContent = (
        <>
          <DetailRow label="Problem Type" value={submission.problemType} />
          <DetailRow label="Complaint Details" value={submission.complaintText} />
        </>
      );
      break;
    case 'feedback':
      // --- MODIFIED: Added a display text for the feedback source ---
      const sourceText = submission.feedbackSource === 'customer' 
        ? 'Customer Feedback' 
        : submission.feedbackSource === 'engineer' 
        ? 'Engineer Feedback' 
        : undefined;

      specificContent = (
        <>
          {/* --- MODIFIED: Added DetailRow for the feedback source --- */}
          <DetailRow label="Feedback Source" value={sourceText} />
          <DetailRow label="Feedback Details" value={submission.feedbackDetails} />
          {submission.status === 'resolved' && submission.actionTaken && (
            <DetailRow label="Action Taken" value={submission.actionTaken} />
          )}
          {isAdmin && <FeedbackStatusManager submission={submission} onClose={onClose} />}
        </>
      );
      break;
    default:
      specificContent = null;
  }
  
  return (
    <>
      {specificContent}

      {imageUrls && imageUrls.length > 0 && (
        <DetailRow
          label={`Attached Image${imageUrls.length > 1 ? 's' : ''}`}
          value={
            <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {imageUrls.map((url, index) => (
                <button key={index} onClick={() => onImageView(url)} style={{ border: 'none', padding: 0, background: 'none', cursor: 'pointer', position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9fafb' }} aria-label={`View image ${index + 1} fullscreen`}>
                  <Image src={url} alt={`Submission attachment ${index + 1}`} layout="fill" objectFit="cover" />
                </button>
              ))}
            </div>
          }
        />
      )}
    </>
  );
};

export default function SubmissionDetailsModal({ submission, onClose }: SubmissionDetailsModalProps) {
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  if (!submission) {
    return null;
  }

  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();
  const handleImageView = (url: string) => setFullscreenImageUrl(url);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div onClick={handleContentClick} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', width: '90%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, textTransform: 'capitalize' }}>{submission.type.replace('Report', ' Report')} Details</h2>
            <button onClick={onClose} style={{ fontSize: '24px', color: '#6b7280', border: 'none', background: 'transparent', cursor: 'pointer', padding: '0', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ overflowY: 'auto', padding: '8px 24px 24px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <DetailRow label="Submitter" value={submission.submitterName} />
              <DetailRow label="Branch Location" value={submission.locationName} />
              <DetailRow label="Model(s)" value={submission.machineName} />
              <DetailRow label="Serial Number" value={(submission as { machineSerialNumber?: string }).machineSerialNumber} />
              <DetailRow label="Date Submitted" value={new Date(submission._creationTime).toLocaleString()} />
              {submission.status && <DetailRow label="Status" value={<StatusBadge status={submission.status} />} />}
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0' }} />
              <SpecificDetails submission={submission} onImageView={handleImageView} onClose={onClose} />
            </div>
          </div>
        </div>
      </div>

      {fullscreenImageUrl && (
        <div onClick={() => setFullscreenImageUrl(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '16px' }}>
          <button onClick={() => setFullscreenImageUrl(null)} style={{ position: 'absolute', top: '24px', right: '24px', color: 'white', fontSize: '32px', border: 'none', background: 'transparent', cursor: 'pointer', zIndex: 1060 }}>×</button>
          <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={(e) => e.stopPropagation()}>
            <Image src={fullscreenImageUrl} alt="Fullscreen submission attachment" layout="fill" objectFit="contain" />
          </div>
        </div>
      )}
    </>
  );
};