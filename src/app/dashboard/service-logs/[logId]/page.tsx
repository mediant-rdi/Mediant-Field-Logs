// src/app/dashboard/service-logs/[logId]/page.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, MapPin, AlertTriangle, User, Calendar, Flag, Clock, UserCheck, MessageSquare } from 'lucide-react';

const getGoogleMapsLink = (lat?: number, lon?: number, label?: string) => {
  if (lat === undefined || lon === undefined) return null;
  const encodedLabel = label ? `(${encodeURIComponent(label)})` : '';
  return `https://www.google.com/maps?q=${lat},${lon}${encodedLabel}`;
};

type EnrichedLocation = {
  latitude: number;
  longitude: number;
  capturedBy: Id<"users">;
  capturedAt: number;
  capturedByName: string;
};

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
            View {locationData.capturedByName}&apos;s Location
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

const TimeBlock = ({ title, time, byUser }: { title: string, time?: number, byUser?: string | null }) => (
  <div className="flex items-start space-x-3">
    <div className="flex-shrink-0 mt-1"><Clock className="w-5 h-5 text-gray-400"/></div>
    <div>
      <h4 className="font-medium text-gray-600">{title}</h4>
      {time ? (
        <>
            <p className="text-md text-gray-900">{format(new Date(time), 'dd MMMM yyyy, h:mm a')}</p>
            {byUser && <p className="text-sm text-gray-500">by {byUser}</p>}
        </>
      ) : (
        <p className="text-md text-gray-500 italic">Not available</p>
      )}
    </div>
  </div>
);

export default function ServiceLogDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.logId as Id<"serviceLogs">;

  const serviceLog = useQuery(api.serviceLogs.getById, logId ? { id: logId } : 'skip');

  if (serviceLog === undefined) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  if (serviceLog === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-4">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-red-600">Service Log Not Found</h1>
        <p className="text-gray-500 mt-2 max-w-md">The requested service log does not exist or you may not have permission to view it.</p>
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
            Back to Service Logs
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{serviceLog.locationName}</h1>
            <p className="text-sm text-gray-500 mt-1">Planned Service Log Details</p>
          </div>
          <div className="p-6 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1"><Calendar className="w-5 h-5 text-gray-400"/></div>
                <div>
                  <h4 className="font-medium text-gray-600">Date Logged</h4>
                  <p className="text-md text-gray-900">{format(new Date(serviceLog._creationTime), 'dd MMMM yyyy')}</p>
                </div>
              </div>
               <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1"><Flag className="w-5 h-5 text-gray-400"/></div>
                <div>
                  <h4 className="font-medium text-gray-600">Status</h4>
                  <p className="text-md font-semibold text-gray-900">{serviceLog.status}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 md:col-span-2">
                <div className="flex-shrink-0 mt-1"><User className="w-5 h-5 text-gray-400"/></div>
                <div>
                  <h4 className="font-medium text-gray-600">Assigned Engineer</h4>
                  <p className="text-md text-gray-900">{serviceLog.assignedEngineerName}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-8 mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Job Timeline & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8">
                {/* MODIFICATION: Show who started the job */}
                <TimeBlock title="Job Started At" time={serviceLog.jobStartTime} byUser={serviceLog.startedByName} />
                <TimeBlock title="Job Finished At" time={serviceLog.jobEndTime} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <LocationBlock title="Job Start Location" locationData={serviceLog.startLocation} />
                <LocationBlock title="Job End Location" locationData={serviceLog.endLocation} />
              </div>
            </div>
            
            {/* --- MODIFICATION START: Updated Completion Details section --- */}
            {(serviceLog.completionMethod || serviceLog.completionNotes) && (
              <div className="border-t pt-8 mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Completion Details</h3>
                <div className="space-y-6">
                  {serviceLog.completionMethod && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1"><UserCheck className="w-5 h-5 text-gray-400"/></div>
                      <div>
                        <h4 className="font-medium text-gray-600">Completion Method</h4>
                        <p className="text-md text-gray-900">{serviceLog.completionMethod}</p>
                        {serviceLog.completedByName && (
                          <p className="text-sm text-gray-500">
                            by {serviceLog.completionMethod === 'Coordinator Override' ? 'Coordinator: ' : ''}{serviceLog.completedByName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {serviceLog.completionNotes && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1"><MessageSquare className="w-5 h-5 text-gray-400"/></div>
                      <div>
                        <h4 className="font-medium text-gray-600">
                          {serviceLog.completionMethod === 'Coordinator Override' ? "Coordinator's Reason" : "Engineer's Notes"}
                        </h4>
                        <p className="text-md text-gray-700 italic bg-gray-50 p-3 rounded-md border w-full whitespace-pre-wrap">
                          {serviceLog.completionNotes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* --- MODIFICATION END --- */}

          </div>
        </div>
      </div>
    </div>
  );
}