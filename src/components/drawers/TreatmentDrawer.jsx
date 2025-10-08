import { 
  Save,
  Loader2,
  Trash2,
  Clock,
  Stethoscope,
  Pipette
} from 'lucide-react'
import { useState } from 'react'
import { useTreatments } from '../../hooks/useTreatments.js'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import CategoryCombobox from '../combobox/CategoryCombobox.jsx'
import { ColorInput } from '../ui/color-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'

const TreatmentDrawer = ({ onClose, isNewTreatment = false, treatmentData = null, position = "side" }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Hook pentru gestionarea tratamentelor
  const { addTreatment, updateTreatment, deleteTreatment, treatments } = useTreatments()
  
  const [formData, setFormData] = useState(() => {
    if (treatmentData) {
      return {
        treatmentType: treatmentData.treatmentType || '',
        category: treatmentData.category || '',
        color: treatmentData.color || '#3b82f6',
        duration: treatmentData.duration?.toString() || '',
        price: treatmentData.price?.toString() || '',
        description: treatmentData.description || '',
        isPublic: treatmentData.isPublic || false
      }
    }
    return {
      treatmentType: '',
      category: '',
      color: '#3b82f6',
      duration: '',
      price: '',
      description: '',
      isPublic: false
    }
  })

  // Funcție pentru adăugarea unei categorii noi
  const handleAddNewCategory = (newCategory) => {
    // Pentru moment, doar setăm categoria nouă în formular
    // În viitor, aceasta ar putea fi salvată în backend
    setFormData(prev => ({
      ...prev,
      category: newCategory
    }))
  }

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

  // Extrage categoriile unice din tratamentele existente
  const categories = [...new Set(treatments.map(t => t.category).filter(Boolean))]

  return (
    <Drawer onClose={onClose} size="default" position={position}>
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
            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={formData.treatmentType}
                onChange={(e) => handleInputChange('treatmentType', e.target.value)}
                placeholder="Ex: Consultație stomatologică"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categorie</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <CategoryCombobox
                  value={formData.category}
                  onValueChange={(category) => handleInputChange('category', category)}
                  onAddNewCategory={handleAddNewCategory}
                  categories={categories}
                  placeholder="Selectează sau adaugă o categorie"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-10 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
                    title="Selectează culoare tratament"
                  >
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shadow-sm"
                      style={{ backgroundColor: formData.color }}
                    />
                    <Pipette className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <ColorInput
                    label=""
                    defaultValue={formData.color}
                    onChange={(color) => handleInputChange('color', color)}
                    showOpacity={false}
                    swatches={[
                      "#ef4444", // red
                      "#f97316", // orange
                      "#f59e0b", // amber
                      "#eab308", // yellow
                      "#84cc16", // lime
                      "#22c55e", // green
                      "#10b981", // emerald
                      "#14b8a6", // teal
                      "#06b6d4", // cyan
                      "#3b82f6", // blue
                      "#6366f1", // indigo
                      "#8b5cf6", // violet
                      "#a855f7", // purple
                      "#d946ef", // fuchsia
                      "#ec4899", // pink
                      "#f43f5e", // rose
                      "#64748b", // slate
                      "#78716c", // stone
                    ]}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Durata (minute)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="30"
                min="1"
                max="480"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

          {/* Public Visibility */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
                Tratament public
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Tratamentele publice sunt vizibile pentru toți utilizatorii
            </p>
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
