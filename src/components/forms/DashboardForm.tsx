// components/forms/DashboardForm.tsx
'use client';

import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useState } from 'react';

// UPDATED: The EnrichedReport type now handles all three submission types.
type EnrichedReport = {
  _id: Id<"serviceReports"> | Id<"complaints"> | Id<"feedback">;
  _creationTime: number;
  modelTypes: string;
  branchLocation: string;
  submitterName: string;
  status?: "pending" | "approved" | "rejected"; // Status is now optional
  type: 'serviceReport' | 'complaint' | 'feedback';
  mainText: string; // A common field for the main details
};

type DashboardFormProps = {
  submissions: EnrichedReport[];
  isAdmin: boolean;
};

const StatusBadge = ({ status }: { status: "pending" | "approved" | "rejected" }) => {
    // ... (This component needs no changes)
    const styles = { base: { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', fontSize: '12px', fontWeight: '500', borderRadius: '9999px', }, pending: { backgroundColor: '#fef9c3', color: '#854d0e', }, approved: { backgroundColor: '#dcfce7', color: '#166534', }, rejected: { backgroundColor: '#fee2e2', color: '#991b1b', }, };
    return ( <span style={{ ...styles.base, ...styles[status] }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span> );
};

export const DashboardForm = ({ submissions, isAdmin }: DashboardFormProps) => {
  const updateServiceReport = useMutation(api.serviceReports.updateServiceReportStatus);
  const updateComplaint = useMutation(api.complaints.updateComplaintStatus);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (
    id: Id<"serviceReports"> | Id<"complaints">,
    status: 'approved' | 'rejected',
    type: 'serviceReport' | 'complaint' // Feedback can't be updated
  ) => {
    setUpdatingId(id);
    try {
      if (type === 'serviceReport') {
        await updateServiceReport({ serviceReportId: id as Id<"serviceReports">, status });
      } else if (type === 'complaint') {
        await updateComplaint({ complaintId: id as Id<"complaints">, status });
      }
    } catch (error) {
      console.error(`Failed to update ${type} status:`, error);
      alert(`Failed to update status. Please check the console for details.`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (submissions.length === 0) {
    // ... (This empty state needs no changes)
    return ( <div style={{ textAlign: 'center', padding: '40px 0' }}><h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>No Reports Found</h3><p style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6b7280' }}>There are no reports to display for this category.</p></div> );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            {/* UPDATED: Changed header to be more generic */}
            <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Details</th>
            <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Submitted By</th>
            <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
            <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
            {isAdmin && <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {submissions.map((report) => (
            <tr key={report._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              {/* UPDATED: The main cell now shows the main text and secondary info */}
              <td style={{ padding: '12px 8px', maxWidth: '300px' }}>
                <div style={{ fontWeight: '500', color: '#111827', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{report.mainText}</div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{report.modelTypes} @ {report.branchLocation}</div>
              </td>
              <td style={{ padding: '12px 8px', color: '#374151', fontSize: '14px' }}>{report.submitterName}</td>
              <td style={{ padding: '12px 8px', color: '#374151', fontSize: '14px' }}>
                {new Date(report._creationTime).toLocaleDateString()}
              </td>
              {/* UPDATED: Conditionally render status or a dash */}
              <td style={{ padding: '12px 8px' }}>
                {report.status ? <StatusBadge status={report.status} /> : <span style={{ color: '#6b7280' }}>-</span>}
              </td>
              {isAdmin && (
                <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                  {/* The `report.status === 'pending'` check now correctly handles all cases */}
                  {report.status === 'pending' && report.type !== 'feedback' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        onClick={() => {
                          if (report.type === 'serviceReport' || report.type === 'complaint') {
                            handleStatusUpdate(
                              report._id as Id<"serviceReports"> | Id<"complaints">,
                              'approved',
                              report.type
                            );
                          }
                        }}
                        disabled={updatingId === report._id}
                        style={{ color: '#16a34a', fontWeight: '500', cursor: 'pointer' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          if (report.type === 'serviceReport' || report.type === 'complaint') {
                            handleStatusUpdate(
                              report._id as Id<"serviceReports"> | Id<"complaints">,
                              'rejected',
                              report.type
                            );
                          }
                        }}
                        disabled={updatingId === report._id}
                        style={{ color: '#dc2626', fontWeight: '500', cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      {report.status ? 'Resolved' : 'N/A'}
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};