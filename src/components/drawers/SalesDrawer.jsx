import { useState, useEffect } from 'react'
import { X, Plus, Minus, Trash2, CreditCard, Receipt, Ticket, DollarSign, Check, XCircle } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useSalesDrawerStore } from '../../stores/salesDrawerStore'

const SalesDrawer = () => {
  const { isOpen, closeSalesDrawer } = useSalesDrawerStore()
  const { products, loading } = useProducts()
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [currentAmount, setCurrentAmount] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])

  // Categorii disponibile
  const categories = [
    { id: 'all', name: 'Toate', icon: '📦' },
    { id: 'Medicamente', name: 'Medicamente', icon: '💊' },
    { id: 'Dispozitive Medicale', name: 'Dispozitive', icon: '🩺' },
    { id: 'Produse de Îngrijire', name: 'Îngrijire', icon: '🧴' },
    { id: 'Echipamente', name: 'Echipamente', icon: '🏥' },
    { id: 'Consumabile', name: 'Consumabile', icon: '🩹' },
    { id: 'Altele', name: 'Altele', icon: '📋' }
  ]

  // Filtrează produsele după categorie
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter(product => product.category === selectedCategory))
    }
  }, [selectedCategory, products])

  // Calculează totalul
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Adaugă produs în coș
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  // Actualizează cantitatea
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => prev.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  // Șterge din coș
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  // Funcții pentru numpad
  const handleNumberClick = (number) => {
    setCurrentAmount(prev => prev + number)
  }

  const handleClear = () => {
    setCurrentAmount('')
  }

  const handleDelete = () => {
    setCurrentAmount(prev => prev.slice(0, -1))
  }

  const handleEnter = () => {
    if (currentAmount && parseFloat(currentAmount) > 0) {
      // Aici poți adăuga logica pentru a aplica o reducere sau a procesa plata
      setCurrentAmount('')
    }
  }

  // Procesează plata
  const processPayment = () => {
    if (cart.length === 0) return
    
    // Aici vei adăuga logica pentru procesarea plății
    console.log('Procesare plată:', {
      cart,
      total,
      paymentMethod,
      amount: currentAmount || total
    })
    
    // Reset după plată
    setCart([])
    setCurrentAmount('')
    closeSalesDrawer()
  }

  // Anulează tranzacția
  const cancelTransaction = () => {
    setCart([])
    setCurrentAmount('')
    setPaymentMethod('cash')
  }

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setCart([])
      setCurrentAmount('')
      setPaymentMethod('cash')
      setSelectedCategory('all')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={closeSalesDrawer} />
      
      {/* Full Screen Drawer */}
      <div 
        className="fixed inset-0 z-50 bg-white w-full h-full max-w-none"
        style={{ 
          width: '100vw', 
          height: '100vh',
          maxWidth: 'none',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 h-16">
          <h2 className="text-2xl font-bold">Vânzare nouă</h2>
          <button onClick={closeSalesDrawer} className="p-2 hover:bg-gray-200 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content - 3 Columns */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Coloana 1: Lista produselor (îngustă) */}
          <div className="w-1/4 border-r flex flex-col bg-gray-50">
            {/* Lista produselor */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Coș ({cart.length})</h3>
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Coșul este gol
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.price} RON</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t p-4 bg-white shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-green-600">{total.toFixed(2)} RON</span>
              </div>
            </div>
          </div>

          {/* Coloana 2: Numpad și acțiuni (mijloc) */}
          <div className="w-1/4 border-r p-4 flex flex-col">
            {/* Numpad */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4">Numpad</h3>
              
              {/* Display pentru suma */}
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="text-right text-2xl font-mono">
                  {currentAmount || '0.00'} RON
                </div>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
                  <button
                    key={number}
                    onClick={() => handleNumberClick(number.toString())}
                    className="p-4 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => handleNumberClick('.')}
                  className="p-4 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  .
                </button>
                <button
                  onClick={() => handleNumberClick('0')}
                  className="p-4 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  0
                </button>
                <button
                  onClick={handleEnter}
                  className="p-4 text-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                >
                  ENT
                </button>
              </div>

              {/* Butoane funcții */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <button
                  onClick={handleClear}
                  className="p-3 bg-yellow-500 text-white rounded-lg font-semibold"
                >
                  CLR
                </button>
                <button
                  onClick={handleDelete}
                  className="p-3 bg-red-500 text-white rounded-lg font-semibold"
                >
                  DEL
                </button>
                <button
                  onClick={() => {
                    // Logica pentru anulare produs
                    if (cart.length > 0) {
                      removeFromCart(cart[cart.length - 1].id)
                    }
                  }}
                  className="p-3 bg-orange-500 text-white rounded-lg font-semibold"
                >
                  ANUL
                </button>
              </div>
            </div>

            {/* Acțiuni și metode de plată */}
            <div className="border-t pt-4 mt-4">
              {/* Metode de plată */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    paymentMethod === 'cash' ? 'bg-blue-100 border-blue-500' : 'bg-white'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  Numerar
                </button>
                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    paymentMethod === 'card' ? 'bg-blue-100 border-blue-500' : 'bg-white'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
                <button 
                  onClick={() => setPaymentMethod('tickets')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    paymentMethod === 'tickets' ? 'bg-blue-100 border-blue-500' : 'bg-white'
                  }`}
                >
                  <Ticket className="h-4 w-4" />
                  Tichete
                </button>
                <button 
                  onClick={() => setPaymentMethod('receipt')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    paymentMethod === 'receipt' ? 'bg-blue-100 border-blue-500' : 'bg-white'
                  }`}
                >
                  <Receipt className="h-4 w-4" />
                  Bon
                </button>
              </div>

              {/* Butoane acțiuni */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={processPayment}
                  disabled={cart.length === 0}
                  className="p-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Validare
                </button>
                <button 
                  onClick={cancelTransaction}
                  className="p-3 bg-red-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Anulare
                </button>
              </div>
            </div>
          </div>

          {/* Coloana 3: Categorii și produse (cea mai lată) */}
          <div className="w-5/12 flex flex-col">
            {/* Categorii */}
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold mb-4">Categorii</h3>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                      selectedCategory === category.id 
                        ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Produse din categoria selectată */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-lg font-semibold mb-4">
                Produse {selectedCategory !== 'all' ? `- ${categories.find(c => c.id === selectedCategory)?.name}` : ''}
              </h3>
              
              {loading ? (
                <div className="text-center text-gray-500 py-8">Se încarcă...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Nu există produse în această categorie
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm mb-1">{product.name}</div>
                      <div className="text-lg font-bold text-green-600">{product.price} RON</div>
                      <div className="text-xs text-gray-500">
                        Stoc: {product.stock}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SalesDrawer
