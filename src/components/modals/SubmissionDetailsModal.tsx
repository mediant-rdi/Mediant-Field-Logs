// components/modals/SubmissionDetailsModal.tsx
'use client';

import { EnrichedReport, StatusBadge } from '@/components/forms/DashboardForm';

type SubmissionDetailsModalProps = {
  submission: EnrichedReport | null;
  onClose: () => void;
};

const DetailRow = ({ label, value }: { label: string, value?: React.ReactNode }) => {
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

const SpecificDetails = ({ submission }: { submission: EnrichedReport }) => {
  switch (submission.type) {
    case 'serviceReport':
      // --- FIX: Display fields that actually exist in the schema ---
      return (
        <>
          <DetailRow label="Problem Type" value={submission.problemType} />
          <DetailRow label="Complaint Details" value={submission.complaintText} />
          <DetailRow label="Solution Provided" value={submission.solution} />
          {submission.otherText && <DetailRow label="Other Notes" value={submission.otherText} />}
        </>
      );
    case 'complaint':
      // --- FIX: Display fields that actually exist in the schema ---
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
};

export const SubmissionDetailsModal = ({ submission, onClose }: SubmissionDetailsModalProps) => {
  if (!submission) return null;
  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();
  return ( <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}> <div onClick={handleContentClick} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}> <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, textTransform: 'capitalize' }}> {submission.type.replace('Report', ' Report')} Details </h2> <button onClick={onClose} style={{ fontSize: '24px', color: '#6b7280', border: 'none', background: 'transparent', cursor: 'pointer' }}>×</button> </div> <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}> <DetailRow label="Submission ID" value={submission._id} /> <DetailRow label="Submitter" value={submission.submitterName} /> <DetailRow label="Branch Location" value={submission.branchLocation} /> <DetailRow label="Model(s)" value={submission.modelTypes} /> <DetailRow label="Date Submitted" value={new Date(submission._creationTime).toLocaleString()} /> <DetailRow label="Status" value={submission.status ? <StatusBadge status={submission.status} /> : 'N/A'}/> {/* The 'mainText' is now complaintText, so this is just a summary */} <div style={{height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0'}} /> <SpecificDetails submission={submission} /> </div> </div> </div> );
};