// app/dashboard/call-logs/[logId]/loading.tsx

import { ArrowLeft, Calendar, Flag, User, Clock, MapPin } from 'lucide-react';

export default function CallLogDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center text-sm font-medium text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-200">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="mt-2 h-5 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Issue Details</h3>
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1"><Calendar className="w-5 h-5 text-gray-300"/></div>
                <div className="w-full">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-1"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
               <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1"><Flag className="w-5 h-5 text-gray-300"/></div>
                <div className="w-full">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-1"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex items-start space-x-3 md:col-span-2">
                <div className="flex-shrink-0 mt-1"><User className="w-5 h-5 text-gray-300"/></div>
                <div className="w-full">
                  <div className="h-5 bg-gray-200 rounded w-1/4 mb-1"></div>
                  <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            </div>

            <div className="border-t pt-8 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8">
                 <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1"><Clock className="w-5 h-5 text-gray-300"/></div>
                    <div className="w-full">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-1"></div>
                      <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                   <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1"><Clock className="w-5 h-5 text-gray-300"/></div>
                    <div className="w-full">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-1"></div>
                      <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Job Start Location</h3>
                  <div className="mt-4 flex items-center gap-3 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Job End Location</h3>
                  <div className="mt-4 flex items-center gap-3 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}