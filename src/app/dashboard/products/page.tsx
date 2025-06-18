// app/dashboard/products/page.tsx
'use client';

export default function ViewProductsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">
        Product Catalog
      </h1>
      <p className="mt-2 text-gray-600">
        A list or grid of all company products will be displayed here.
      </p>

      <div className="mt-8 p-6 border border-dashed border-gray-300 rounded-lg bg-white">
        <p className="text-center text-gray-500">
          {/* Product list/grid component will go here */}
          Product list component will be rendered here.
        </p>
      </div>
    </div>
  );
}