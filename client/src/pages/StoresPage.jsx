import React from 'react';

const STORES = [
  { id: 1, name: 'قريباً', city: '' },
];

const StoresPage = () => {
  return (
    <div className="offers-page catalog-page container-custom px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">المتاجر</h2>
      <ul className="space-y-3">
        {STORES.map(s => (
          <li key={s.id} className="p-4 border rounded bg-white flex items-center gap-3">
            <img src={"/vite.svg"} alt="store" className="w-12 h-12 object-contain" />
            <div>
              <div className="font-semibold">{s.name}</div>
              {s.city ? <div className="text-xs text-gray-500">{s.city}</div> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StoresPage;
