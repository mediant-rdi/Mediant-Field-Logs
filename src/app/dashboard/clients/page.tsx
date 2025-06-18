// app/dashboard/clients/page.tsx
'use client';

export default function ViewClientsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">
        Client Management
      </h1>
      <p className="mt-2 text-gray-600">
        This page will display a searchable and sortable list of all clients.
      </p>

      <div className="mt-8 p-6 border border-dashed border-gray-300 rounded-lg bg-white">
        <p className="text-center text-gray-500">
          {/* Client data table or list component will go here */}
          Client data table will be rendered here.
        </p>
      </div>
    </div>
  );
}