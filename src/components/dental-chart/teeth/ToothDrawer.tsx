import React, { useState } from "react";
import { ToothCondition } from "./utils/toothCondition";
import styles from "./ToothDrawer.module.css";

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
  toothHistory: Record<number, { description: string }[]>;
  setToothHistory: React.Dispatch<
    React.SetStateAction<Record<number, { description: string }[]>>
  >;
}

const ToothDrawer: React.FC<ToothDrawerProps> = ({
  selectedTooth,
  onClose,
  teethConditions,
  setTeethConditions,
  toothHistory,
  setToothHistory,
}) => {
  const [historyInput, setHistoryInput] = useState<string>("");

  if (!selectedTooth) return null;

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const condition = e.target.value as keyof typeof ToothCondition;
    setTeethConditions((prev) => ({
      ...prev,
      [selectedTooth.ISO]: condition,
    }));
  };

  const handleAddHistory = () => {
    if (historyInput.trim()) {
      setToothHistory((prev) => ({
        ...prev,
        [selectedTooth.ISO]: [
          ...(prev[selectedTooth.ISO] || []),
          { description: historyInput },
        ],
      }));
      setHistoryInput("");
    }
  };

  const handleRemoveHistory = (entryIndex: number) => {
    setToothHistory((prev) => ({
      ...prev,
      [selectedTooth.ISO]: prev[selectedTooth.ISO]?.filter(
        (_, index) => index !== entryIndex
      ),
    }));
  };

  return (
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
        <h4 className={styles.subtitle}>Tooth History</h4>
        <ul className={styles.historyList}>
          {(toothHistory[selectedTooth.ISO] || []).map((entry, index) => (
            <li key={index} className={styles.historyItem}>
              <p className={styles.historyText}>{entry.description}</p>
              <button
                className={styles.removeHistory}
                onClick={() => handleRemoveHistory(index)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.historyInput}>
          <input
            type="text"
            value={historyInput}
            onChange={(e) => setHistoryInput(e.target.value)}
            placeholder="Add history entry..."
            className={styles.input}
          />
          <button className={styles.addButton} onClick={handleAddHistory}>Add</button>
        </div>
      </div>

      <button className={styles.closeButton} onClick={onClose}>Close</button>
    </div>
  );
};

export default ToothDrawer;
