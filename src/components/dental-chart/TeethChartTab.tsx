import React, { useState, useEffect, useRef } from "react";
import TeethChart from "./teeth/TeethChart";
import { MouthViewPermanent } from "./teeth/MouthViewPermanent";
import { MouthViewDeciduous } from "./teeth/MouthViewDecidous";
import ToothDrawer from "./teeth/ToothDrawer";
import Accordion from "./teeth/Accordion";
import { Tooth } from "./teeth/Tooth"; // Import the Tooth class
import { ToothCondition } from "./teeth/utils/toothCondition";
import DentalHistoryService from "@/services/dentalHistoryService";
import FullscreenTreatmentPlan from "./FullscreenTreatmentPlan";
// import { useDrawer } from "@/contexts/DrawerContext";


// React Component to display dental chart
// To be implemented

const TeethChartTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [teethConditions, setTeethConditions] = useState<
    Record<number, keyof typeof ToothCondition>
  >({});
  const [toothTreatments, setToothTreatments] = useState<
    Record<number, { id: string; name: string; duration?: number }[]>
  >({});
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [showCharts, setShowCharts] = useState<boolean>(false);
  const [isPlanOpen, setIsPlanOpen] = useState<boolean>(false);

  const dentalHistoryService = new DentalHistoryService();
  // const { openDrawer } = useDrawer();

  // Track initial state for change detection
  const initialTeethConditions = useRef<Record<number, keyof typeof ToothCondition>>({});
  const initialToothTreatments = useRef<Record<number, { id: string; name: string; duration?: number }[]>>({});

  // Check if there are unsaved changes
  const hasChanges = () => {
    return (
      JSON.stringify(teethConditions) !== JSON.stringify(initialTeethConditions.current) ||
      JSON.stringify(toothTreatments) !== JSON.stringify(initialToothTreatments.current)
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
        treatments: toothTreatments[Number(toothNumber)] || [],
      }));

      if (teethUpdates.length === 0) {
        return;
      }

      console.log("Saving teeth updates:", teethUpdates);
      const updatedTeeth = await dentalHistoryService.bulkPatchDentalHistory(
        patientId,
        teethUpdates
      );
      console.log("Updated Teeth:", updatedTeeth);

      // Update initial state to match saved data
      initialTeethConditions.current = { ...teethConditions };
      initialToothTreatments.current = { ...toothTreatments };
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
        const treatments: Record<number, { id: string; name: string; duration?: number }[]> = {};

        data.forEach((tooth: any) => {
          conditions[tooth.toothNumber] = tooth.condition;
          treatments[tooth.toothNumber] = tooth.treatments || [];
        });

        setTeethConditions(conditions);
        setToothTreatments(treatments);

        // Set initial state references
        initialTeethConditions.current = conditions;
        initialToothTreatments.current = treatments;
      } catch (error) {
        console.error("Failed to fetch dental history:", error);
      }
    };

    fetchData();
  }, [patientId]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges()) return;

    const timeoutId = setTimeout(() => {
      handleSaveChanges();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [teethConditions, toothTreatments]);

  // Save changes when the component unmounts
  useEffect(() => {
    return () => {
      handleSaveChanges();
    };
  }, []); // Empty dependency array to only run on unmount

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
    <div className="space-y-4">
      {/* Buttons moved outside the main container */}
      <div className="flex items-center justify-between">
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

      {/* Main content container */}
      <div className="bg-white">
        {showCharts ? (
          <div className="space-y-4">
            <div className="border rounded-lg p-3">
              <Accordion title="Permanent Teeth Chart">
                <div className="overflow-x-auto">
                  <TeethChart
                    teethType="permanent"
                    onSelectTooth={handleSelectTooth}
                    teethConditions={teethConditions}
                  />
                </div>
              </Accordion>
            </div>
            <div className="border rounded-lg p-3">
              <Accordion title="Deciduous Teeth Chart">
                <div className="overflow-x-auto">
                  <TeethChart
                    teethType="deciduous"
                    onSelectTooth={handleSelectTooth}
                    teethConditions={teethConditions}
                  />
                </div>
              </Accordion>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-3">
              <Accordion title="Permanent Teeth Mouth View">
                <MouthViewPermanent teeth={permanentTeeth} onClick={handleSelectTooth} />
              </Accordion>
            </div>
            <div className="border rounded-lg p-3">
              <Accordion title="Deciduous Teeth Mouth View">
                <MouthViewDeciduous teeth={deciduousTeeth} onClick={handleSelectTooth} />
              </Accordion>
            </div>
          </div>
        )}
      </div>

      <ToothDrawer
        selectedTooth={selectedTooth}
        onClose={handleCloseDrawer}
        teethConditions={teethConditions}
        setTeethConditions={setTeethConditions}
        toothTreatments={toothTreatments}
        setToothTreatments={setToothTreatments}
        position="side"
      />

      <FullscreenTreatmentPlan
        patientId={patientId}
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
      />
    </div>
  );
};

export default TeethChartTab;