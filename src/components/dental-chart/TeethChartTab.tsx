import React, { useState, useEffect, useRef } from "react";
import TeethChart from "./teeth/TeethChart";
import { MouthViewPermanent } from "./teeth/MouthViewPermanent";
import { MouthViewDeciduous } from "./teeth/MouthViewDecidous";
import ToothDrawer from "./teeth/ToothDrawer";
import Accordion from "./teeth/Accordion";
import { Tooth } from "./teeth/Tooth"; // Import the Tooth class
import { ToothCondition } from "./teeth/utils/toothCondition";
import DentalHistoryService from "@/services/dentalHistoryService";
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
      console.log("ℹ️ No changes detected, skipping save");
      return;
    }

    try {
      console.log("🦷 === START SAVE PROCESS ===");
      console.log("🦷 Current tooth conditions:", teethConditions);
      console.log("🦷 Current tooth treatments:", toothTreatments);
      
      // Combine all teeth that have either conditions OR treatments
      const conditionKeys = Object.keys(teethConditions);
      const treatmentKeys = Object.keys(toothTreatments);
      
      console.log("🦷 Condition keys:", conditionKeys);
      console.log("🦷 Treatment keys:", treatmentKeys);
      
      const allTeethNumbers = new Set([
        ...conditionKeys,
        ...treatmentKeys
      ]);
      
      console.log("🦷 Combined teeth numbers (Set):", Array.from(allTeethNumbers));

      const teethUpdates = Array.from(allTeethNumbers).map((toothNumber) => {
        const toothNum = Number(toothNumber);
        const condition = teethConditions[toothNum] || "sound";
        const treatments = toothTreatments[toothNum] || [];
        
        console.log(`🦷 Building update for tooth ${toothNumber}:`);
        console.log(`   - toothNumber key in treatments: ${toothNum}`);
        console.log(`   - condition: ${condition}`);
        console.log(`   - treatments from state: ${JSON.stringify(treatments)}`);
        console.log(`   - treatments length: ${treatments.length}`);
        
        const update = {
          toothNumber: String(toothNumber),
          condition: condition,
          treatments: treatments,
        };
        console.log(`   - final update object:`, update);
        return update;
      });

      if (teethUpdates.length === 0) {
        console.log("⚠️ No teeth updates to save");
        return;
      }

      console.log("🦷 Final teeth updates array:", teethUpdates);
      
      const updatedTeeth = await dentalHistoryService.bulkPatchDentalHistory(
        patientId,
        teethUpdates
      );
      
      console.log("✅ Updated Teeth saved:", updatedTeeth);
      console.log("🦷 === END SAVE PROCESS ===");

      // Update initial state to match saved data
      initialTeethConditions.current = { ...teethConditions };
      initialToothTreatments.current = { ...toothTreatments };
    } catch (error) {
      console.error("❌ Failed to save changes:", error);
    }
  };

  // Fetch data from the service and initialize state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dentalHistoryService.getDentalHistory(patientId);
        console.log(`🦷 Fetched dental history for TeethChartTab (${data.length} teeth):`, data);
        
        const conditions: Record<number, keyof typeof ToothCondition> = {};
        const treatments: Record<number, { id: string; name: string; duration?: number }[]> = {};

        data.forEach((tooth: any) => {
          conditions[tooth.toothNumber] = tooth.condition;
          treatments[tooth.toothNumber] = tooth.treatments || [];
        });

        console.log(`✅ Loaded ${Object.keys(conditions).length} tooth conditions and treatments`);

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
    console.log("🦷 Auto-save triggered. Current state:");
    console.log("   - teethConditions:", teethConditions);
    console.log("   - toothTreatments:", toothTreatments);
    console.log("   - hasChanges():", hasChanges());
    
    if (!hasChanges()) return;

    console.log("⏱️ Changes detected, starting 2s countdown for auto-save...");
    const timeoutId = setTimeout(() => {
      console.log("⏰ 2 seconds elapsed, calling handleSaveChanges...");
      handleSaveChanges();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      console.log("🧹 Clearing auto-save timeout");
      clearTimeout(timeoutId);
    };
  }, [teethConditions, toothTreatments]);

  // Save changes when the component unmounts
  useEffect(() => {
    return () => {
      console.log("🦷 Component unmounting, saving changes...");
      handleSaveChanges();
    };
  }, [teethConditions, toothTreatments]); // Include dependencies to capture latest state

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

  // Block scroll on parent container when drawer is open
  useEffect(() => {
    const scrollContainer = document.getElementById('dental-chart-container');
    if (scrollContainer) {
      if (selectedTooth) {
        scrollContainer.style.overflow = 'hidden';
      } else {
        scrollContainer.style.overflow = 'auto';
      }
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.style.overflow = 'auto';
      }
    };
  }, [selectedTooth]);



  return (
    <div className="space-y-4 overflow-none h-full">
      {/* Buttons moved outside the main container */}
      <div className="overflow-none h-full">
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
      <div className="bg-white relative overflow-y-auto">
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
      </div>

      <ToothDrawer
        selectedTooth={selectedTooth}
        onClose={handleCloseDrawer}
        teethConditions={teethConditions}
        setTeethConditions={setTeethConditions}
        toothTreatments={toothTreatments}
        setToothTreatments={setToothTreatments}
      />

    </div>
  );
};

export default TeethChartTab;