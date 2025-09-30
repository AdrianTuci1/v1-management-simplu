# Sistemul de Draft-uri - Implementare Completă

## Prezentare Generală

Sistemul de draft-uri permite utilizatorilor să salveze temporar modificările în drawere, să le revizuiască și să le confirme sau anuleze ulterior. Acest sistem este integrat în facade și oferă o experiență de utilizare îmbunătățită.

## Componente Principale

### 1. DraftAwareDrawer
Wrapper component care adaugă funcționalitatea de draft la orice drawer.

**Caracteristici:**
- Identificator de draft vizibil
- Buton de ștergere draft
- Funcționalitate auto-save
- Indicatori de status draft

**Utilizare:**
```jsx
<DraftAwareDrawer
  drawerType="new-person"
  drawerData={patientData}
  onClose={onClose}
  isNew={true}
  resourceType="patient"
>
  <PatientDrawer {...props} />
</DraftAwareDrawer>
```

### 2. DraftsMenu
Component pentru afișarea și gestionarea draft-urilor în sidebar.

**Caracteristici:**
- Lista tuturor draft-urilor active
- Grupare după tip de resursă
- Acțiuni rapide (vizualizare, ștergere)
- Indicatori de status draft

### 3. useDraftManager Hook
Hook pentru gestionarea draft-urilor în componente.

**Funcționalități:**
- Crearea și actualizarea draft-urilor
- Gestionarea sesiunilor
- Operațiuni batch pe draft-uri
- Integrare cu UI-ul

## Integrare în Drawere Existente

### Pasul 1: Actualizarea MainDrawer
MainDrawer a fost actualizat pentru a detecta automat drawerele noi și a le înfășura cu DraftAwareDrawer.

```jsx
// În MainDrawer.jsx
const isNew = content?.isNew || content?.type?.includes('new-');
const resourceType = getResourceTypeFromDrawerType(content?.type);

if (isNew && resourceType) {
  return (
    <DraftAwareDrawer
      drawerType={content?.type}
      drawerData={content?.data}
      onClose={onClose}
      isNew={isNew}
      resourceType={resourceType}
    >
      <DrawerComponent {...getDrawerProps()} />
    </DraftAwareDrawer>
  );
}
```

### Pasul 2: Actualizarea Drawer-urilor Existente
Pentru a integra complet draft-urile, drawer-urile existente trebuie să accepte props-urile de draft:

```jsx
const PatientDrawer = ({ 
  onClose, 
  isNewPatient = false, 
  patientData = null,
  // Draft-related props
  draftId,
  isDraft,
  onDraftUpdate,
  onDraftCommit,
  onDraftDelete
}) => {
  // Implementare...
};
```

### Pasul 3: Gestionarea Actualizărilor Draft
În drawer-urile existente, adăugați logica pentru actualizarea draft-urilor:

```jsx
// Track changes for draft updates
useEffect(() => {
  if (isDraft && onDraftUpdate) {
    const timeoutId = setTimeout(() => {
      onDraftUpdate(formData);
      setHasChanges(true);
    }, 1000); // Debounce updates

    return () => clearTimeout(timeoutId);
  }
}, [formData, isDraft, onDraftUpdate]);
```

## Integrare în Sidebar

### Adăugarea Meniului Draft-uri
În NewSidebar.jsx, a fost adăugat un meniu pentru draft-uri:

```jsx
{/* Drafts Section */}
{!isCollapsed && (
  <div className="w-full">
    <button
      onClick={() => setShowDrafts(!showDrafts)}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">Draft-uri</span>
      </div>
      <div className={`transform transition-transform ${showDrafts ? 'rotate-180' : ''}`}>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      </div>
    </button>
    
    {showDrafts && (
      <div className="mt-2 border border-gray-200 rounded-lg">
        <DraftsMenu 
          onDraftSelect={(draft) => {
            // Handle draft selection
          }}
          onClose={() => setShowDrafts(false)}
        />
      </div>
    )}
  </div>
)}
```

## Funcționalități Avansate

### 1. Auto-save
Sistemul suportă auto-save pentru draft-uri:
- Actualizare automată la modificări
- Debounce pentru a evita prea multe actualizări
- Indicatori vizuali pentru status

### 2. Gestionarea Sesiunilor
- Draft-urile pot fi grupate în sesiuni
- Sesiunile pot fi salvate și reîncărcate
- Operațiuni batch pe sesiuni

### 3. Statistici Draft
- Numărul total de draft-uri
- Draft-uri după status
- Draft-uri după tip de resursă

## Configurare și Personalizare

### Maparea Tipurilor de Drawer la Resurse
În MainDrawer.jsx, există o funcție pentru maparea tipurilor de drawer la tipuri de resurse:

```jsx
const getResourceTypeFromDrawerType = (drawerType) => {
  const typeMap = {
    'appointment': 'appointment',
    'new-person': 'patient',
    'edit-person': 'patient',
    'product': 'product',
    'medic': 'medic',
    'treatment': 'treatment',
    'role': 'role',
    'new-sale': 'sales',
    'cash-register': 'sales'
  };
  return typeMap[drawerType] || null;
};
```

### Adăugarea de Tipuri Noi
Pentru a adăuga suport pentru tipuri noi de drawer:

1. Adăugați maparea în `getResourceTypeFromDrawerType`
2. Actualizați `DRAWER_REGISTRY` dacă este necesar
3. Implementați logica de draft în drawer-ul respectiv

## Exemple de Utilizare

### Crearea unui Draft Nou
```jsx
const { createDraft } = useDraftManager('patient');

const handleCreateDraft = async (patientData) => {
  try {
    const draft = await createDraft(patientData, 'create');
    console.log('Draft creat:', draft);
  } catch (error) {
    console.error('Eroare la crearea draft-ului:', error);
  }
};
```

### Actualizarea unui Draft
```jsx
const { updateDraft } = useDraftManager('patient');

const handleUpdateDraft = async (draftId, updatedData) => {
  try {
    const updatedDraft = await updateDraft(draftId, updatedData);
    console.log('Draft actualizat:', updatedDraft);
  } catch (error) {
    console.error('Eroare la actualizarea draft-ului:', error);
  }
};
```

### Ștergerea unui Draft
```jsx
const { deleteDraft } = useDraftManager('patient');

const handleDeleteDraft = async (draftId) => {
  try {
    await deleteDraft(draftId);
    console.log('Draft șters');
  } catch (error) {
    console.error('Eroare la ștergerea draft-ului:', error);
  }
};
```

## Beneficii

1. **Experiență Utilizator Îmbunătățită**: Utilizatorii pot salva temporar modificările și să se întoarcă la ele ulterior.

2. **Prevenirea Pierderii Datelor**: Modificările sunt salvate automat, prevenind pierderea datelor.

3. **Gestionare Centralizată**: Toate draft-urile sunt gestionate central prin facade.

4. **Integrare Transparentă**: Sistemul se integrează transparent cu drawerele existente.

5. **Flexibilitate**: Suportă diferite tipuri de resurse și operațiuni.

## Concluzie

Sistemul de draft-uri oferă o soluție completă pentru gestionarea modificărilor temporare în aplicație. Prin integrarea cu facade-ul existent și drawerele, oferă o experiență de utilizare fluidă și intuitivă, permițând utilizatorilor să lucreze cu încredere, știind că modificările lor sunt salvate și pot fi recuperate oricând.
