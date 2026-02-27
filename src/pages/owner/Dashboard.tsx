import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Store, Image as ImageIcon, List } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OwnerDashboard() {
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    api.get('/owner/shop').then(setShop).catch(console.error);
  }, []);

  if (!shop) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {shop.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/owner/profile" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:shadow-md transition-all group">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4 group-hover:bg-indigo-100 transition-colors">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Shop Profile</h3>
          <p className="text-sm text-gray-500">Update details, address, and hours</p>
        </Link>

        <Link to="/owner/gallery" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:shadow-md transition-all group">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Manage Gallery</h3>
          <p className="text-sm text-gray-500">Upload photos of your collections</p>
        </Link>

        <Link to="/owner/products" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:shadow-md transition-all group">
          <div className="p-4 bg-green-50 text-green-600 rounded-full mb-4 group-hover:bg-green-100 transition-colors">
            <List className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Product Catalog</h3>
          <p className="text-sm text-gray-500">Manage your price list and items</p>
        </Link>
      </div>
    </div>
  );
}
