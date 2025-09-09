import React from "react";
import { ToothCondition, conditionToColor } from "./utils/toothCondition"; // Import ToothCondition and conditionToColor
import styles from "./TeethChart.module.css";

interface TeethChartProps {
  teethType: "permanent" | "deciduous";
  onSelectTooth: (ISO: number) => void; // Callback to handle tooth selection
  teethConditions: Record<number, keyof typeof ToothCondition>;
}

const TeethChart: React.FC<TeethChartProps> = ({
  teethType,
  onSelectTooth,
  teethConditions,
}) => {
  // Define teeth rows based on props
  const rows =
    teethType === "permanent"
      ? {
          upperRow: [...Array(16)].map((_, i) => 18 - i),
          lowerRow: [...Array(16)].map((_, i) => 48 - i),
        }
      : {
          upperRow: [...Array(10)].map((_, i) => 55 - i),
          lowerRow: [...Array(10)].map((_, i) => 85 - i),
        };

  return (
    <div className={styles.teethChart}>
      {/* Upper Row */}
      <div className={styles.teethRow}>
        {rows.upperRow.map((ISO) => {
          const condition = teethConditions[ISO] || "sound";
          const color = conditionToColor(condition);

          return (
            <button
              key={ISO}
              className={styles.tooth}
              style={{ backgroundColor: color }}
              onClick={() => onSelectTooth(ISO)}
            >
              {ISO}
            </button>
          );
        })}
      </div>

      {/* Vertical Separator */}
      <div className={styles.separator}></div>

      {/* Lower Row */}
      <div className={styles.teethRow}>
        {rows.lowerRow.map((ISO) => {
          const condition = teethConditions[ISO] || "sound";
          const color = conditionToColor(condition);

          return (
            <button
              key={ISO}
              className={styles.tooth}
              style={{ backgroundColor: color }}
              onClick={() => onSelectTooth(ISO)}
            >
              {ISO}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeethChart;
