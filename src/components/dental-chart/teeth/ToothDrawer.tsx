import React, { useState } from "react";
import { ToothCondition } from "./utils/toothCondition";
import { X } from "lucide-react";
import TreatmentCombobox from "@/components/combobox/TreatmentCombobox.jsx";

interface ToothTreatment {
  id: string;
  name: string;
  duration?: number;
  price?: string | number;
}

interface ToothDrawerProps {
  selectedTooth: {
    ISO: number;
    Name: string;
  } | null;
  onClose: () => void;
  teethConditions: Record<number, keyof typeof ToothCondition>;
  setTeethConditions: React.Dispatch<
    React.SetStateAction<Record<number, keyof typeof ToothCondition>>
  >;
  toothTreatments: Record<number, ToothTreatment[]>;
  setToothTreatments: React.Dispatch<
    React.SetStateAction<Record<number, ToothTreatment[]>>
  >;
}

const ToothDrawer: React.FC<ToothDrawerProps> = ({
  selectedTooth,
  onClose,
  teethConditions,
  setTeethConditions,
  toothTreatments,
  setToothTreatments,
}) => {
  const [selectedTreatment, setSelectedTreatment] = useState<ToothTreatment | null>(null);

  if (!selectedTooth) return null;

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const condition = e.target.value as keyof typeof ToothCondition;
    setTeethConditions((prev) => ({
      ...prev,
      [selectedTooth.ISO]: condition,
    }));
  };

  const handleAddTreatment = (treatment: any) => {
    if (treatment && treatment.id && treatment.name) {
      const newTreatment: ToothTreatment = {
        id: treatment.id,
        name: treatment.name,
        duration: treatment.duration,
        price: treatment.price
      };
      
      console.log(`🦷 === ADDING TREATMENT ===`);
      console.log(`🦷 Tooth ISO: ${selectedTooth.ISO}`);
      console.log(`🦷 Treatment data:`, newTreatment);
      console.log(`🦷 Current treatments for tooth ${selectedTooth.ISO}:`, toothTreatments[selectedTooth.ISO] || []);
      
      setToothTreatments((prev) => {
        console.log(`🦷 Previous treatments state:`, prev);
        console.log(`🦷 Previous treatments for tooth ${selectedTooth.ISO}:`, prev[selectedTooth.ISO]);
        
        const updatedTreatments = {
          ...prev,
          [selectedTooth.ISO]: [
            ...(prev[selectedTooth.ISO] || []),
            newTreatment,
          ],
        };
        
        console.log(`🦷 Updated tooth treatments state:`, updatedTreatments);
        console.log(`🦷 Updated treatments for tooth ${selectedTooth.ISO}:`, updatedTreatments[selectedTooth.ISO]);
        console.log(`🦷 Number of treatments now: ${updatedTreatments[selectedTooth.ISO].length}`);
        
        return updatedTreatments;
      });
      setSelectedTreatment(null);
    } else {
      console.log(`⚠️ Invalid treatment data:`, treatment);
    }
  };

  const handleRemoveTreatment = (treatmentIndex: number) => {
    setToothTreatments((prev) => ({
      ...prev,
      [selectedTooth.ISO]: prev[selectedTooth.ISO]?.filter(
        (_, index) => index !== treatmentIndex
      ),
    }));
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="z-[50]"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-full h-full bg-white shadow-xl z-[51] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-2 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Dinte {selectedTooth.ISO}</h2>
            <p className="text-sm text-gray-500">{selectedTooth.Name}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Tooth Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Selectează condiția
                </label>
                <select
                  id="condition"
                  onChange={handleConditionChange}
                  defaultValue={teethConditions[selectedTooth.ISO] || ""}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selectează...</option>
                  {Object.keys(ToothCondition).map((key) => (
                    <option key={key} value={key}>
                      {ToothCondition[key as keyof typeof ToothCondition]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Treatments Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Tratamente pentru dinte</h4>
              
              {toothTreatments[selectedTooth.ISO] && toothTreatments[selectedTooth.ISO].length > 0 ? (
                <div className="space-y-3">
                  {toothTreatments[selectedTooth.ISO].map((treatment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{treatment.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          {treatment.duration && (
                            <span>{treatment.duration} min</span>
                          )}
                          {treatment.price && (
                            <span>{treatment.price} RON</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        onClick={() => handleRemoveTreatment(index)}
                        title="Șterge tratament"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  Nu există tratamente pentru acest dinte
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adaugă tratament nou
                </label>
                <TreatmentCombobox
                  value={selectedTreatment?.name || ""}
                  onValueChange={handleAddTreatment}
                  placeholder="Selectează tratament..."
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Închide
          </button>
        </div>
      </div>
    </>
  );
};

export default ToothDrawer;
