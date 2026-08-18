"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CATEGORY_COLOR_CLASS, categoryDisplayName } from "@/lib/category-display";
import { DEFAULT_CATEGORY_ICON } from "@/lib/category-icons";
import { CATEGORY_COLOR_PALETTE, type CategoryColor } from "@/server/system-categories";
import type { CategoryOption } from "./CardForm";

// Sentinel w selekcie kategorii: "dodaj własną kategorię" zamiast wybrania istniejącej
// (Sesja 16). Nie może kolidować z prawdziwym uuid kategorii. Zdefiniowany tu (nie w
// CardForm.tsx), żeby uniknąć cyklu importów — CardForm re-eksportuje tę stałą dla
// dotychczasowych importów z "@/components/CardForm".
export const NEW_CATEGORY_SENTINEL = "__new__";

interface CategoryPickerProps {
  idPrefix: string;
  categories: CategoryOption[];
  disabled?: boolean;
  categorySelection: string;
  onCategorySelectionChange: (value: string) => void;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  newCategoryColor: CategoryColor | "";
  onNewCategoryColorChange: (color: CategoryColor) => void;
  categoryLabel: string;
  categoryPlaceholder: string;
  newCategoryOptionLabel: string;
  newCategoryNameLabel: string;
  newCategoryNamePlaceholder: string;
  newCategoryColorLabel: string;
  categoryColorName: (color: CategoryColor) => string;
  categoryTranslation: (slug: string) => string;
  categoryError?: string;
  newCategoryNameError?: string;
  newCategoryColorError?: string;
}

// Wybór istniejącej kategorii albo utworzenie własnej (Sesja 16) — wydzielone z
// CardForm.tsx (Sesja V6.5), żeby ten sam blok UI dało się użyć też przy dodawaniu
// miejsca bezpośrednio z zakładki „Miejsca", bez duplikowania walidacji/JSX.
export function CategoryPicker({
  idPrefix,
  categories,
  disabled,
  categorySelection,
  onCategorySelectionChange,
  newCategoryName,
  onNewCategoryNameChange,
  newCategoryColor,
  onNewCategoryColorChange,
  categoryLabel,
  categoryPlaceholder,
  newCategoryOptionLabel,
  newCategoryNameLabel,
  newCategoryNamePlaceholder,
  newCategoryColorLabel,
  categoryColorName,
  categoryTranslation,
  categoryError,
  newCategoryNameError,
  newCategoryColorError,
}: CategoryPickerProps) {
  const selectedCategory = categories.find((category) => category.id === categorySelection);

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-category`} className="text-sm font-medium">
          {categoryLabel}
        </label>
        <div className="relative">
          {selectedCategory && (
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
              <CategoryIcon slug={selectedCategory.slug} color={selectedCategory.color} />
            </span>
          )}
          <Select
            id={`${idPrefix}-category`}
            value={categorySelection}
            disabled={disabled}
            onChange={(event) => onCategorySelectionChange(event.target.value)}
            style={selectedCategory ? { paddingLeft: "2.5rem" } : undefined}
          >
            <option value="" disabled>
              {categoryPlaceholder}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {categoryDisplayName(category, categoryTranslation)}
              </option>
            ))}
            <option value={NEW_CATEGORY_SENTINEL}>{newCategoryOptionLabel}</option>
          </Select>
        </div>
        {categoryError && <p className="text-sm text-status-urgent">{categoryError}</p>}
      </div>

      {categorySelection === NEW_CATEGORY_SENTINEL && (
        <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}-new-category-name`} className="text-sm font-medium">
              {newCategoryNameLabel}
            </label>
            <Input
              id={`${idPrefix}-new-category-name`}
              type="text"
              value={newCategoryName}
              disabled={disabled}
              placeholder={newCategoryNamePlaceholder}
              onChange={(event) => onNewCategoryNameChange(event.target.value)}
            />
            {newCategoryNameError && (
              <p className="text-sm text-status-urgent">{newCategoryNameError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{newCategoryColorLabel}</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={disabled}
                  aria-pressed={newCategoryColor === color}
                  aria-label={categoryColorName(color)}
                  title={categoryColorName(color)}
                  onClick={() => onNewCategoryColorChange(color)}
                  className={`flex size-11 items-center justify-center rounded-full text-white ${CATEGORY_COLOR_CLASS[color]} ${
                    newCategoryColor === color
                      ? "ring-2 ring-offset-2 ring-black/60 dark:ring-white/60 dark:ring-offset-black"
                      : ""
                  }`}
                >
                  <DEFAULT_CATEGORY_ICON className="size-5" strokeWidth={2} />
                </button>
              ))}
            </div>
            {newCategoryColorError && (
              <p className="text-sm text-status-urgent">{newCategoryColorError}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
