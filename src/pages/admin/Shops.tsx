import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Store } from 'lucide-react';

export default function AdminShops() {
  const [shops, setShops] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newShop, setNewShop] = useState({ name: '', category: '', area_id: '' });
  const [newUser, setNewUser] = useState({ email: '', password: '' });

  useEffect(() => {
    fetchShops();
    api.get('/admin/areas').then(setAreas).catch(console.error);
  }, []);

  useEffect(() => {
    if (newShop.area_id) {
      api.get(`/areas/${newShop.area_id}/categories`).then(setCategories).catch(console.error);
    } else {
      setCategories([]);
    }
  }, [newShop.area_id]);

  const fetchShops = () => {
    api.get('/admin/shops').then(setShops).catch(console.error);
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const shopRes = await api.post('/admin/shops', newShop);
      await api.post('/admin/users', {
        email: newUser.email,
        password: newUser.password,
        role: 'shop_owner',
        shop_id: shopRes.id
      });
      setIsModalOpen(false);
      setNewShop({ name: '', category: '', area_id: '' });
      setNewUser({ email: '', password: '' });
      fetchShops();
    } catch (err) {
      console.error(err);
      alert('Failed to create shop or user');
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/shops/${id}`, { status: newStatus });
      fetchShops();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Shops</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Shop
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <tr key={shop.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                    <Store className="w-4 h-4 mr-2 text-gray-400" />
                    {shop.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.area_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleStatus(shop.id, shop.status)}
                      className={`${shop.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {shop.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Shop</h2>
            <form onSubmit={handleAddShop} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input required type="text" value={newShop.name} onChange={e => setNewShop({...newShop, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <select required value={newShop.area_id} onChange={e => setNewShop({...newShop, area_id: e.target.value, category: ''})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Select Area</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select required value={newShop.category} onChange={e => setNewShop({...newShop, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" disabled={!newShop.area_id}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {!newShop.area_id && <p className="text-xs text-gray-500 mt-1">Please select an area first to view categories.</p>}
              </div>
              <hr className="my-4" />
              <h3 className="text-sm font-bold text-gray-900">Owner Credentials</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Password</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">Create Shop</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
