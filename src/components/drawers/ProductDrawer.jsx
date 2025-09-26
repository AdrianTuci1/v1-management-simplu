import { useState, useEffect } from 'react';
import { Save, Trash2, AlertTriangle } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts.js';
import { productManager } from '../../business/productManager.js';
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer';

const ProductDrawer = ({ isOpen, onClose, product = null, position = "side" }) => {
  const { addProduct, updateProduct, deleteProduct, loading, error } = useProducts();
  
  // Debug logging pentru a vedea când se schimbă starea
  console.log('ProductDrawer render - loading:', loading, 'error:', error)
  
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
      // Închide drawer-ul după operație reușită
      // Optimistic update-ul va fi vizibil imediat în view
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      // Nu închide drawer-ul în caz de eroare pentru a permite utilizatorului să corecteze
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
    <Drawer onClose={onClose} size="default" position={position}>
      <DrawerHeader
        title={isEditing ? 'Editează Produs' : 'Produs Nou'}
        subtitle={isEditing ? 'Modifică detaliile produsului' : 'Adaugă un produs nou în inventar'}
        onClose={onClose}
        variant="default"
      />

      <DrawerContent padding="spacious">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Nume Produs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
      </DrawerContent>

      <DrawerFooter variant="default">
        <div className="flex items-center justify-between w-full">
          <div>
            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Șterge</span>
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Anulează
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Se salvează...' : 'Salvează'}</span>
            </button>
          </div>
        </div>
      </DrawerFooter>
    </Drawer>
  );
};

export default ProductDrawer;
