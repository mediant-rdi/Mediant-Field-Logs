'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
// --- ADD Clock ICON ---
import { ArrowLeft, Loader2, MapPin, AlertTriangle, Briefcase, User, Calendar, Flag, Clock } from 'lucide-react';

// Helper to create a Google Maps link
const getGoogleMapsLink = (lat?: number, lon?: number) => {
  if (lat === undefined || lon === undefined) return null;
  return `https://www.google.com/maps?q=${lat},${lon}`;
};

export default function CallLogDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.logId as Id<"callLogs">;

  const callLog = useQuery(api.callLogs.getById, logId ? { id: logId } : 'skip');

  if (callLog === undefined) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  if (callLog === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-4">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-red-600">Call Log Not Found</h1>
        <p className="text-gray-500 mt-2 max-w-md">The requested call log does not exist or you may not have permission to view it.</p>
        <button 
          onClick={() => router.back()}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  const mapLink = getGoogleMapsLink(callLog.startLocation?.latitude, callLog.startLocation?.longitude);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{callLog.clientName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Job ID: {callLog._id}
            </p>
          </div>
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Issue Details</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{callLog.issue}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1"><Calendar className="w-5 h-5 text-gray-400"/></div>
                <div>
                  <h4 className="font-medium text-gray-600">Date Logged</h4>
                  <p className="text-md text-gray-900">{format(new Date(callLog._creationTime), 'dd MMMM yyyy, h:mm a')}</p>
                </div>
              </div>
               <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1"><Flag className="w-5 h-5 text-gray-400"/></div>
                <div>
                  <h4 className="font-medium text-gray-600">Status</h4>
                  <p className="text-md font-semibold text-gray-900">{callLog.status}</p>
                </div>
              </div>
              {/* --- ADDED JOB START TIME DISPLAY --- */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1"><Clock className="w-5 h-5 text-gray-400"/></div>
                <div>
                  <h4 className="font-medium text-gray-600">Job Started At</h4>
                  {callLog.jobStartTime ? (
                    <p className="text-md text-gray-900">{format(new Date(callLog.jobStartTime), 'dd MMMM yyyy, h:mm a')}</p>
                  ) : (
                    <p className="text-md text-gray-500 italic">Not started yet</p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1"><User className="w-5 h-5 text-gray-400"/></div>
                <div>
                  <h4 className="font-medium text-gray-600">Assigned Engineers</h4>
                  <p className="text-md text-gray-900">{callLog.engineers.join(', ')}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Job Start Location</h3>
              {mapLink ? (
                <div className="mt-2">
                  <a 
                    href={mapLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <MapPin className="w-5 h-5" />
                    View on Google Maps
                  </a>
                  <p className="text-xs text-gray-500 mt-2">
                    Coordinates Captured: {callLog.startLocation?.latitude?.toFixed(6)}, {callLog.startLocation?.longitude?.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">No start location was recorded for this job.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}