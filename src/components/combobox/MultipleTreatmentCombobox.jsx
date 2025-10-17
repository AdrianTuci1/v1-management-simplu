'use client';

import * as React from 'react';
import { cn } from '../../lib/utils.js';
import { Button, ButtonArrow } from '../ui/button.tsx';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx';
import { useTreatments } from '../../hooks/useTreatments.js';
import { Pill, X } from 'lucide-react';

const MultipleTreatmentCombobox = ({ 
  value = [], // Array de tratamente: [{id, name, duration, price}]
  onValueChange, 
  placeholder = "Selectează tratamente...",
  className 
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { treatments, loading, error, searchTreatments } = useTreatments();

  // Căutare când se deschide combobox-ul sau când se schimbă termenul de căutare
  React.useEffect(() => {
    if (open) {
      searchTreatments(searchTerm, 5);
    }
  }, [open, searchTerm, searchTreatments]);

  // Verifică dacă un tratament este selectat
  const isTreatmentSelected = (treatmentId) => {
    return value.some(t => t.id === treatmentId.toString());
  };

  // Toggle treatment selection
  const toggleTreatment = (treatment) => {
    const treatmentId = (treatment.resourceId || treatment.id).toString();
    
    if (isTreatmentSelected(treatmentId)) {
      // Remove treatment
      onValueChange(value.filter(t => t.id !== treatmentId));
    } else {
      // Add treatment
      const treatmentData = {
        id: treatmentId,
        name: treatment.treatmentType,
        duration: treatment.duration,
        price: treatment.price
      };
      onValueChange([...value, treatmentData]);
    }
  };

  // Remove a specific treatment
  const removeTreatment = (treatmentId, e) => {
    e.stopPropagation();
    onValueChange(value.filter(t => t.id !== treatmentId));
  };

  // Calculate total price and duration
  const totalPrice = value.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  const totalDuration = value.reduce((sum, t) => sum + (parseInt(t.duration) || 0), 0);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            mode="input"
            size="lg"
            placeholder={value.length === 0}
            aria-expanded={open}
            className={cn("w-full justify-between bg-white border-gray-300 relative pl-9 min-h-10", className)}
            disabled={loading}
          >
            <Pill className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <span className={cn('truncate')}>
              {value.length > 0 
                ? `${value.length} ${value.length === 1 ? 'tratament' : 'tratamente'} selectat${value.length === 1 ? '' : 'e'}`
                : placeholder
              }
            </span>
            <ButtonArrow />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popper-anchor-width] p-0">
          <Command>
            <CommandInput 
              placeholder="Caută tratament..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Se încarcă..." : error ? "Eroare la încărcare" : "Nu s-a găsit niciun tratament."}
              </CommandEmpty>
              <CommandGroup>
                {treatments.map((treatment) => {
                  const treatmentId = (treatment.resourceId || treatment.id).toString();
                  const isSelected = isTreatmentSelected(treatmentId);
                  
                  return (
                    <CommandItem
                      key={treatmentId}
                      value={treatment.treatmentType}
                      onSelect={() => toggleTreatment(treatment)}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="truncate">{treatment.treatmentType}</span>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {treatment.duration && (
                            <span>Durată: {treatment.duration} min</span>
                          )}
                          {treatment.price && (
                            <span>Preț: {treatment.price} RON</span>
                          )}
                        </div>
                      </div>
                      {isSelected && <CommandCheck />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected treatments display */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((treatment) => (
            <div
              key={treatment.id}
              className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md"
            >
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">{treatment.name}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {treatment.duration && (
                    <span>Durată: {treatment.duration} min</span>
                  )}
                  {treatment.price && (
                    <span>Preț: {treatment.price} RON</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => removeTreatment(treatment.id, e)}
                className="p-1 hover:bg-gray-200 rounded"
                type="button"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
          
          {/* Total summary */}
          <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm font-medium">Total:</span>
            <div className="flex gap-4 text-sm">
              {totalDuration > 0 && (
                <span className="text-blue-700">{totalDuration} min</span>
              )}
              {totalPrice > 0 && (
                <span className="text-blue-700 font-semibold">{totalPrice.toFixed(2)} RON</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleTreatmentCombobox;

