// Utility pentru gestionarea culorilor categoriilor
const STORAGE_KEY = 'treatment_category_colors'

// Culori default pentru categorii noi
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
]

let colorIndex = 0

// Încarcă toate culorile categoriilor din localStorage
export const loadCategoryColors = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error loading category colors:', error)
    return {}
  }
}

// Salvează toate culorile categoriilor în localStorage
export const saveCategoryColors = (colors) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch (error) {
    console.error('Error saving category colors:', error)
  }
}

// Obține culoarea unei categorii
export const getCategoryColor = (category) => {
  if (!category) return DEFAULT_COLORS[0]
  
  const colors = loadCategoryColors()
  
  // Dacă categoria are deja o culoare, o returnează
  if (colors[category]) {
    return colors[category]
  }
  
  // Altfel, atribuie o culoare default
  const newColor = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length]
  colorIndex++
  
  // Salvează noua culoare
  colors[category] = newColor
  saveCategoryColors(colors)
  
  return newColor
}

// Setează culoarea unei categorii
export const setCategoryColor = (category, color) => {
  if (!category) return
  
  const colors = loadCategoryColors()
  colors[category] = color
  saveCategoryColors(colors)
}

// Șterge culoarea unei categorii
export const deleteCategoryColor = (category) => {
  const colors = loadCategoryColors()
  delete colors[category]
  saveCategoryColors(colors)
}

// Obține toate culorile categoriilor
export const getAllCategoryColors = () => {
  return loadCategoryColors()
}

