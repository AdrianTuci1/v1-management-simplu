import { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts.js';
import { productManager } from '../../business/productManager.js';

const ProductDrawer = ({ isOpen, onClose, product = null }) => {
  const { addProduct, updateProduct, deleteProduct, loading, error } = useProducts();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    reorderLevel: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Inițializează formularul când se deschide drawer-ul
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        category: product.category || '',
        stock: product.stock || '',
        reorderLevel: product.reorderLevel || ''
      });
      setIsEditing(true);
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        stock: '',
        reorderLevel: ''
      });
      setIsEditing(false);
    }
    setValidationErrors({});
  }, [product, isOpen]);

  // Validează formularul
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Numele produsului este obligatoriu';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Numele produsului trebuie să aibă cel puțin 2 caractere';
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = 'Prețul trebuie să fie un număr pozitiv';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Categoria este obligatorie';
    }
    
    if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      errors.stock = 'Stocul trebuie să fie un număr pozitiv sau zero';
    }
    
    if (!formData.reorderLevel || isNaN(formData.reorderLevel) || parseInt(formData.reorderLevel) < 0) {
      errors.reorderLevel = 'Nivelul de reîncărcare trebuie să fie un număr pozitiv sau zero';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gestionează schimbările în formular
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Șterge eroarea de validare pentru câmpul modificat
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Salvează produsul
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditing) {
        await updateProduct(product.id, formData);
      } else {
        await addProduct(formData);
      }
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  // Șterge produsul
  const handleDelete = async () => {
    if (!product || !window.confirm('Ești sigur că vrei să ștergi acest produs?')) {
      return;
    }
    
    try {
      await deleteProduct(product.id);
      onClose();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  // Obține categoriile disponibile
  const categories = productManager.getCategories();

  return (
    <div className="p-6">

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Nume Produs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nume Produs *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Introdu numele produsului"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Preț */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preț (RON) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {validationErrors.price && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.price}</p>
              )}
            </div>

            {/* Categorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categorie *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selectează o categorie</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
              )}
            </div>

            {/* Stoc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stoc *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.stock ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {validationErrors.stock && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.stock}</p>
              )}
            </div>

            {/* Nivel de Reîncărcare */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de Reîncărcare *
              </label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.reorderLevel ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              <p className="text-gray-500 text-sm mt-1">
                Produsul va fi marcat ca "stoc scăzut" când cantitatea ajunge la acest nivel
              </p>
              {validationErrors.reorderLevel && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.reorderLevel}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 btn btn-primary flex items-center justify-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Se salvează...' : 'Salvează'}
            </button>
            
            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="btn btn-danger flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge
              </button>
            )}
          </div>
        </div>
      );
    };

export default ProductDrawer;
