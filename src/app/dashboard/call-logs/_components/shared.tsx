// app/dashboard/call-logs/_components/shared.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Resolved': return 'bg-green-100 text-green-800';
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'In Progress': return 'bg-blue-100 text-blue-800';
    case 'Escalated': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const ChartSkeleton = () => (
    <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full"></div>
);

export const CallLogChart = () => {
    const recentLogs = useQuery(api.callLogs.getRecentLogsForChart);

    const chartData = useMemo(() => {
        if (!recentLogs) return undefined;

        const counts = new Map<string, number>();
        for (const log of recentLogs) {
            counts.set(log.clientName, (counts.get(log.clientName) ?? 0) + 1);
        }

        const sortedData = Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        
        return sortedData.slice(0, 5).reverse();
    }, [recentLogs]);

    if (recentLogs === undefined) {
        return <ChartSkeleton />;
    }

    if (!chartData || chartData.length === 0) {
        return (
            <div className="bg-gray-50 p-6 rounded-lg text-center border">
                <h3 className="text-lg font-medium text-gray-900">Call Log Activity</h3>
                <p className="mt-1 text-sm text-gray-500">No call log data available for the past 30 days to display a chart.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-12">Most Frequent Clients (Last 30 Days)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} stroke="#9ca3af" fontSize={12} />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={150} 
                            tick={{ fontSize: 12 }} 
                            stroke="#9ca3af"
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(239, 246, 255, 0.7)' }}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem' }}
                            labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" name="Call Logs" fill="#4f46e5" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};