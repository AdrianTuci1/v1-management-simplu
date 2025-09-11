import React, { useEffect, useMemo, useState } from "react";
import DentalHistoryService from "@/services/dentalHistoryService";
import { Drawer, DrawerHeader, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import TreatmentCombobox from "@/components/combobox/TreatmentCombobox.jsx";
import { GripVertical, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type PlanItem = {
  id: string;
  toothNumber: number | null;
  title: string;
  durationMinutes: number | null;
  price: number | null;
  notes: string;
  isNew?: boolean;
  treatmentId?: string | null;
  isFromChart?: boolean; // Pentru a distinge tratamentele din chart de cele adăugate manual
};

interface DentalPlanDrawerProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

const newItem = (defaults: Partial<PlanItem> = {}): PlanItem => ({
  id: `${Date.now()}-${Math.random()}`,
  toothNumber: null,
  title: "",
  durationMinutes: null,
  price: null,
  notes: "",
  isNew: true,
  treatmentId: null,
  isFromChart: false,
  ...defaults,
});

// Sortable Item Component
const SortableItem: React.FC<{
  item: PlanItem;
  index: number;
  onRemove: (id: string) => void;
}> = ({ item, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        item.isFromChart 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Drag handle */}
      <div 
        className="flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Order number */}
      <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
        {index + 1}
      </div>

      {/* Treatment info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">
            Dinte {item.toothNumber}
          </span>
          <span className="text-sm text-gray-700 truncate">
            {item.title}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
          {item.durationMinutes && (
            <span>{item.durationMinutes} min</span>
          )}
          {item.price && (
            <span>{item.price} RON</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <button
          type="button"
          className={`p-1 ${
            item.isFromChart 
              ? 'text-orange-400 hover:text-red-600' 
              : 'text-gray-400 hover:text-red-600'
          }`}
          onClick={() => {
            console.log("Delete button clicked for item:", item.id, "isFromChart:", item.isFromChart);
            onRemove(item.id);
          }}
          title={item.isFromChart ? "Șterge din chart (va fi șters permanent)" : "Șterge tratament"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const DentalPlanDrawer: React.FC<DentalPlanDrawerProps> = ({ patientId, isOpen, onClose }) => {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTreatment, setNewTreatment] = useState<Partial<PlanItem>>({});

  const service = useMemo(() => new DentalHistoryService(), []);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !patientId) return;
      console.log("Loading dental history for patient:", patientId);
      setIsLoading(true);
      setError("");
      try {
        const dentalHistory = await service.getDentalHistory(patientId);
        console.log("Loaded dental history:", dentalHistory);
        const planItems: PlanItem[] = [];
        
        // Adaugă tratamentele din chart (cu dinte specificat)
        dentalHistory.forEach((tooth: any) => {
          // Verifică atât treatments cât și history pentru compatibilitate
          const treatments = tooth.treatments || (tooth as any).history || [];
          if (Array.isArray(treatments) && treatments.length > 0) {
            treatments.forEach((treatment: any) => {
              planItems.push({
                id: `${tooth.toothNumber}-${treatment.id || Math.random()}`,
                toothNumber: tooth.toothNumber,
                title: treatment.name || treatment.description || "Tratament",
                durationMinutes: treatment.duration || null,
                price: null,
                notes: "",
                isNew: false,
                treatmentId: treatment.id,
                isFromChart: true,
              });
            });
          }
        });

        // Adaugă tratamentele generale (dinte 0) cu numere de la 100 în sus
        const generalTooth = dentalHistory.find((tooth: any) => tooth.toothNumber === 0);
        if (generalTooth) {
          const generalTreatments = generalTooth.treatments || [];
          if (Array.isArray(generalTreatments) && generalTreatments.length > 0) {
            generalTreatments.forEach((treatment: any, index: number) => {
              planItems.push({
                id: `general-${treatment.id || Math.random()}`,
                toothNumber: 100 + index, // Numere de la 100 în sus pentru tratamente generale
                title: treatment.name || treatment.description || "Tratament general",
                durationMinutes: treatment.duration || null,
                price: null,
                notes: "",
                isNew: false,
                treatmentId: treatment.id,
                isFromChart: true,
              });
            });
          }
        }
        
        // Adaugă tratamentele generale (fără dinte specificat) - acestea vor fi stocate separat
        // Pentru moment, le vom adăuga ca tratamente noi
        console.log("Final plan items:", planItems);
        setItems(planItems);
      } catch (e) {
        setError("Nu am putut încărca tratamentele.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isOpen, patientId]);

  const handleAddExtra = () => {
    // Găsește următorul număr disponibil de la 100 în sus
    const maxGeneralNumber = Math.max(
      100,
      ...items
        .filter(item => item.toothNumber && item.toothNumber >= 100)
        .map(item => item.toothNumber || 100)
    );
    
    setNewTreatment(newItem({ 
      toothNumber: maxGeneralNumber + 1, 
      isNew: true 
    }));
    setShowAddModal(true);
  };

  const handleAddTreatment = () => {
    console.log("handleAddTreatment called with:", newTreatment);
    
    if (newTreatment.title) {
      const newItem = { 
        ...newTreatment, 
        isNew: false, 
        isFromChart: false 
      } as PlanItem;
      
      console.log("Adding new item:", newItem);
      
      setItems((prev) => {
        const updatedItems = [...prev, newItem];
        console.log("Updated items:", updatedItems);
        return updatedItems;
      });
      
      setShowAddModal(false);
      setNewTreatment({});
    }
  };


  const removeItem = async (id: string) => {
    console.log("removeItem called with id:", id);
    console.log("Current items:", items);
    
    const item = items.find((it) => it.id === id);
    console.log("Found item:", item);
    
    if (!item) {
      console.log("Item not found!");
      return;
    }

    console.log("Removing item:", item, "isFromChart:", item.isFromChart);

    console.log("Deleting treatment:", item.title);

    // Ștergem tratamentul din dental history
    console.log("Deleting treatment from dental history...");
    try {
      if (item.toothNumber && item.toothNumber < 100) {
        // Tratament pe dinte specificat - ștergem tratamentul specific
        console.log("Deleting treatment from tooth:", item.toothNumber, "treatmentId:", item.treatmentId);
        if (item.treatmentId) {
          await service.deleteToothHistory(patientId, item.toothNumber, item.treatmentId);
        } else {
          // Fallback: șterge toate tratamentele de pe dinte
          await service.deleteToothHistory(patientId, item.toothNumber);
        }
      } else if (item.toothNumber && item.toothNumber >= 100) {
        // Tratament general - ștergem din dinte 0
        console.log("Deleting treatment from general tooth (0), treatmentId:", item.treatmentId);
        if (item.treatmentId) {
          await service.deleteToothHistory(patientId, 0, item.treatmentId);
        } else {
          // Fallback: șterge toate tratamentele generale
          await service.deleteToothHistory(patientId, 0);
        }
      }
      console.log("Successfully deleted treatment from dental history");
    } catch (error) {
      console.error("Failed to delete treatment:", error);
      setError("Nu am putut șterge tratamentul.");
      return;
    }

    // Ștergem din lista locală (pentru toate tratamentele)
    console.log("Removing from local list...");
    setItems((prev) => {
      const newItems = prev.filter((it) => it.id !== id);
      console.log("New items after removal:", newItems);
      return newItems;
    });
    console.log("Item removed successfully");
  };

  const savePlan = async () => {
    if (!patientId) return;
    setIsSaving(true);
    setError("");
    try {
      console.log("Saving plan with items:", items);
      
      // Obține toate dinții existenți pentru a șterge tratamentele care nu mai sunt în plan
      const dentalHistory = await service.getDentalHistory(patientId);
      const existingToothNumbers = new Set(dentalHistory.map((tooth: any) => tooth.toothNumber));
      
      // Grupează tratamentele pe dinți
      const treatmentsByTooth: Record<number, any[]> = {};
      const generalTreatments: any[] = [];
      const usedToothNumbers = new Set<number>();
      
      items.forEach((item, index) => {
        console.log(`Processing item ${index + 1}:`, item);
        
        // Salvăm toate tratamentele, inclusiv cele din chart
        if (item.toothNumber && item.toothNumber < 100) {
          // Tratamente cu dinte specificat (1-99)
          if (!treatmentsByTooth[item.toothNumber]) {
            treatmentsByTooth[item.toothNumber] = [];
          }
          treatmentsByTooth[item.toothNumber].push({
            id: item.treatmentId || item.id,
            name: item.title,
            duration: item.durationMinutes,
            order: index, // Păstrăm ordinea
          });
          usedToothNumbers.add(item.toothNumber);
        } else if (item.toothNumber && item.toothNumber >= 100) {
          // Tratamente generale (100+) - le salvăm ca dinte 0
          generalTreatments.push({
            id: item.treatmentId || item.id,
            name: item.title,
            duration: item.durationMinutes,
            order: index, // Păstrăm ordinea
          });
          usedToothNumbers.add(0); // Marchează că avem tratamente generale
        } else {
          // Tratamente fără dinte specificat - le salvăm ca dinte 0
          generalTreatments.push({
            id: item.treatmentId || item.id,
            name: item.title,
            duration: item.durationMinutes,
            order: index, // Păstrăm ordinea
          });
          usedToothNumbers.add(0); // Marchează că avem tratamente generale
        }
      });
      
      console.log("Treatments by tooth:", treatmentsByTooth);
      console.log("General treatments:", generalTreatments);
      console.log("Used tooth numbers:", Array.from(usedToothNumbers));
      
      // Pregătește lista de actualizări pentru toate dinții
      const allUpdates: any[] = [];
      
      // Adaugă tratamentele pentru dinții cu tratamente
      for (const [toothNumber, treatments] of Object.entries(treatmentsByTooth)) {
        if (treatments.length > 0) {
          console.log(`Adding treatments for tooth ${toothNumber}:`, treatments);
          allUpdates.push({
            toothNumber: Number(toothNumber),
            condition: "sound",
            treatments: treatments,
          });
        }
      }
      
      // Adaugă tratamentele generale
      if (generalTreatments.length > 0) {
        console.log("Adding general treatments:", generalTreatments);
        allUpdates.push({
          toothNumber: 0, // 0 = tratamente generale
          condition: "general",
          treatments: generalTreatments,
        });
      }
      
      // Șterge tratamentele pentru dinții care nu mai sunt în plan
      for (const toothNumber of existingToothNumbers) {
        if (!usedToothNumbers.has(toothNumber)) {
          console.log(`Clearing treatments for tooth ${toothNumber} (no longer in plan)`);
          allUpdates.push({
            toothNumber: toothNumber,
            condition: "sound",
            treatments: [], // Listă goală = șterge tratamentele
          });
        }
      }
      
      // Salvează toate actualizările într-o singură operație
      if (allUpdates.length > 0) {
        console.log("Saving all updates:", allUpdates);
        await service.bulkPatchDentalHistory(patientId, allUpdates);
      }
      
      console.log("Plan saved successfully");
    } catch (e) {
      console.error("Error saving plan:", e);
      setError("Eroare la salvarea tratamentelor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async () => {
    console.log("Closing drawer, saving changes...");
    try {
      await savePlan();
      console.log("Changes saved successfully");
      onClose();
    } catch (error) {
      console.error("Failed to save changes on close:", error);
      setError("Nu am putut salva modificările la închidere.");
      // Don't close the drawer if save failed
    }
  };

  const handlePreviewPdf = async () => {
    try {
      const { default: jsPDF } = (await import("jspdf")) as any;
      await import("jspdf-autotable");
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Plan de tratament", 14, 18);
      
      const rows = items.map((it, idx) => [
        String(idx + 1),
        it.toothNumber ? `Dinte ${it.toothNumber}` : "General",
        it.title || "",
        it.durationMinutes ? `${it.durationMinutes} min` : "",
        it.price ? `${it.price} RON` : "",
        it.notes || "",
        it.isFromChart ? "Din chart" : "Manual",
      ]);
      
      (doc as any).autoTable({
        head: [["#", "Dintele", "Tratament", "Durata", "Preț", "Note", "Sursa"]],
        body: rows,
        startY: 24,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 163, 74] },
      });
      
      doc.save("plan-tratament.pdf");
    } catch (e) {
      setError("Nu s-a putut genera PDF-ul.");
    }
  };

  const handleSendToPatient = async () => {
    try {
      await savePlan();
      // Pentru moment, doar salvăm - în viitor putem adăuga funcționalitatea de trimitere
      alert("Planul a fost salvat și va fi atașat la pacient.");
    } catch (e) {
      setError("Salvarea planului a eșuat.");
    }
  };

  if (!isOpen) return null;

  return (
    <Drawer size="xl" onClose={handleClose}>
      <DrawerHeader title="Plan de tratament" onClose={handleClose} />
      <DrawerContent padding="spacious">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500">Se încarcă...</div>
        ) : (
          <div className="space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Ordinea tratamentelor</h3>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button
                      className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-white text-sm hover:bg-red-700"
                      onClick={() => {
                        if (window.confirm(`Ești sigur că vrei să ștergi toate tratamentele (${items.length})?`)) {
                          setItems([]);
                        }
                      }}
                    >
                      Șterge toate
                    </button>
                  )}
                  <button
                    className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-white text-sm hover:bg-emerald-700"
                    onClick={handleAddExtra}
                  >
                    + Adaugă tratament
                  </button>
                </div>
              </div>

              {items.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500">
                  Nu există tratamente în plan. Adaugă tratamente din chart sau manual.
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        index={index}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}
      </DrawerContent>
      <DrawerFooter>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
            onClick={handlePreviewPdf}
          >Previzualizează PDF</button>
          <button
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white text-sm hover:bg-blue-700"
            onClick={handleSendToPatient}
          >Trimite pacientului</button>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-gray-500">Se salvează...</span>}
          <button
            className="inline-flex items-center rounded-md bg-white border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={handleClose}
            disabled={isSaving}
          >Închide</button>
        </div>
      </DrawerFooter>

      {/* Add Treatment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adaugă tratament nou</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tratament
                </label>
                <TreatmentCombobox
                  value={newTreatment.treatmentId ? { id: newTreatment.treatmentId, name: newTreatment.title || "" } : newTreatment.title || ""}
                  onValueChange={(val: any) => {
                    setNewTreatment(prev => ({
                      ...prev,
                      treatmentId: val?.id,
                      title: val?.name || "",
                      durationMinutes: val?.duration || null,
                    }));
                  }}
                  placeholder="Selectează tratament..."
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durata (min)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full h-9 rounded-md border px-2 text-sm"
                    value={newTreatment.durationMinutes || ""}
                    onChange={(e) => setNewTreatment(prev => ({
                      ...prev,
                      durationMinutes: e.target.value ? Number(e.target.value) : null
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preț (RON)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full h-9 rounded-md border px-2 text-sm"
                    value={newTreatment.price || ""}
                    onChange={(e) => setNewTreatment(prev => ({
                      ...prev,
                      price: e.target.value ? Number(e.target.value) : null
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <input
                  className="w-full h-9 rounded-md border px-2 text-sm"
                  value={newTreatment.notes || ""}
                  onChange={(e) => setNewTreatment(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Detalii..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700"
                onClick={handleAddTreatment}
                disabled={!newTreatment.title}
              >
                Adaugă
              </button>
              <button
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200"
                onClick={() => {
                  setShowAddModal(false);
                  setNewTreatment({});
                }}
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default DentalPlanDrawer;
