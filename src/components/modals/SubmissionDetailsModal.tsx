// components/modals/SubmissionDetailsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { EnrichedReport, StatusBadge } from '@/components/forms/DashboardForm';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Image from 'next/image';
import { Id } from '../../../convex/_generated/dataModel';

type SubmissionDetailsModalProps = {
  submission: EnrichedReport | null;
  onClose: () => void;
};

// DetailRow component is unchanged
const DetailRow = ({ label, value }: { label: React.ReactNode; value?: React.ReactNode }) => {
  if (!value && value !== 0) return null;
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

// SpecificDetails is unchanged
const SpecificDetails = ({ submission, onImageView }: { submission: EnrichedReport, onImageView: (url: string) => void }) => {
 
  let storageIdsToFetch: Id<"_storage">[] | 'skip' = 'skip';
  
  if ('imageIds' in submission && submission.imageIds && submission.imageIds.length > 0) {
    storageIdsToFetch = submission.imageIds;
  } else if ('imageId' in submission && typeof submission.imageId === 'string' && submission.imageId) {
    storageIdsToFetch = [submission.imageId as Id<"_storage">];
  }

  const imageUrls = useQuery(
    api.files.getMultipleImageUrls,
    storageIdsToFetch !== 'skip' ? { storageIds: storageIdsToFetch } : 'skip'
  );

  const currentUser = useQuery(api.users.current);
  const editSolutionMutation = useMutation(api.complaints.editSubmissionSolution);
  const [isEditingSolution, setIsEditingSolution] = useState(false);
  const [solutionText, setSolutionText] = useState(
    submission.type === 'complaint' || submission.type === 'serviceReport' ? submission.solution || '' : ''
  );
  useEffect(() => {
    if (submission.type === 'complaint' || submission.type === 'serviceReport') {
      setSolutionText(submission.solution || '');
    }
    setIsEditingSolution(false);
  }, [submission]);
  const handleSaveSolution = async () => {
    if (submission.type !== 'complaint' && submission.type !== 'serviceReport') return;
    try {
      await editSolutionMutation({
        submissionId: submission._id,
        submissionType: submission.type,
        newSolution: solutionText,
      });
      setIsEditingSolution(false);
    } catch (error) {
      console.error("Failed to save solution:", error);
      alert("Error saving solution. Only admins can perform this action.");
    }
  };
  const isAdmin = currentUser?.isAdmin === true;
  const canEditSolution = isAdmin && (submission.type === 'complaint' || submission.type === 'serviceReport');
  const SolutionEditor = (
    <>
      {isEditingSolution ? (
        <div style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Solution Provided</p>
          <textarea
            value={solutionText}
            onChange={(e) => setSolutionText(e.target.value)}
            rows={5}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '16px', resize: 'vertical' }}
            autoFocus
          />
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={() => { setIsEditingSolution(false); setSolutionText((submission.type === 'complaint' || submission.type === 'serviceReport') ? submission.solution || '' : ''); }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSolution}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <DetailRow
          label={<><span>Solution Provided</span>{canEditSolution && (<button onClick={() => setIsEditingSolution(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '14px', fontWeight: 500, padding: '4px' }}>Edit</button>)}</>}
          value={solutionText}
        />
      )}
    </>
  );

  return (
    <>
      {(() => {
        switch (submission.type) {
          case 'serviceReport':
          case 'complaint':
            return (
              <>
                <DetailRow label="Problem Type" value={submission.problemType} />
                <DetailRow label="Complaint Details" value={submission.complaintText} />
                {SolutionEditor}
                {submission.type === 'serviceReport' && submission.otherText && <DetailRow label="Other Notes" value={submission.otherText} />}
                {submission.type === 'complaint' && 'otherProblemDetails' in submission && submission.otherProblemDetails && <DetailRow label="Other Problem Notes" value={submission.otherProblemDetails} />}
              </>
            );
          case 'feedback':
            return <DetailRow label="Feedback Details" value={'feedbackDetails' in submission ? submission.feedbackDetails : ''} />;
          default:
            return null;
        }
      })()}

      {imageUrls && imageUrls.length > 0 && (
        <DetailRow
          label={`Attached Image${imageUrls.length > 1 ? 's' : ''}`}
          value={
            <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => onImageView(url)}
                  style={{ border: 'none', padding: 0, background: 'none', cursor: 'pointer', position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9fafb' }}
                  aria-label={`View image ${index + 1} fullscreen`}
                >
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

  const handleImageView = (url: string) => {
    setFullscreenImageUrl(url);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
        }}
      >
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
              {/* --- MODIFIED: Conditionally display the serial number --- */}
              <DetailRow label="Serial Number" value={(submission as { machineSerialNumber?: string }).machineSerialNumber} />
              <DetailRow label="Date Submitted" value={new Date(submission._creationTime).toLocaleString()} />
              {submission.status && <DetailRow label="Status" value={<StatusBadge status={submission.status} />} />}
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0' }} />
              <SpecificDetails submission={submission} onImageView={handleImageView} />
            </div>
          </div>
        </div>
      </div>

      {fullscreenImageUrl && (
        <div
          onClick={() => setFullscreenImageUrl(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1050, 
            padding: '16px',
          }}
        >
          <button
            onClick={() => setFullscreenImageUrl(null)}
            style={{ position: 'absolute', top: '24px', right: '24px', color: 'white', fontSize: '32px', border: 'none', background: 'transparent', cursor: 'pointer', zIndex: 1060 }}
          >
            ×
          </button>
          <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={(e) => e.stopPropagation()}>
            <Image
              src={fullscreenImageUrl}
              alt="Fullscreen submission attachment"
              layout="fill"
              objectFit="contain"
            />
          </div>
        </div>
      )}
    </>
  );
};