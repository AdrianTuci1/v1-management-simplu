import React, { useEffect, useMemo, useState } from "react";
import PlanService from "@/services/planService";
import DentalHistoryService from "@/services/dentalHistoryService";
import TreatmentCombobox from "@/components/combobox/TreatmentCombobox.jsx";
import { GripVertical, Trash2, Save, Download, Send } from "lucide-react";
import { DrawerHeader, DrawerFooter, DrawerContent } from "@/components/ui/drawer";
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
import TeethChartTab from "./TeethChartTab";

type PlanItem = {
  id: string;
  toothNumber?: number | null;
  title: string;
  durationMinutes?: number | null;
  price?: number | null;
  notes?: string;
  isNew?: boolean;
  treatmentId?: string | null;
  isFromChart?: boolean;
};

interface FullscreenTreatmentPlanProps {
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
      className={`flex items-center gap-3 p-4 rounded-lg border ${
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
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Order number */}
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
        {index + 1}
      </div>

      {/* Treatment info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-gray-900">
            Dinte {item.toothNumber}
          </span>
          <span className="text-base text-gray-700 truncate">
            {item.title}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
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
          className={`p-2 rounded-md ${
            item.isFromChart 
              ? 'text-orange-400 hover:text-red-600 hover:bg-orange-50' 
              : 'text-gray-400 hover:text-red-600 hover:bg-gray-50'
          }`}
          onClick={() => onRemove(item.id)}
          title={item.isFromChart ? "Șterge din plan (nu afectează chart-ul)" : "Șterge tratament din plan"}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const FullscreenTreatmentPlan: React.FC<FullscreenTreatmentPlanProps> = ({ patientId, isOpen, onClose }) => {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [chartItems, setChartItems] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTreatment, setNewTreatment] = useState<Partial<PlanItem>>({});
  const [hasExistingPlan, setHasExistingPlan] = useState<boolean>(false);

  const planService = useMemo(() => new PlanService(), []);
  const dentalHistoryService = useMemo(() => new DentalHistoryService(), []);

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
      setIsLoading(true);
      setError("");
      try {
        // Load existing plan items
        const planItems = await planService.getPlan(patientId);
        setHasExistingPlan(planItems.length > 0);
        
        // Always load chart treatments for potential import
        const dentalHistory = await dentalHistoryService.getDentalHistory(patientId);
        const chartItems: PlanItem[] = [];
        
        // Add treatments from chart (with specific tooth)
        dentalHistory.forEach((tooth: any) => {
          const treatments = tooth.treatments || (tooth as any).history || [];
          if (Array.isArray(treatments) && treatments.length > 0) {
            treatments.forEach((treatment: any) => {
              chartItems.push({
                id: `chart-${tooth.toothNumber}-${treatment.id || Math.random()}`,
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

        // Add general treatments (tooth 0) with numbers from 100 up
        const generalTooth = dentalHistory.find((tooth: any) => tooth.toothNumber === 0);
        if (generalTooth) {
          const generalTreatments = generalTooth.treatments || [];
          if (Array.isArray(generalTreatments) && generalTreatments.length > 0) {
            generalTreatments.forEach((treatment: any, index: number) => {
              chartItems.push({
                id: `chart-general-${treatment.id || Math.random()}`,
                toothNumber: 100 + index, // Numbers from 100 up for general treatments
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
        
        setChartItems(chartItems);
        
        // If no plan exists, start with empty plan
        if (planItems.length === 0) {
          setItems([]);
        } else {
          // Use existing plan items
          setItems(planItems);
        }
      } catch (e) {
        console.error("Error loading plan:", e);
        setError("Nu am putut încărca planul de tratament.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isOpen, patientId, planService, dentalHistoryService]);

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
    if (newTreatment.title) {
      const newItem = { 
        ...newTreatment, 
        isNew: false, 
        isFromChart: false 
      } as PlanItem;
      
      setItems((prev) => [...prev, newItem]);
      setShowAddModal(false);
      setNewTreatment({});
    }
  };

  const handleImportFromChart = () => {
    // Import all chart treatments into the plan
    const chartTreatmentsToImport = chartItems.filter(chartItem => 
      !items.some(planItem => planItem.treatmentId === chartItem.treatmentId)
    );
    
    setItems(prev => [...prev, ...chartTreatmentsToImport]);
  };

  const handleRemoveFromChart = () => {
    // Remove all chart treatments from the plan
    setItems(prev => prev.filter(item => !item.isFromChart));
  };

  const handleCreateNewPlan = () => {
    // Clear current plan and start fresh
    if (window.confirm("Ești sigur că vrei să creezi un plan nou? Planul actual va fi șters.")) {
      setItems([]);
      setHasExistingPlan(false);
    }
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const savePlan = async () => {
    if (!patientId) return;
    setIsSaving(true);
    setError("");
    try {
      await planService.upsertPlan(patientId, items);
      setHasExistingPlan(true);
    } catch (e) {
      console.error("Error saving plan:", e);
      setError("Eroare la salvarea planului de tratament.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async () => {
    try {
      await savePlan();
      onClose();
    } catch (error) {
      console.error("Failed to save changes on close:", error);
      setError("Nu am putut salva modificările la închidere.");
    }
  };

  const handlePreviewPdf = async () => {
    try {
      // Try to use server-side PDF generation first
      try {
        const result = await planService.generatePdf(patientId, items);
        if (result.pdfUrl) {
          window.open(result.pdfUrl, '_blank');
          return;
        } else if (result.dataUrl) {
          const link = document.createElement('a');
          link.href = result.dataUrl;
          link.download = 'plan-tratament.pdf';
          link.click();
          return;
        }
      } catch (serverError) {
        console.log("Server PDF generation failed, falling back to client-side:", serverError);
      }
      
      // Fallback to client-side PDF generation
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
      console.error("Error generating PDF:", e);
      setError("Nu s-a putut genera PDF-ul.");
    }
  };

  const handleSendToPatient = async () => {
    try {
      await savePlan();
      const result = await planService.sendToPatient(patientId, items);
      if (result.success) {
        alert("Planul a fost salvat și trimis pacientului.");
      } else {
        alert("Planul a fost salvat, dar trimiterea a eșuat.");
      }
    } catch (e) {
      console.error("Error sending plan to patient:", e);
      setError("Trimiterea planului a eșuat.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 bottom-0 z-[9997] p-2 pt-0 pr-16 w-[calc(100vw-25rem)]">
      <div className="bg-white w-full h-full rounded-lg border border-gray-200 shadow-xl flex flex-col">
      {/* Header */}
      <DrawerHeader
        title="Plan de tratament"
        subtitle="Gestionează planul de tratament pentru pacient"
        onClose={handleClose}
      />

      {/* Content */}
      <DrawerContent padding="spacious">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Se încarcă...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left Column - Treatment Plan */}
            <div className="space-y-6 overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

              {/* Plan Management Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-gray-900">
                    {hasExistingPlan ? "Plan de tratament existent" : "Plan nou"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasExistingPlan && (
                      <button
                        className="inline-flex items-center rounded-md bg-orange-600 px-3 py-1.5 text-white text-sm hover:bg-orange-700"
                        onClick={handleCreateNewPlan}
                      >
                        Plan nou
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Chart Import/Export Controls */}
                {chartItems.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700"
                      onClick={handleImportFromChart}
                    >
                      Importă din chart ({chartItems.length})
                    </button>
                    {items.some(item => item.isFromChart) && (
                      <button
                        className="inline-flex items-center rounded-md bg-gray-600 px-3 py-1.5 text-white text-sm hover:bg-gray-700"
                        onClick={handleRemoveFromChart}
                      >
                        Elimină din chart
                      </button>
                    )}
                  </div>
                )}
                
                {/* Plan Actions */}
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
                    + Adaugă tratament manual
                  </button>
                </div>
              </div>

              {/* Treatment List Section */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Ordinea tratamentelor</h3>

                {items.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">
                      {chartItems.length > 0 
                        ? `Nu există tratamente în plan. Adaugă tratamente manual sau importă din chart (${chartItems.length} disponibile).`
                        : "Nu există tratamente în plan. Adaugă tratamente manual."
                      }
                    </p>
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
              
              {/* Available Chart Treatments Section */}
              {chartItems.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-700 mb-3">
                    Tratamente disponibile din chart ({chartItems.filter(chartItem => 
                      !items.some(planItem => planItem.treatmentId === chartItem.treatmentId)
                    ).length} neimportate)
                  </h4>
                  <div className="space-y-2">
                    {chartItems
                      .filter(chartItem => 
                        !items.some(planItem => planItem.treatmentId === chartItem.treatmentId)
                      )
                      .map((chartItem, index) => (
                        <div 
                          key={chartItem.id}
                          className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 border-blue-200"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                Dinte {chartItem.toothNumber}
                              </span>
                              <span className="text-sm text-gray-700 truncate">
                                {chartItem.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              {chartItem.durationMinutes && (
                                <span>{chartItem.durationMinutes} min</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              type="button"
                              className="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-white text-xs hover:bg-blue-700"
                              onClick={() => {
                                setItems(prev => [...prev, chartItem]);
                              }}
                            >
                              Importă
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Dental Chart */}
            <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto">
              <h3 className="text-base font-medium text-gray-900 mb-3">Chart dentar</h3>
              <TeethChartTab patientId={String(patientId)} />
            </div>
          </div>
        )}
      </DrawerContent>

      {/* Footer */}
      <DrawerFooter>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
              onClick={handlePreviewPdf}
            >
              <Download className="h-4 w-4" />
              Previzualizează PDF
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
              onClick={handleSendToPatient}
            >
              <Send className="h-4 w-4" />
              Trimite pacientului
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && <span className="text-sm text-gray-500">Se salvează...</span>}
            <button
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white text-sm hover:bg-emerald-700"
              onClick={handleClose}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              Salvează și închide
            </button>
          </div>
        </div>
      </DrawerFooter>

      {/* Add Treatment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
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
                      price: val?.price ? parseFloat(val.price) : null,
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
                    className="w-full h-10 rounded-md border px-3 text-sm"
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
                    className="w-full h-10 rounded-md border px-3 text-sm"
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
                  className="w-full h-10 rounded-md border px-3 text-sm"
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
    </div>
    </div>
  );
};

export default FullscreenTreatmentPlan;
