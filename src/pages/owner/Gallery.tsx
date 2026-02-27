import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { FolderPlus, ImagePlus, Trash2 } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

export default function OwnerGallery() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newImageBase64, setNewImageBase64] = useState('');
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'folder' | 'image'; id: number | null }>({ isOpen: false, type: 'folder', id: null });

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = () => {
    api.get('/owner/galleries').then(setGalleries).catch(console.error);
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.post('/owner/galleries', { folder_name: newFolderName });
      setNewFolderName('');
      fetchGalleries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageBase64 || !activeGalleryId) return;
    setIsUploading(true);
    try {
      await api.post(`/owner/galleries/${activeGalleryId}/images`, { image_url: newImageBase64 });
      setNewImageBase64('');
      setActiveGalleryId(null);
      fetchGalleries();
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. It might be too large.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = (id: number) => {
    setConfirmModal({ isOpen: true, type: 'image', id });
  };

  const handleDeleteFolder = (id: number) => {
    setConfirmModal({ isOpen: true, type: 'folder', id });
  };

  const confirmDelete = async () => {
    const { type, id } = confirmModal;
    if (!id) return;
    
    try {
      if (type === 'folder') {
        await api.delete(`/owner/galleries/${id}`);
      } else {
        await api.delete(`/owner/galleries/images/${id}`);
      }
      fetchGalleries();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmModal({ isOpen: false, type: 'folder', id: null });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Manage Gallery</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Folder</h2>
        <form onSubmit={handleAddFolder} className="flex gap-4">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="e.g., Summer Collection, Menu, Store Interior"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center"
          >
            <FolderPlus className="w-5 h-5 mr-2" /> Add Folder
          </button>
        </form>
      </div>

      <div className="space-y-8">
        {galleries.map((gallery) => (
          <div key={gallery.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-gray-900">{gallery.folder_name}</h3>
                <button
                  onClick={() => handleDeleteFolder(gallery.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete Folder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setActiveGalleryId(gallery.id)}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center text-sm"
              >
                <ImagePlus className="w-4 h-4 mr-1" /> Add Image
              </button>
            </div>

            {activeGalleryId === gallery.id && (
              <form onSubmit={handleAddImage} className="flex flex-col sm:flex-row gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={!newImageBase64 || isUploading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Save'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setActiveGalleryId(null);
                      setNewImageBase64('');
                    }} 
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {gallery.images.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No images in this folder yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {gallery.images.map((img: any) => (
                  <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={img.image_url} alt="Gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'folder' ? 'Delete Folder' : 'Delete Image'}
        message={confirmModal.type === 'folder' 
          ? 'Are you sure you want to delete this folder and all its images? This action cannot be undone.'
          : 'Are you sure you want to delete this image? This action cannot be undone.'}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'folder', id: null })}
      />
    </div>
  );
}
