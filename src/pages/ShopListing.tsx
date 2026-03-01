import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Search, MapPin, Filter, Store } from 'lucide-react';

export default function ShopListing() {
  const [searchParams] = useSearchParams();
  const areaId = searchParams.get('area_id');
  const category = searchParams.get('category');
  
  const [shops, setShops] = useState<any[]>([]);
  const [filteredShops, setFilteredShops] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const [isOpenNowFilter, setIsOpenNowFilter] = useState(false);

  useEffect(() => {
    fetchShops();
    if (areaId) {
      api.get(`/areas/${areaId}/categories`).then(cats => {
        const myCat = cats.find((c: any) => c.name === category);
        if (myCat && myCat.filters) {
          setAvailableFilters(myCat.filters);
        } else {
          setAvailableFilters([]);
        }
      }).catch(console.error);
    }
  }, [areaId, category]);

  useEffect(() => {
    let result = shops;
    if (isOpenNowFilter) {
      result = result.filter(shop => !!shop.is_open);
    }
    if (selectedFilters.length > 0) {
      result = result.filter(shop => {
        const shopFilters = shop.active_filters || [];
        return selectedFilters.every(f => shopFilters.includes(f));
      });
    }
    setFilteredShops(result);
  }, [shops, selectedFilters, isOpenNowFilter]);

  const fetchShops = async (search = '') => {
    try {
      let url = `/shops?area_id=${areaId}&category=${encodeURIComponent(category || '')}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await api.get(url);
      setShops(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFilter = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShops(searchQuery);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Filters */}
      <aside className={`w-full md:w-64 bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" /> Filters
        </h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Status</h4>
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input 
                type="checkbox" 
                checked={isOpenNowFilter}
                onChange={(e) => setIsOpenNowFilter(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
              />
              <span>Open Now</span>
            </label>
          </div>
          
          {availableFilters.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Features</h4>
              <div className="space-y-2">
                {availableFilters.map(filter => (
                  <label key={filter} className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedFilters.includes(filter)}
                      onChange={() => toggleFilter(filter)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span>{filter}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{category}</h2>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" /> {shops[0]?.area_name || 'Selected Area'}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg"
            >
              <Filter className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </form>
          </div>
        </div>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No shops found matching your criteria.
            </div>
          ) : (
            filteredShops.map((shop) => (
              <Link key={shop.id} to={`/shops/${shop.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-48 bg-gray-200 relative">
                  <img 
                    src={`https://picsum.photos/seed/${shop.id}/400/300`} 
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {!!shop.enable_product_table && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                      Catalog Available
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center justify-between">
                    {shop.name}
                    {!!shop.is_open ? (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">OPEN</span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">CLOSED</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{shop.description}</p>
                  
                  {shop.active_filters && shop.active_filters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {shop.active_filters.slice(0, 3).map((f: string) => (
                        <span key={f} className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full font-medium">
                          {f}
                        </span>
                      ))}
                      {shop.active_filters.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full font-medium">
                          +{shop.active_filters.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center text-xs font-medium text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" /> {shop.area_name}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
