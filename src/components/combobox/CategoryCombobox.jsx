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
import { Plus } from 'lucide-react';

const CategoryCombobox = ({ 
  value, 
  onValueChange, 
  placeholder = "Selectează categoria...",
  className,
  onAddNewCategory
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Categorii predefinite pentru tratamente stomatologice
  const predefinedCategories = [
    'Consultații',
    'Igienă orală',
    'Tratamente conservatoare',
    'Chirurgie orală',
    'Imagini diagnostice',
    'Endodonție',
    'Protezare',
    'Implantologie',
    'Estetică',
    'Ortodonție'
  ];

  // Filtrează categoriile pe baza termenului de căutare
  const filteredCategories = predefinedCategories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verifică dacă termenul de căutare nu se potrivește cu nicio categorie existentă
  const isNewCategory = searchTerm && 
    !predefinedCategories.some(cat => cat.toLowerCase() === searchTerm.toLowerCase());

  const handleAddNewCategory = () => {
    if (onAddNewCategory && searchTerm.trim()) {
      onAddNewCategory(searchTerm.trim());
      setOpen(false);
      setSearchTerm('');
    }
  };

  const handleCategorySelect = (category) => {
    onValueChange(category);
    setOpen(false);
    setSearchTerm('');
  };

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
        >
          <span className={cn('truncate')}>
            {value || placeholder}
          </span>
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popper-anchor-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Caută categorie sau adaugă una nouă..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {isNewCategory ? (
                <div className="flex items-center justify-center p-2">
                  <button
                    onClick={handleAddNewCategory}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent rounded-md w-full justify-start"
                  >
                    <Plus className="h-4 w-4" />
                    Adaugă "{searchTerm}"
                  </button>
                </div>
              ) : (
                "Nu s-a găsit nicio categorie."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category}
                  value={category}
                  onSelect={() => handleCategorySelect(category)}
                >
                  <span className="truncate">{category}</span>
                  {value === category && <CommandCheck />}
                </CommandItem>
              ))}
              
              {/* Opțiunea de a adăuga o categorie nouă dacă nu se potrivește cu nicio categorie existentă */}
              {isNewCategory && (
                <CommandItem onSelect={handleAddNewCategory}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="text-primary">
                      Adaugă "{searchTerm}"
                    </span>
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryCombobox;
