import { 
  Save,
  Loader2,
  Trash2,
  Clock,
  Stethoscope
} from 'lucide-react'
import { useState } from 'react'
import { useTreatments } from '../../hooks/useTreatments.js'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'

const TreatmentDrawer = ({ onClose, isNewTreatment = false, treatmentData = null }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Hook pentru gestionarea tratamentelor
  const { addTreatment, updateTreatment, deleteTreatment } = useTreatments()
  
  const [formData, setFormData] = useState(() => {
    if (treatmentData) {
      return {
        treatmentType: treatmentData.treatmentType || '',
        category: treatmentData.category || '',
        duration: treatmentData.duration?.toString() || '',
        price: treatmentData.price?.toString() || '',
        description: treatmentData.description || ''
      }
    }
    return {
      treatmentType: '',
      category: '',
      duration: '',
      price: '',
      description: ''
    }
  })

  // Categorii predefinite pentru tratamente stomatologice
  const categories = [
    'Consultații',
    'Igienă orală',
    'Tratamente conservatoare',
    'Chirurgie orală',
    'Imagini diagnostice',
    'Endodonție',
    'Protezare',
    'Implantologie',
    'Estetică',
    'Ortodonție'
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedTreatmentData = {
        ...formData,
        duration: parseInt(formData.duration) || 0,
        price: parseFloat(formData.price) || 0
      }
      
      if (isNewTreatment) {
        await addTreatment(updatedTreatmentData)
      } else {
        // Păstrăm ID-ul original din treatmentData prop
        const treatmentId = treatmentData?.id || treatmentData?.resourceId
        await updateTreatment(treatmentId, updatedTreatmentData)
      }
      
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error saving treatment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!treatmentData?.id) return
    
    if (!confirm('Sigur doriți să ștergeți acest tratament?')) return
    
    setLoading(true)
    setError(null)
    
    try {
      await deleteTreatment(treatmentData.id)
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting treatment:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader
        title="Tratament"
        subtitle={isNewTreatment ? 'Tratament nou' : 'Editează tratamentul'}
        onClose={onClose}
      />
      
      <DrawerContent>
        <div className="space-y-4">
          {/* Treatment Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nume tratament</label>
            <div className="flex gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground mt-3" />
              <input
                type="text"
                value={formData.treatmentType}
                onChange={(e) => handleInputChange('treatmentType', e.target.value)}
                placeholder="Ex: Consultație stomatologică"
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categorie</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Selectează categoria</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Durata (minute)</label>
            <div className="flex gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-3" />
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="30"
                min="1"
                max="480"
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preț (RON)</label>
            <div className="relative">
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                RON
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descriere</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Introduceți o descriere detaliată a tratamentului..."
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </DrawerContent>
      
      <DrawerFooter>
        <div className="flex gap-2">
          {!isNewTreatment && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="btn btn-destructive"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Șterge
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Anulează
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNewTreatment ? 'Creează tratamentul' : 'Salvează modificările'}
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default TreatmentDrawer
