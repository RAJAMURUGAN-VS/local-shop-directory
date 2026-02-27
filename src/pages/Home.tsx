import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MapPin } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function Home() {
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/areas').then(setAreas).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedArea) {
      api.get(`/areas/${selectedArea}/categories`).then(setCategories).catch(console.error);
    } else {
      setCategories([]);
    }
  }, [selectedArea]);

  const handleCategoryClick = (category: string) => {
    if (!selectedArea) {
      alert('Please select an area first');
      return;
    }
    navigate(`/shops?area_id=${selectedArea}&category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 px-4 sm:px-6 lg:px-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Discover Local Shops
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Find the best local stores, explore their collections, and plan your physical visit. No online ordering, just pure discovery.
        </p>

        <div className="max-w-md mx-auto relative">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
            <div className="pl-4 pr-2 py-3 bg-gray-50 border-r border-gray-200">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full py-3 px-4 bg-white text-gray-900 focus:outline-none appearance-none"
            >
              <option value="" disabled>Select an Area</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2">Browse Categories</h2>
        {selectedArea ? (
          categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const IconComponent = (Icons as any)[cat.icon] || Icons.Store;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.name)}
                    className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-500 hover:shadow-md transition-all group"
                  >
                    <IconComponent className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 mb-3 transition-colors" />
                    <span className="text-sm font-medium text-gray-900 text-center">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">No categories available for this area.</p>
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">Please select an area to view categories.</p>
          </div>
        )}
      </section>
    </div>
  );
}
