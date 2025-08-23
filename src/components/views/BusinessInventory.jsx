import { useState } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  Download, 
  AlertTriangle,
  Edit,
  TrendingUp,
  TrendingDown
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
    loadProductsByCategory,
    loadLowStockProducts,
    exportProducts 
  } = useProducts()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // Gestionează căutarea
  const handleSearch = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    searchProducts(term)
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

  // Sortează produsele
  const sortedProducts = productManager.sortProducts(products, sortBy, sortOrder)

  // Gestionează exportul
  const handleExport = async (format) => {
    try {
      const data = await exportProducts(format)
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventar_${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting products:', err)
    }
  }

  // Obține categoriile disponibile
  const categories = productManager.getCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventar</h1>
          <p className="text-muted-foreground">Gestionează stocul și produsele</p>
        </div>
        <button 
          onClick={() => openDrawer({ type: 'product' })} 
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Produs nou
        </button>
      </div>

      {/* Statistici */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-content p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Produse</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valoare Totală</p>
                  <p className="text-2xl font-bold">{stats.totalValue.toFixed(2)} RON</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stoc Scăzut</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fără Stoc</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtre și Căutare */}
      <div className="card">
        <div className="card-content p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Căutare */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Caută produse..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filtru Categorie */}
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toate categoriile</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtru Stoc Scăzut */}
            <button
              onClick={handleLowStockFilter}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                showLowStock 
                  ? 'bg-orange-50 border-orange-300 text-orange-700' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Stoc scăzut
            </button>

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Produse */}
      <div className="card">
        <div className="card-content p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Se încarcă produsele...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Eroare la încărcarea produselor: {error}</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există produse</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory || showLowStock 
                  ? 'Nu s-au găsit produse cu criteriile selectate.' 
                  : 'Adaugă primul produs pentru a începe.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      Nume Produs
                      {sortBy === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('category')}
                    >
                      Categorie
                      {sortBy === 'category' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('price')}
                    >
                      Preț (RON)
                      {sortBy === 'price' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('stock')}
                    >
                      Stoc
                      {sortBy === 'stock' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Nivel Reîncărcare
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{product.price} RON</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          product.stock === 0 ? 'text-red-600' : 
                          product.isLowStock ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{product.reorderLevel}</span>
                      </td>
                      <td className="px-4 py-3">
                        {product.stock === 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            Fără stoc
                          </span>
                        ) : product.isLowStock ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            Stoc scăzut
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            În stoc
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDrawer({ type: 'product', data: product })}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Editează"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
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
