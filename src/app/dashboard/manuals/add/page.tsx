// src/app/dashboard/manuals/add/page.tsx
"use client";

import { AddManualForm } from "../../../../components/forms/AddManualForm";

export default function AddManualPage() {
  return (
    // Responsive container with padding and max-width, matching the reference style
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-xl mx-auto my-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
        Add a New Manual
      </h1>
      
      <AddManualForm />
    </div>
  );
}