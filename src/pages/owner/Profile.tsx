import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Save, Plus, Trash2 } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function OwnerProfile() {
  const [shop, setShop] = useState<any>(null);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<Record<string, {start: string, end: string}[]>>({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/owner/shop').then(data => {
      setShop(data);
      if (data.schedule) {
        setSchedule({
          monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
          ...data.schedule
        });
      }
      if (data.area_id) {
        api.get(`/areas/${data.area_id}/categories`).then(cats => {
          const myCat = cats.find((c: any) => c.name === data.category);
          if (myCat && myCat.filters) {
            setCategoryFilters(myCat.filters);
          }
        }).catch(console.error);
      }
    }).catch(console.error);
  }, []);

  const handleFilterToggle = (filter: string) => {
    const current = shop.active_filters || [];
    if (current.includes(filter)) {
      setShop({ ...shop, active_filters: current.filter((f: string) => f !== filter) });
    } else {
      setShop({ ...shop, active_filters: [...current, filter] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/owner/shop', { ...shop, schedule });
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!shop) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Shop Profile</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
            <input
              type="text"
              required
              value={shop.name || ''}
              onChange={(e) => setShop({ ...shop, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <input
              type="text"
              value={shop.contact_number || ''}
              onChange={(e) => setShop({ ...shop, contact_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
          <textarea
            rows={3}
            value={shop.description || ''}
            onChange={(e) => setShop({ ...shop, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            rows={2}
            value={shop.address || ''}
            onChange={(e) => setShop({ ...shop, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps Embed Code (iframe)</label>
          <textarea
            rows={4}
            value={shop.google_map_link || ''}
            onChange={(e) => setShop({ ...shop, google_map_link: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            placeholder='<iframe src="https://www.google.com/maps/embed?..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
          />
          <p className="text-xs text-gray-500 mt-1">Paste the full iframe HTML code from Google Maps "Embed a map" option.</p>
        </div>

        <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
          <input
            type="checkbox"
            id="enable_product_table"
            checked={!!shop.enable_product_table}
            onChange={(e) => setShop({ ...shop, enable_product_table: e.target.checked })}
            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="enable_product_table" className="text-sm font-medium text-gray-700">
            Enable Product Catalog / Price Table
          </label>
        </div>

        {categoryFilters.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">Shop Features & Filters</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryFilters.map(filter => (
                <label key={filter} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={(shop.active_filters || []).includes(filter)}
                    onChange={() => handleFilterToggle(filter)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{filter}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Operating Hours</h3>
          
          <div className="flex items-center space-x-3 mb-6">
            <input
              type="checkbox"
              id="auto_availability"
              checked={!!shop.auto_availability}
              onChange={(e) => setShop({ ...shop, auto_availability: e.target.checked })}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="auto_availability" className="text-sm font-medium text-gray-700">
              Enable Auto Availability (Automatically open/close based on schedule)
            </label>
          </div>

          {!shop.auto_availability ? (
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="is_open"
                checked={!!shop.is_open}
                onChange={(e) => setShop({ ...shop, is_open: e.target.checked })}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_open" className="text-sm font-medium text-gray-700">
                Shop is currently Open (Manual Override)
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS.map(day => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-32 font-medium text-gray-700 capitalize pt-2">
                    {day}
                  </div>
                  <div className="flex-1 space-y-3">
                    {schedule[day]?.map((interval, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="time"
                          value={interval.start}
                          onChange={(e) => {
                            const newSchedule = { ...schedule };
                            newSchedule[day][index].start = e.target.value;
                            setSchedule(newSchedule);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={interval.end}
                          onChange={(e) => {
                            const newSchedule = { ...schedule };
                            newSchedule[day][index].end = e.target.value;
                            setSchedule(newSchedule);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSchedule = { ...schedule };
                            newSchedule[day].splice(index, 1);
                            setSchedule(newSchedule);
                          }}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newSchedule = { ...schedule };
                        if (!newSchedule[day]) newSchedule[day] = [];
                        newSchedule[day].push({ start: '09:00', end: '17:00' });
                        setSchedule(newSchedule);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Time Interval
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
