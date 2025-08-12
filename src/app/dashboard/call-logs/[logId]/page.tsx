'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, MapPin, AlertTriangle, User, Calendar, Flag, Clock, UserCheck } from 'lucide-react';

// --- MODIFICATION: New helper to create a Google Maps link with a label ---
const getGoogleMapsLink = (lat?: number, lon?: number, label?: string) => {
  if (lat === undefined || lon === undefined) return null;
  const encodedLabel = label ? `(${encodeURIComponent(label)})` : '';
  return `https://www.google.com/maps?q=${lat},${lon}${encodedLabel}`;
};

// --- MODIFICATION: Define type for enriched location data for component props ---
type EnrichedLocation = {
  latitude: number;
  longitude: number;
  capturedBy: Id<"users">;
  capturedAt: number;
  capturedByName: string;
};

// --- MODIFICATION: New reusable component to display an enhanced location block ---
const LocationBlock = ({ title, locationData }: { title: string, locationData?: EnrichedLocation }) => {
  const mapLink = getGoogleMapsLink(locationData?.latitude, locationData?.longitude, locationData?.capturedByName);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">{title}</h3>
      {locationData && mapLink ? (
        <div className="space-y-3">
          <a 
            href={mapLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <MapPin className="w-5 h-5" />
            View {locationData.capturedByName}'s Location
          </a>
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <UserCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Captured by: {locationData.capturedByName}</p>
              <p className="text-xs text-blue-700 mt-1">
                {format(new Date(locationData.capturedAt), 'dd MMMM yyyy, h:mm a')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-800">No location was recorded for this event.</p>
        </div>
      )}
    </div>
  );
};

// Reusable component to display a time block
const TimeBlock = ({ title, time }: { title: string, time?: number }) => (
  <div className="flex items-start space-x-3">
    <div className="flex-shrink-0 mt-1"><Clock className="w-5 h-5 text-gray-400"/></div>
    <div>
      <h4 className="font-medium text-gray-600">{title}</h4>
      {time ? (
        <p className="text-md text-gray-900">{format(new Date(time), 'dd MMMM yyyy, h:mm a')}</p>
      ) : (
        <p className="text-md text-gray-500 italic">Not available</p>
      )}
    </div>
  </div>
);

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
            {callLog.isEscalated && (
              <span className="mt-1 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Escalated Issue
              </span>
            )}
          </div>
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Issue Details</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{callLog.issue}</p>
            </div>
            
            {/* General Details */}
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
              <div className="flex items-start space-x-3 md:col-span-2">
                <div className="flex-shrink-0 mt-1"><User className="w-5 h-5 text-gray-400"/></div>
                <div>
                  <h4 className="font-medium text-gray-600">Assigned Engineers</h4>
                  <p className="text-md text-gray-900">{callLog.engineers.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Conditional Timeline & Location Details */}
            {callLog.isEscalated ? (
              <div className="space-y-8 border-t pt-8 mt-8">
                <h3 className="text-xl font-bold text-gray-800">Job Timeline</h3>
                {/* 1. Initial Job */}
                <div className="pl-4 border-l-4 border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">1. Initial Job Start</h4>
                    <div className="space-y-6">
                      <TimeBlock title="Initial Job Started At" time={callLog.jobStartTime} />
                      <LocationBlock title="Initial Start Location" locationData={callLog.startLocation} />
                    </div>
                </div>
                {/* 2. Escalation Job */}
                <div className="pl-4 border-l-4 border-yellow-400">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">2. Escalated Job Start</h4>
                    <div className="space-y-6">
                      <TimeBlock title="Escalated Job Started At" time={callLog.escalatedJobStartTime} />
                      <LocationBlock title="Escalated Start Location" locationData={callLog.escalatedStartLocation} />
                    </div>
                </div>
                {/* 3. Completion */}
                <div className="pl-4 border-l-4 border-green-400">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">3. Job Completion</h4>
                    <div className="space-y-6">
                      <TimeBlock title="Job Finished At" time={callLog.jobEndTime} />
                      <LocationBlock title="Job End Location" locationData={callLog.endLocation} />
                    </div>
                </div>
              </div>
            ) : (
              // Standard View for non-escalated jobs
              <div className="border-t pt-8 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8">
                  <TimeBlock title="Job Started At" time={callLog.jobStartTime} />
                  <TimeBlock title="Job Finished At" time={callLog.jobEndTime} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <LocationBlock title="Job Start Location" locationData={callLog.startLocation} />
                  <LocationBlock title="Job End Location" locationData={callLog.endLocation} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}