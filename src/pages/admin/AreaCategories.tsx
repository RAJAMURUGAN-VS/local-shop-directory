import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus, Trash2, Edit2, Check, X, ArrowLeft, Store } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

export default function AreaCategories() {
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Store');
  const [newCategoryFilters, setNewCategoryFilters] = useState<string[]>([]);
  const [newFilterInput, setNewFilterInput] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editFilters, setEditFilters] = useState<string[]>([]);
  const [editFilterInput, setEditFilterInput] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, [id]);

  const fetchCategories = () => {
    api.get(`/areas/${id}/categories`).then(setCategories).catch(console.error);
  };

  const fetchShopsForCategory = (categoryId: number) => {
    api.get(`/admin/categories/${categoryId}/shops`).then(data => {
      setShops(data);
      setSelectedCategory(categories.find(c => c.id === categoryId));
    }).catch(console.error);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await api.post(`/admin/areas/${id}/categories`, { 
        name: newCategoryName, 
        icon: newCategoryIcon,
        filters: newCategoryFilters
      });
      setNewCategoryName('');
      setNewCategoryIcon('Store');
      setNewCategoryFilters([]);
      setNewFilterInput('');
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFilter = (e: React.KeyboardEvent<HTMLInputElement>, isEdit: boolean) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isEdit) {
        if (editFilterInput.trim() && !editFilters.includes(editFilterInput.trim())) {
          setEditFilters([...editFilters, editFilterInput.trim()]);
          setEditFilterInput('');
        }
      } else {
        if (newFilterInput.trim() && !newCategoryFilters.includes(newFilterInput.trim())) {
          setNewCategoryFilters([...newCategoryFilters, newFilterInput.trim()]);
          setNewFilterInput('');
        }
      }
    }
  };

  const removeFilter = (filter: string, isEdit: boolean) => {
    if (isEdit) {
      setEditFilters(editFilters.filter(f => f !== filter));
    } else {
      setNewCategoryFilters(newCategoryFilters.filter(f => f !== filter));
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon);
    setEditFilters(category.filters || []);
    setEditFilterInput('');
  };

  const handleUpdate = async (categoryId: number) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/admin/categories/${categoryId}`, { 
        name: editName, 
        icon: editIcon,
        filters: editFilters
      });
      setEditingId(null);
      fetchCategories();
      if (selectedCategory?.id === categoryId) {
        setSelectedCategory({ ...selectedCategory, name: editName, icon: editIcon, filters: editFilters });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await api.delete(`/admin/categories/${deleteModal.id}`);
      if (selectedCategory?.id === deleteModal.id) {
        setSelectedCategory(null);
        setShops([]);
      }
      fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/admin/areas" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Manage Categories for Area</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
          
          <form onSubmit={handleAddCategory} className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                placeholder="Icon Name (e.g. Store)"
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newFilterInput}
                  onChange={(e) => setNewFilterInput(e.target.value)}
                  onKeyDown={(e) => handleAddFilter(e, false)}
                  placeholder="Add filter (press Enter)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center"
                >
                  <Plus className="w-5 h-5" /> Add Category
                </button>
              </div>
              {newCategoryFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newCategoryFilters.map(filter => (
                    <span key={filter} className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {filter}
                      <button type="button" onClick={() => removeFilter(filter, false)} className="ml-2 text-gray-500 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {categories.map(category => (
              <div key={category.id} className="flex flex-col p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                <div className="flex items-center justify-between">
                  {editingId === category.id ? (
                    <div className="flex-1 flex flex-col gap-3 mr-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={editFilterInput}
                          onChange={(e) => setEditFilterInput(e.target.value)}
                          onKeyDown={(e) => handleAddFilter(e, true)}
                          placeholder="Add filter (press Enter)"
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        {editFilters.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editFilters.map(filter => (
                              <span key={filter} className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {filter}
                                <button type="button" onClick={() => removeFilter(filter, true)} className="ml-1 text-gray-500 hover:text-red-500">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex-1 cursor-pointer flex items-center gap-3"
                      onClick={() => fetchShopsForCategory(category.id)}
                    >
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-500">Icon: {category.icon}</p>
                        {category.filters && category.filters.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">Filters: {category.filters.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {editingId === category.id ? (
                      <>
                        <button onClick={() => handleUpdate(category.id)} className="text-green-600 hover:text-green-800 p-1">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 p-1">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(category)} className="text-indigo-600 hover:text-indigo-800 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteModal({ isOpen: true, id: category.id })} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center text-gray-500 py-4">No categories added yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {selectedCategory ? `Shops in ${selectedCategory.name}` : 'Select a category to view shops'}
          </h2>
          
          {selectedCategory && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shops.map(shop => (
                    <tr key={shop.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shop.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {shop.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {shops.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-gray-500 text-sm">
                        No shops found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Category"
        message="Are you sure you want to delete this category? Shops in this category will lose their category assignment."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null })}
      />
    </div>
  );
}
