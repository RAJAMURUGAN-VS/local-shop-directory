import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Save, Settings } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

export default function OwnerProducts() {
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newRowData, setNewRowData] = useState<any>({});
  const [shopEnabled, setShopEnabled] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
    api.get('/owner/shop').then(shop => setShopEnabled(!!shop.enable_product_table)).catch(console.error);
  }, []);

  const fetchProducts = () => {
    api.get('/owner/products').then(data => {
      setColumns(data.columns || []);
      setRows(data.rows || []);
      if (!data.columns || data.columns.length === 0) {
        setIsConfigMode(true);
      }
    }).catch(console.error);
  };

  const handleSaveColumns = async () => {
    if (columns.length === 0) return alert('Please add at least one column');
    try {
      await api.post('/owner/products/config', { columns });
      setIsConfigMode(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim() || columns.includes(newColumnName.trim())) return;
    setColumns([...columns, newColumnName.trim()]);
    setNewColumnName('');
  };

  const handleRemoveColumn = (colToRemove: string) => {
    setColumns(columns.filter(c => c !== colToRemove));
  };

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/owner/products/rows', { data: newRowData });
      setNewRowData({});
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRow = (id: number) => {
    setRowToDelete(id);
  };

  const confirmDeleteRow = async () => {
    if (!rowToDelete) return;
    try {
      await api.delete(`/owner/products/rows/${rowToDelete}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setRowToDelete(null);
    }
  };

  if (!shopEnabled) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Product Catalog is Disabled</h2>
        <p className="text-gray-500 mb-6">You need to enable the product table in your Shop Profile first.</p>
        <a href="/owner/profile" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
          Go to Profile
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <button
          onClick={() => setIsConfigMode(!isConfigMode)}
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center text-sm bg-indigo-50 px-4 py-2 rounded-lg"
        >
          <Settings className="w-4 h-4 mr-2" /> {isConfigMode ? 'Cancel Config' : 'Configure Columns'}
        </button>
      </div>

      {isConfigMode ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Configure Table Columns</h2>
          <p className="text-sm text-gray-500 mb-6">Define the columns for your product table (e.g., Item Name, Price, Size, Color).</p>
          
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="New Column Name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleAddColumn}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-900 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {columns.map(col => (
              <span key={col} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium flex items-center border border-indigo-100">
                {col}
                <button onClick={() => handleRemoveColumn(col)} className="ml-2 text-indigo-400 hover:text-indigo-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            ))}
            {columns.length === 0 && <span className="text-gray-400 italic text-sm">No columns added yet.</span>}
          </div>

          <button
            onClick={handleSaveColumns}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center"
          >
            <Save className="w-5 h-5 mr-2" /> Save Columns
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Add Row Form */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Add New Item</h3>
            <form onSubmit={handleAddRow} className="flex flex-wrap gap-4 items-end">
              {columns.map(col => (
                <div key={col} className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{col}</label>
                  <input
                    type="text"
                    required
                    value={newRowData[col] || ''}
                    onChange={(e) => setNewRowData({ ...newRowData, [col]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center h-[38px]"
              >
                <Plus className="w-4 h-4 mr-2" /> Add
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                      {col}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 italic">
                      No items in the catalog yet. Add your first item above.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {columns.map(col => (
                        <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[col] || '-'}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={rowToDelete !== null}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={confirmDeleteRow}
        onCancel={() => setRowToDelete(null)}
      />
    </div>
  );
}
