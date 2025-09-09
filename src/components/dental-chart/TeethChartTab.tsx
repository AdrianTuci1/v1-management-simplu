import React, { useState, useEffect, useRef } from "react";
import TeethChart from "./teeth/TeethChart";
import { MouthViewPermanent } from "./teeth/MouthViewPermanent";
import { MouthViewDeciduous } from "./teeth/MouthViewDecidous";
import ToothDrawer from "./teeth/ToothDrawer";
import Accordion from "./teeth/Accordion";
import { Tooth } from "./teeth/Tooth"; // Import the Tooth class
import { ToothCondition } from "./teeth/utils/toothCondition";
import DentalHistoryService from "@/services/dentalHistoryService";


// React Component to display dental chart
// To be implemented

const TeethChartTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [teethConditions, setTeethConditions] = useState<
    Record<number, keyof typeof ToothCondition>
  >({});
  const [toothHistory, setToothHistory] = useState<
    Record<number, { description: string }[]>
  >({});
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [showCharts, setShowCharts] = useState<boolean>(false);

  const dentalHistoryService = new DentalHistoryService();

  // Track initial state for change detection
  const initialTeethConditions = useRef<Record<number, keyof typeof ToothCondition>>({});
  const initialToothHistory = useRef<Record<number, { description: string }[]>>({});

  // Check if there are unsaved changes
  const hasChanges = () => {
    return (
      JSON.stringify(teethConditions) !== JSON.stringify(initialTeethConditions.current) ||
      JSON.stringify(toothHistory) !== JSON.stringify(initialToothHistory.current)
    );
  };

  const handleSaveChanges = async () => {
    if (!hasChanges()) {
      return;
    }

    try {
      const teethUpdates = Object.keys(teethConditions).map((toothNumber) => ({
        toothNumber: String(toothNumber),
        condition: teethConditions[Number(toothNumber)],
        history: toothHistory[Number(toothNumber)] || [],
      }));

      if (teethUpdates.length === 0) return;

      const updatedTeeth = await dentalHistoryService.bulkPatchDentalHistory(
        patientId,
        teethUpdates
      );
      console.log("Updated Teeth:", updatedTeeth);

      // Update initial state to match saved data
      initialTeethConditions.current = { ...teethConditions };
      initialToothHistory.current = { ...toothHistory };
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  // Fetch data from the service and initialize state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dentalHistoryService.getDentalHistory(patientId);
        const conditions: Record<number, keyof typeof ToothCondition> = {};
        const history: Record<number, { description: string }[]> = {};

        data.forEach((tooth: any) => {
          conditions[tooth.toothNumber] = tooth.condition;
          history[tooth.toothNumber] = tooth.history || [];
        });

        setTeethConditions(conditions);
        setToothHistory(history);

        // Set initial state references
        initialTeethConditions.current = conditions;
        initialToothHistory.current = history;
      } catch (error) {
        console.error("Failed to fetch dental history:", error);
      }
    };

    fetchData();
  }, [patientId]);

  // Save changes when the component unmounts
  useEffect(() => {
    return () => {
      handleSaveChanges();
    };
  }, [teethConditions, toothHistory]);

  const createTeeth = (startISO: number, endISO: number): Record<number, Tooth> => {
    const teeth: Record<number, Tooth> = {};
    for (let ISO = startISO; ISO <= endISO; ISO++) {
      const tooth = new Tooth(patientId).fromISO(ISO);
      if (tooth.Name) {
        const condition = teethConditions[ISO] || "sound";
        tooth.setCondition(condition);
        teeth[ISO] = tooth;
      }
    }
    return teeth;
  };

  const permanentTeeth = createTeeth(11, 48); // Permanent teeth (ISO 11-48)
  const deciduousTeeth = createTeeth(51, 85); // Deciduous teeth (ISO 51-85)

  const handleSelectTooth = (ISO: number) => {
    const selected = permanentTeeth[ISO] || deciduousTeeth[ISO] || null;
    setSelectedTooth(selected);
  };

  const handleCloseDrawer = () => {
    setSelectedTooth(null);
  };

  return (
    <div className="p-1">
      <div className="mb-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showCharts}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowCharts(e.target.checked)}
            className="h-4 w-4"
          />
          {showCharts ? "Teeth Charts" : "Mouth View"}
        </label>
      </div>

      {showCharts ? (
        <>
          <Accordion title="Permanent Teeth Chart">
            <TeethChart
              teethType="permanent"
              onSelectTooth={handleSelectTooth}
              teethConditions={teethConditions}
            />
          </Accordion>
          <Accordion title="Deciduous Teeth Chart">
            <TeethChart
              teethType="deciduous"
              onSelectTooth={handleSelectTooth}
              teethConditions={teethConditions}
            />
          </Accordion>
        </>
      ) : (
        <>
          <Accordion title="Permanent Teeth Mouth View">
            <MouthViewPermanent teeth={permanentTeeth} onClick={handleSelectTooth} />
          </Accordion>
          <Accordion title="Deciduous Teeth Mouth View">
            <MouthViewDeciduous teeth={deciduousTeeth} onClick={handleSelectTooth} />
          </Accordion>
        </>
      )}

      <ToothDrawer
        selectedTooth={selectedTooth}
        onClose={handleCloseDrawer}
        teethConditions={teethConditions}
        setTeethConditions={setTeethConditions}
        toothHistory={toothHistory}
        setToothHistory={setToothHistory}
      />
    </div>
  );
};

export default TeethChartTab;