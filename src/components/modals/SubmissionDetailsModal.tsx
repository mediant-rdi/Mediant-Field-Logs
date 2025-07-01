// components/modals/SubmissionDetailsModal.tsx
'use client';

import { useState } from 'react';

// POTENTIAL CAUSE OF THE REACT ERROR:
// The imports below might be creating a circular dependency. If 'DashboardForm.tsx' (or the page
// that uses it) dynamically imports this modal, and this modal statically imports components/types
// from 'DashboardForm.tsx', it can lead to errors like "Expected static flag was missing".
//
// RECOMMENDED FIX:
// 1. Move the `EnrichedReport` type to a dedicated types file (e.g., 'src/types/index.ts').
// 2. Move the `StatusBadge` component to its own file (e.g., 'src/components/ui/StatusBadge.tsx').
// 3. Update the imports here and in 'DashboardForm.tsx' to point to these new, separate files.
//
// For example:
// import type { EnrichedReport } from '@/types';
// import { StatusBadge } from '@/components/ui/StatusBadge';
import { EnrichedReport, StatusBadge } from '@/components/forms/DashboardForm';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Image from 'next/image';

type SubmissionDetailsModalProps = {
  submission: EnrichedReport | null;
  onClose: () => void;
};

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => {
  if (!value && value !== 0) return null;
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{label}</p>
      <div style={{ marginTop: '4px', color: '#111827', fontSize: '16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
};

const SpecificDetails = ({ submission, onImageView }: { submission: EnrichedReport, onImageView: () => void }) => {
  const imageUrl = useQuery(
    api.files.getImageUrl,
    submission.imageId ? { storageId: submission.imageId } : 'skip'
  );

  return (
    <>
      {(() => {
        // Switch statement for details remains unchanged
        switch (submission.type) {
          case 'serviceReport':
            return (
              <>
                <DetailRow label="Problem Type" value={submission.problemType} />
                <DetailRow label="Complaint Details" value={submission.complaintText} />
                <DetailRow label="Solution Provided" value={submission.solution} />
                {submission.otherText && <DetailRow label="Other Notes" value={submission.otherText} />}
              </>
            );
          case 'complaint':
            return (
              <>
                <DetailRow label="Problem Type" value={submission.problemType} />
                <DetailRow label="Complaint Details" value={submission.complaintText} />
                <DetailRow label="Solution Provided" value={submission.solution} />
                {submission.otherProblemDetails && <DetailRow label="Other Problem Notes" value={submission.otherProblemDetails} />}
              </>
            );
          case 'feedback':
            return (
              <>
                <DetailRow label="Feedback Details" value={submission.feedbackDetails} />
              </>
            );
          default:
            return null;
        }
      })()}
      {imageUrl && (
        <DetailRow
          label="Attached Image"
          value={
            <div style={{ marginTop: '8px', position: 'relative' }}>
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
                <Image src={imageUrl} alt="Submission attachment" layout="fill" objectFit="contain" />
              </div>
              <button
                onClick={onImageView}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                View
              </button>
            </div>
          }
        />
      )}
    </>
  );
};

export default function SubmissionDetailsModal({ submission, onClose }: SubmissionDetailsModalProps) {
  // FIX 1: Hooks must be called unconditionally at the top level.
  // The early return `if (!submission)` was moved below all hook calls.
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const imageUrl = useQuery(
    api.files.getImageUrl,
    // Ensure we don't query if submission or imageId is missing
    isImageFullscreen && submission?.imageId ? { storageId: submission.imageId } : 'skip'
  );

  if (!submission) {
    return null;
  }

  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

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
              <DetailRow label="Branch Location" value={submission.branchLocation} />
              <DetailRow label="Model(s)" value={submission.modelTypes} />
              <DetailRow label="Date Submitted" value={new Date(submission._creationTime).toLocaleString()} />
              <DetailRow label="Status" value={submission.status ? <StatusBadge status={submission.status} /> : 'N/A'} />
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0' }} />
              <SpecificDetails submission={submission} onImageView={() => setIsImageFullscreen(true)} />
            </div>
          </div>
        </div>
      </div>

      {isImageFullscreen && imageUrl && (
        <div
          onClick={() => setIsImageFullscreen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1050, 
            padding: '16px',
          }}
        >
          <button
            onClick={() => setIsImageFullscreen(false)}
            // FIX 2: Added a zIndex to ensure the button is clickable.
            // The button was being covered by the image container div.
            style={{ position: 'absolute', top: '24px', right: '24px', color: 'white', fontSize: '32px', border: 'none', background: 'transparent', cursor: 'pointer', zIndex: 1060 }}
          >
            ×
          </button>
          <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={(e) => e.stopPropagation()}>
            <Image
              src={imageUrl}
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