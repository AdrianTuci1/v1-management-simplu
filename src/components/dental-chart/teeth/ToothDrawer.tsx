import React, { useState } from "react";
import { ToothCondition } from "./utils/toothCondition";
import styles from "./ToothDrawer.module.css";
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
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={styles.drawer}>
        <h4 className={styles.title}>Tooth Details</h4>
        <p>
          <strong>ISO:</strong> {selectedTooth.ISO}
        </p>
        <p>
          <strong>Name:</strong> {selectedTooth.Name}
        </p>

        <label htmlFor="condition" className={styles.label}>Select Condition:</label>
        <select
          id="condition"
          onChange={handleConditionChange}
          defaultValue={teethConditions[selectedTooth.ISO] || ""}
          className={styles.select}
        >
          <option value="">Select</option>
          {Object.keys(ToothCondition).map((key) => (
            <option key={key} value={key}>
              {ToothCondition[key as keyof typeof ToothCondition]}
            </option>
          ))}
        </select>

        <div className={styles.historySection}>
          <h4 className={styles.subtitle}>Tooth Treatments</h4>
          <ul className={styles.historyList}>
            {(toothTreatments[selectedTooth.ISO] || []).map((treatment, index) => (
              <li key={index} className={styles.historyItem}>
                <div className={styles.treatmentInfo}>
                  <p className={styles.historyText}>{treatment.name}</p>
                  {treatment.duration && (
                    <p className={styles.treatmentDuration}>{treatment.duration} min</p>
                  )}
                </div>
                <button
                  className={styles.removeHistory}
                  onClick={() => handleRemoveTreatment(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.historyInput}>
            <TreatmentCombobox
              value={selectedTreatment}
              onValueChange={handleAddTreatment}
              placeholder="Selectează tratament..."
              className="w-full"
            />
          </div>
        </div>

        <button className={styles.closeButton} onClick={onClose}>Close</button>
      </div>
    </>
  );
};

export default ToothDrawer;
