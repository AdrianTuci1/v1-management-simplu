import { useState } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle,
  Edit,
  TrendingUp,
  TrendingDown,
  Loader2,
  RotateCw,
  Filter
} from 'lucide-react'

import { useProducts } from '../../hooks/useProducts.js'
import { productManager } from '../../business/productManager.js'
import { useDrawer } from '../../contexts/DrawerContext'

const BusinessInventory = () => {
  const { openDrawer } = useDrawer();
  const { 
    products, 
    loading, 
    error, 
    stats,
    searchProducts, 
    loadProducts,
    loadProductsByCategory,
    loadLowStockProducts,
    exportProducts 
  } = useProducts()

  // Debug logging pentru a vedea când se schimbă produsele
  console.log('BusinessInventory render - products count:', products.length, 'products:', products)
  
  // Debug logging pentru a vedea când se schimbă loading și error
  console.log('BusinessInventory render - loading:', loading, 'error:', error)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // Sortare cu prioritizare pentru optimistic updates și filtrare pentru produsele în ștergere
  const sortedProducts = (() => {
    // Filtrează produsele în ștergere din afișare
    const filteredProducts = products.filter(p => !p._isDeleting)
    const baseSorted = productManager.sortProducts(filteredProducts, sortBy, sortOrder)
    return [...baseSorted].sort((a, b) => {
      const aOpt = !!a._isOptimistic
      const bOpt = !!b._isOptimistic
      
      // Prioritizează optimistic updates
      if (aOpt && !bOpt) return -1
      if (!aOpt && bOpt) return 1
      
      return 0
    })
  })()

  // Gestionează căutarea
  const handleSearch = async (e) => {
    const term = e.target.value
    setSearchTerm(term)
    await searchProducts(term)
  }

  // Gestionează filtrarea după categorie
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category)
    if (category) {
      loadProductsByCategory(category)
    } else {
      loadProducts()
    }
  }

  // Gestionează filtrarea după stoc scăzut
  const handleLowStockFilter = () => {
    setShowLowStock(!showLowStock)
    if (!showLowStock) {
      loadLowStockProducts()
    } else {
      loadProducts()
    }
  }

  // Gestionează sortarea
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }


  // Obține categoriile disponibile
  const categories = productManager.getCategories()

  // Obține eticheta pentru status
  const getStatusLabel = (product) => {
    if (product.stock === 0) return 'Fără stoc'
    if (product.isLowStock) return 'Stoc scăzut'
    return 'În stoc'
  }

  // Obține clasa pentru status
  const getStatusClass = (product) => {
    if (product.stock === 0) return 'bg-red-100 text-red-800'
    if (product.isLowStock) return 'bg-orange-100 text-orange-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-3">
        {/* Chip cu titlul */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
          <span className="font-semibold text-sm">Inventar</span>
        </div>

        {/* Separator subtil */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Bara de căutare */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Caută produse..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full h-9 rounded-full border border-gray-200 bg-white px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtru categorie */}
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded-full border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Toate</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Buton stoc scăzut */}
        <button
          onClick={handleLowStockFilter}
          className={`h-9 w-9 rounded-full flex items-center justify-center shadow-sm transition-all ${
            showLowStock 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
          title="Stoc scăzut"
        >
          <AlertTriangle className="h-4 w-4" />
        </button>

        {/* Buton adăugare produs */}
        <button 
          onClick={() => openDrawer({ type: 'product' })} 
          className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all"
          title="Produs nou"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Statistici */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Produse</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valoare Totală</p>
                  <p className="text-2xl font-bold">{stats.totalValue?.toFixed(2) || '0.00'} RON</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stoc Scăzut</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fără Stoc</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Lista Produse */}
      <div className="card">
        
        <div className="card-content">
          {loading && sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Se încarcă produsele...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există produse</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory || showLowStock
                  ? 'Nu s-au găsit produse cu criteriile specificate.'
                  : 'Aici vei putea gestiona stocul și produsele.'
                }
              </p>
              {!searchTerm && !selectedCategory && !showLowStock && (
                <button 
                  onClick={() => openDrawer({ type: 'product' })}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă primul produs
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Nume Produs
                        {sortBy === 'name' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('category')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Categorie
                        {sortBy === 'category' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('price')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Preț (RON)
                        {sortBy === 'price' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('stock')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Stoc
                        {sortBy === 'stock' && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Nivel Reîncărcare</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => (
                    <tr 
                      key={product.resourceId || product.id} 
                      className={`border-b hover:bg-muted/50 cursor-pointer ${
                        product._isDeleting ? 'opacity-50' : ''
                      }`}
                      onClick={() => openDrawer({ type: 'product', data: product })}
                    >
                      <td className="p-3">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <span className={product._isDeleting ? 'line-through opacity-50' : ''}>
                              {product.name || 'Nume indisponibil'}
                            </span>
                            {product._isOptimistic && !product._isDeleting && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                                <RotateCw className="h-3 w-3 animate-spin" />
                                În curs
                              </span>
                            )}
                            {product._isDeleting && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                Ștergere...
                              </span>
                            )}
                          </div>
                          {product.resourceId && !product._tempId && (
                            <div className="text-sm text-muted-foreground">
                              ID: {product.resourceId}
                            </div>
                          )}
                          {product._tempId && (
                            <div className="text-sm text-muted-foreground">
                              ID temporar: {product._tempId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {product.category || 'Fără categorie'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{product.price || '0.00'} RON</span>
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${
                          product.stock === 0 ? 'text-red-600' : 
                          product.isLowStock ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">{product.reorderLevel || 0}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(product)}`}>
                          {getStatusLabel(product)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BusinessInventory
