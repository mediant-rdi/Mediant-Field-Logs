// src/app/dashboard/service-logs/admin/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import AdminProtection from '@/components/AdminProtection';
import { Toaster, toast } from 'sonner';
import { Power, PowerOff, Loader2, Server, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminServiceLogsPage() {
  const settings = useQuery(api.systemSettings.getServicePeriodStatus);
  const activatePeriod = useMutation(api.systemSettings.activateServicePeriod);
  const deactivatePeriod = useMutation(api.systemSettings.deactivateServicePeriod);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodName, setPeriodName] = useState('');

  const handleActivate = async () => {
    if (periodName.trim().length === 0) {
      toast.error('Please enter a name for the service period.');
      return;
    }
    setIsProcessing(true);
    const toastId = toast.loading('Activating service period...');
    try {
      const result = await activatePeriod({ name: periodName });
      toast.success(`Service period "${periodName}" activated. ${result.logsCreated} logs created.`, { id: toastId });
      setIsModalOpen(false);
      setPeriodName('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Activation failed.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivate = async (force = false) => {
    if (!force && !window.confirm("Are you sure you want to deactivate the current service period?")) {
        return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('Deactivating service period...');
    try {
      const result = await deactivatePeriod({ force });

      if (result.needsConfirmation) {
        toast.warning(
          `There are ${result.inProgressCount} jobs still in progress. Deactivating will hide them from engineers.`,
          {
            id: toastId,
            action: {
              label: 'Deactivate Anyway',
              onClick: () => handleDeactivate(true),
            },
            duration: 10000,
          }
        );
      } else if (result.success) {
        toast.success('Service period deactivated successfully.', { id: toastId });
      } else {
        toast.info(result.message || 'No active period to deactivate.', { id: toastId });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Deactivation failed.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = settings === undefined;
  const isActive = settings?.isServicePeriodActive === true;

  return (
    <AdminProtection>
      <Toaster position="top-center" richColors />
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Activate New Service Period</h3>
            <p className="text-sm text-gray-500 mt-1">This will generate a new set of service logs for all assigned engineers.</p>
            <div className="mt-4">
              <label htmlFor="periodName" className="block text-sm font-medium text-gray-700">Period Name (e.g., &quot;Q4 2024&quot;)</label>
              <input
                id="periodName"
                type="text"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                placeholder="Enter a descriptive name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-6 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} disabled={isProcessing} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition-colors">Cancel</button>
              <button onClick={handleActivate} disabled={isProcessing} className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
                Activate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Service Period Management</h1>
            <p className="mt-1 text-sm text-gray-600">Control the global service period for all engineers.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isLoading ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /> : <Server className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Status</p>
                {isLoading ? (
                  <div className="h-7 w-24 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                ) : (
                  <p className={`text-xl font-bold ${isActive ? 'text-green-700' : 'text-gray-800'}`}>
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </p>
                )}
              </div>
            </div>
            {isActive && !isLoading && (
              <div className="text-sm text-right">
                <p className="font-medium text-gray-800">{settings?.servicePeriodName}</p>
                <p className="text-gray-500">ID: {settings?.currentServicePeriodId}</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              {isActive 
                ? 'Deactivating the period will hide the service logs page from engineers and stop automatic completion from call logs. Progress will be saved.' 
                : 'Activating a new period will generate a fresh set of pending service logs for every engineer based on their current site assignments.'}
            </p>
            {isActive ? (
              <button onClick={() => handleDeactivate()} disabled={isProcessing || isLoading} className="w-full sm:w-auto self-end flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PowerOff className="w-5 h-5" />}
                Deactivate Period
              </button>
            ) : (
              <button onClick={() => setIsModalOpen(true)} disabled={isProcessing || isLoading} className="w-full sm:w-auto self-end flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <Power className="w-5 h-5" />
                Activate New Period
              </button>
            )}
          </div>
        </div>
        
         <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg">
            <div className="flex">
                <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-yellow-500"/></div>
                <div className="ml-3">
                    <p className="text-sm">
                        Remember to assign service sites to engineers on the <Link href="/dashboard/users" className="font-medium underline hover:text-yellow-900">User Management</Link> page before activating a new period.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </AdminProtection>
  );
}