import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { MapPin, Phone, Clock, ExternalLink, Image as ImageIcon, List } from 'lucide-react';

export default function ShopDetails() {
  const { id } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/shops/${id}`)
      .then(data => {
        setShop(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!shop) return <div className="text-center py-12 text-red-500">Shop not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-64 bg-gray-200 relative">
          <img 
            src={`https://picsum.photos/seed/${shop.id}/1200/400`} 
            alt={shop.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{shop.name}</h1>
              <p className="text-lg text-indigo-600 font-medium mb-4">{shop.category}</p>
            </div>
            <div className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full">
              Open Now
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-400" />
              {shop.address}, {shop.area_name}
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-2 text-gray-400" />
              {shop.contact_number}
            </div>
            {shop.google_map_link && !shop.google_map_link.includes('<iframe') && (
              <div className="flex items-center col-span-full">
                <ExternalLink className="w-5 h-5 mr-2 text-gray-400" />
                <a href={shop.google_map_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  View on Google Maps
                </a>
              </div>
            )}
          </div>

          {shop.google_map_link && shop.google_map_link.includes('<iframe') && (
            <div className="mt-8 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div 
                className="w-full h-64 sm:h-80 [&>iframe]:w-full [&>iframe]:h-full"
                dangerouslySetInnerHTML={{ __html: shop.google_map_link }} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">About the Shop</h2>
        <p className="text-gray-600 leading-relaxed">{shop.description}</p>
      </div>

      {/* Gallery */}
      {shop.galleries && shop.galleries.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <ImageIcon className="w-6 h-6 mr-2" /> Gallery
          </h2>
          <div className="space-y-8">
            {shop.galleries.map((gallery: any) => (
              <div key={gallery.id}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{gallery.folder_name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {gallery.images.map((img: any) => (
                    <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img 
                        src={img.image_url} 
                        alt="Gallery Image" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Table */}
      {shop.enable_product_table === 1 && shop.product_columns && shop.product_columns.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <List className="w-6 h-6 mr-2" /> Catalog / Price List
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  {shop.product_columns.map((col: string, idx: number) => (
                    <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shop.product_rows?.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {shop.product_columns.map((col: string, idx: number) => (
                      <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row[col] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
