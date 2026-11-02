import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives';
import {
  FONT_CATEGORIES,
  type FontCategory,
  useIntersectionObserver,
} from '@/lib/utils';
import {
  fetchGoogleFontsByCategory,
  loadFontStylesheet,
} from '@/services/fontsService';
import { useLanguage } from '@/context/LanguageContext';
import { usePdfSettingsStore } from '@/store/useResumeStore';

interface LazyFontItemProps {
  family: string;
  isSelected: boolean;
  onSelect: (family: string) => void;
}

function LazyFontItem({ family, isSelected, onSelect }: LazyFontItemProps) {
  const [ref, entry] = useIntersectionObserver({ threshold: 0.1 });
  const isIntersecting = Boolean(entry?.isIntersecting);

  useEffect(() => {
    if (isIntersecting) {
      loadFontStylesheet(family);
    }
  }, [isIntersecting, family]);

  return (
    <CommandItem
      value={family}
      onSelect={() => onSelect(family)}
      className="cursor-pointer"
    >
      <div ref={ref} className="flex w-full items-center justify-between">
        <span style={{ fontFamily: `"${family}", sans-serif` }}>{family}</span>
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
    </CommandItem>
  );
}

export function FontPicker() {
  const { pdfSettings, updatePdfSettings } = usePdfSettingsStore();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [fonts, setFonts] = useState<string[]>([]);

  const currentCategory =
    (pdfSettings.fontCategory as FontCategory) || 'ATS-Friendly';

  useEffect(() => {
    let active = true;
    fetchGoogleFontsByCategory(currentCategory).then((items) => {
      if (active) {
        setFonts(items.map((i) => i.family));
      }
    });
    return () => {
      active = false;
    };
  }, [currentCategory]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">{t('controls.fontCategory')}</Label>
        <Select
          value={currentCategory}
          onValueChange={(val) =>
            updatePdfSettings({ fontCategory: val as FontCategory })
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={t('controls.selectCategory')} />
          </SelectTrigger>
          <SelectContent>
            {FONT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t('controls.fontFamily')}</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-9 w-full justify-between text-xs font-normal"
            >
              <span
                style={{ fontFamily: `"${pdfSettings.fontFamily}", sans-serif` }}
              >
                {pdfSettings.fontFamily}
              </span>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder={t('controls.searchFont')} />
              <CommandList>
                <CommandEmpty>{t('controls.noFontFound')}</CommandEmpty>
                <CommandGroup>
                  {fonts.map((family) => (
                    <LazyFontItem
                      key={family}
                      family={family}
                      isSelected={pdfSettings.fontFamily === family}
                      onSelect={(selected) => {
                        loadFontStylesheet(selected);
                        updatePdfSettings({ fontFamily: selected });
                        setOpen(false);
                      }}
                    />
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
