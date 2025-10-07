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
import { User } from 'lucide-react';

const PatientCombobox = ({ 
  value, 
  onValueChange, 
  placeholder = "Selectează pacient...",
  className 
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { patients, loading, error, searchPatients } = usePatients();

  const selectedPatient = patients.find((patient) => (patient.resourceId || patient.id).toString() === (typeof value === 'string' ? value : value?.id));

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
          className={cn("w-full justify-between bg-white border-gray-300 relative pl-9", className)}
          disabled={loading}
        >
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <span className={cn('truncate')}>
            {selectedPatient ? selectedPatient.name : (typeof value === 'object' && value?.name ? value.name : placeholder)}
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
                  key={patient.resourceId || patient.id}
                  value={patient.name}
                  onSelect={() => {
                    const patientData = {
                      id: (patient.resourceId || patient.id).toString(),
                      name: patient.name,
                      email: patient.email || '',
                      phone: patient.phone || ''
                    };
                    onValueChange(patientData);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{patient.name}</span>
                  {(typeof value === 'string' ? value : value?.id) === (patient.resourceId || patient.id).toString() && <CommandCheck />}
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
