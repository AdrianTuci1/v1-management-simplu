import React, { useState } from "react";
import { ToothCondition } from "./utils/toothCondition";
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../../ui/drawer';
import TreatmentCombobox from "@/components/combobox/TreatmentCombobox.jsx";

interface ToothTreatment {
  id: string;
  name: string;
  duration?: number;
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
  position?: "side" | "overlay";
}

const ToothDrawer: React.FC<ToothDrawerProps> = ({
  selectedTooth,
  onClose,
  teethConditions,
  setTeethConditions,
  toothTreatments,
  setToothTreatments,
  position = "overlay",
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
        duration: treatment.duration
      };
      
      setToothTreatments((prev) => ({
        ...prev,
        [selectedTooth.ISO]: [
          ...(prev[selectedTooth.ISO] || []),
          newTreatment,
        ],
      }));
      setSelectedTreatment(null);
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
    <Drawer onClose={onClose} position={position} size="md">
      <DrawerHeader
        title={`Dinte ${selectedTooth.ISO}`}
        subtitle={selectedTooth.Name}
        onClose={onClose}
      />
      
      <DrawerContent>
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
                      {treatment.duration && (
                        <p className="text-xs text-gray-500">{treatment.duration} min</p>
                      )}
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
                value={selectedTreatment}
                onValueChange={handleAddTreatment}
                placeholder="Selectează tratament..."
                className="w-full"
              />
            </div>
          </div>
        </div>
      </DrawerContent>
      
      <DrawerFooter>
        <button
          onClick={onClose}
          className="btn btn-outline"
        >
          Închide
        </button>
      </DrawerFooter>
    </Drawer>
  );
};

export default ToothDrawer;
