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
import { useUsers } from '../../hooks/useUsers.js';
import { Stethoscope } from 'lucide-react';

const DoctorCombobox = ({ 
  value, 
  onValueChange, 
  placeholder = "Selectează doctor...",
  className 
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { users, loading, error, searchUsers } = useUsers();

  // Filtrăm doar utilizatorii care pot prelua programări
  const availableDoctors = users.filter((user) => user.canTakeAppointments === true);
  const selectedDoctor = availableDoctors.find((user) => (user.resourceId || user.id).toString() === (typeof value === 'string' ? value : value?.id));

  // Căutare când se deschide combobox-ul sau când se schimbă termenul de căutare
  React.useEffect(() => {
    if (open) {
      searchUsers(searchTerm, {}, 5);
    }
  }, [open, searchTerm, searchUsers]);

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
          <Stethoscope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <span className={cn('truncate')}>
            {selectedDoctor ? selectedDoctor.medicName : (typeof value === 'object' && value?.name ? value.name : placeholder)}
          </span>
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popper-anchor-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Caută doctor..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Se încarcă..." : error ? "Eroare la încărcare" : "Nu s-a găsit niciun doctor."}
            </CommandEmpty>
            <CommandGroup>
              {availableDoctors.map((user) => (
                <CommandItem
                  key={user.resourceId || user.id}
                  value={user.medicName}
                  onSelect={() => {
                    const doctorData = {
                      id: (user.resourceId || user.id).toString(),
                      name: user.medicName
                    };
                    onValueChange(doctorData);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{user.medicName}</span>
                  {(typeof value === 'string' ? value : value?.id) === (user.resourceId || user.id).toString() && <CommandCheck />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DoctorCombobox;
