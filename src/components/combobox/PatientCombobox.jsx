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
import { usePatients } from '../../hooks/usePatients.js';

const PatientCombobox = ({ 
  value, 
  onValueChange, 
  placeholder = "Selectează pacient...",
  className 
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { patients, loading, error, searchPatients } = usePatients();

  const selectedPatient = patients.find((patient) => patient.id.toString() === value);

  // Căutare când se deschide combobox-ul sau când se schimbă termenul de căutare
  React.useEffect(() => {
    if (open) {
      searchPatients(searchTerm, 5);
    }
  }, [open, searchTerm, searchPatients]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          mode="input"
          size="lg"
          placeholder={!value}
          aria-expanded={open}
          className={cn("w-full justify-between bg-white border-gray-300", className)}
          disabled={loading}
        >
          <span className={cn('truncate')}>
            {selectedPatient ? selectedPatient.name : placeholder}
          </span>
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popper-anchor-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Caută pacient..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Se încarcă..." : error ? "Eroare la încărcare" : "Nu s-a găsit niciun pacient."}
            </CommandEmpty>
            <CommandGroup>
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.name}
                  onSelect={() => {
                    onValueChange(patient.id.toString());
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{patient.name}</span>
                  {value === patient.id.toString() && <CommandCheck />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default PatientCombobox;
