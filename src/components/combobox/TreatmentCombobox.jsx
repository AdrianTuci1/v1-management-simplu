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

const TreatmentCombobox = ({ 
  value, 
  onValueChange, 
  placeholder = "Selectează tratament...",
  className 
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { treatments, loading, error, searchTreatments } = useTreatments();

  const selectedTreatment = treatments.find((treatment) => treatment.id.toString() === value);

  // Căutare când se deschide combobox-ul sau când se schimbă termenul de căutare
  React.useEffect(() => {
    if (open) {
      searchTreatments(searchTerm, 5);
    }
  }, [open, searchTerm, searchTreatments]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          mode="input"
          placeholder={!value}
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={loading}
        >
          <span className={cn('truncate')}>
            {selectedTreatment ? selectedTreatment.treatmentType : placeholder}
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
              {treatments.map((treatment) => (
                <CommandItem
                  key={treatment.id}
                  value={treatment.name}
                  onSelect={() => {
                    onValueChange(treatment.id.toString());
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{treatment.name}</span>
                  {value === treatment.id.toString() && <CommandCheck />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TreatmentCombobox;
