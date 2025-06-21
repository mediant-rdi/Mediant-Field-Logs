// components/forms/DashboardForm.tsx
'use client';

import { api } from '../../../convex/_generated/api'; // Adjust path if needed
import { Id } from '../../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useState } from 'react';

// Define the type for the enriched data we receive from our query
type EnrichedReport = {
  _id: Id<"serviceReports">;
  _creationTime: number;
  modelTypes: string;
  branchLocation: string;
  submitterName: string;
  status: "pending" | "approved" | "rejected";
};

type DashboardFormProps = {
  submissions: EnrichedReport[];
  isAdmin: boolean;
};

// A helper component for the status badge, using inline styles
const StatusBadge = ({ status }: { status: "pending" | "approved" | "rejected" }) => {
  const styles = {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      fontSize: '12px',
      fontWeight: '500',
      borderRadius: '9999px',
    },
    pending: {
      backgroundColor: '#fef9c3', // yellow-100
      color: '#854d0e', // yellow-800
    },
    approved: {
      backgroundColor: '#dcfce7', // green-100
      color: '#166534', // green-800
    },
    rejected: {
      backgroundColor: '#fee2e2', // red-100
      color: '#991b1b', // red-800
    },
  };

  return (
    <span style={{ ...styles.base, ...styles[status] }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const DashboardForm = ({ submissions, isAdmin }: DashboardFormProps) => {
  const updateStatus = useMutation(api.serviceReports.updateServiceReportStatus);
  const [updatingId, setUpdatingId] = useState<Id<"serviceReports"> | null>(null);

  const handleUpdateStatus = async (
    serviceReportId: Id<"serviceReports">,
    status: 'approved' | 'rejected'
  ) => {
    setUpdatingId(serviceReportId);
    try {
      await updateStatus({ serviceReportId, status });
      // No toast notification needed, the UI will re-render on its own.
    } catch (error) {
      console.error("Failed to update status:", error);
      // Optionally, show an alert or handle the error in another way.
      alert('Failed to update status. Please check the console for details.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Empty state, styled to match the clients page
  if (submissions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>No Reports Found</h3>
        <p style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6b7280' }}>
          There are no reports to display at this time.
        </p>
      </div>
    );
  }

  // Data table, styled to match the clients page
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Model / Location</th>
            <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Submitted By</th>
            <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
            <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
            {isAdmin && <th style={{ padding: '12px 8px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {submissions.map((report) => (
            <tr key={report._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 8px' }}>
                <div style={{ fontWeight: '500', color: '#111827' }}>{report.modelTypes}</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{report.branchLocation}</div>
              </td>
              <td style={{ padding: '12px 8px', color: '#374151', fontSize: '14px' }}>{report.submitterName}</td>
              <td style={{ padding: '12px 8px', color: '#374151', fontSize: '14px' }}>
                {new Date(report._creationTime).toLocaleDateString()}
              </td>
              <td style={{ padding: '12px 8px' }}><StatusBadge status={report.status} /></td>
              {isAdmin && (
                <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                  {report.status === 'pending' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        onClick={() => handleUpdateStatus(report._id, 'approved')}
                        disabled={updatingId === report._id}
                        style={{ color: '#16a34a', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', opacity: updatingId === report._id ? 0.5 : 1 }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(report._id, 'rejected')}
                        disabled={updatingId === report._id}
                        style={{ color: '#dc2626', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', opacity: updatingId === report._id ? 0.5 : 1 }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Resolved</span>
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