"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deviceFetch } from "@/lib/device-client";
import type { CategoryColor } from "@/server/system-categories";
import type { CategoryOption } from "./CardForm";
import { CategoryPicker, NEW_CATEGORY_SENTINEL } from "./CategoryPicker";
import { PlacesAutocomplete, type PlaceSelection } from "./PlacesAutocomplete";

export interface CreatedCompany {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: CategoryOption;
}

type ErrorCode =
  | "nameRequired"
  | "categoryRequired"
  | "newCategoryNameRequired"
  | "newCategoryColorRequired"
  | "saveFailed";

interface AddCompanyFormProps {
  categories: CategoryOption[];
  submitting: boolean;
  onSubmittingChange: (submitting: boolean) => void;
  onCategoryCreated: (category: CategoryOption) => void;
  onCreated: (company: CreatedCompany) => void;
  onCancel: () => void;
}

// Formularz „Dodaj miejsce" na /companies (Sesja V6.5) — wzorem trybu "nowa firma" w
// CardForm.tsx, ale samodzielny: sam woła POST /api/categories (jeśli wybrano nową
// kategorię) i POST /api/companies, bo tu nie powstaje przy okazji żaden karnet.
export function AddCompanyForm({
  categories,
  submitting,
  onSubmittingChange,
  onCategoryCreated,
  onCreated,
  onCancel,
}: AddCompanyFormProps) {
  const t = useTranslations("addCompanyForm");
  const tCardForm = useTranslations("cardForm");
  const tCategory = useTranslations("companyCategory");
  const formId = useId();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [categorySelection, setCategorySelection] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState<CategoryColor | "">("");
  const [errors, setErrors] = useState<ErrorCode[]>([]);

  function handleNameChange(value: string) {
    setName(value);
    setLat(null);
    setLng(null);
    setGooglePlaceId(null);
  }

  function handlePlaceSelect(place: PlaceSelection) {
    setName(place.name);
    setLat(place.lat);
    setLng(place.lng);
    setGooglePlaceId(place.googlePlaceId);
    // Adres z wyszukiwarki nadpisuje ręcznie wpisany — użytkownik może go potem
    // jeszcze poprawić, pole zostaje edytowalne.
    if (place.address) setAddress(place.address);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const foundErrors: ErrorCode[] = [];
    if (name.trim().length === 0) foundErrors.push("nameRequired");
    if (!categorySelection) {
      foundErrors.push("categoryRequired");
    } else if (categorySelection === NEW_CATEGORY_SENTINEL) {
      if (newCategoryName.trim().length === 0) foundErrors.push("newCategoryNameRequired");
      if (!newCategoryColor) foundErrors.push("newCategoryColorRequired");
    }
    setErrors(foundErrors);
    if (foundErrors.length > 0) return;

    onSubmittingChange(true);

    let categoryId = categorySelection;
    if (categoryId === NEW_CATEGORY_SENTINEL) {
      const categoryResponse = await deviceFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim(), color: newCategoryColor }),
      });
      if (!categoryResponse.ok) {
        onSubmittingChange(false);
        setErrors(["saveFailed"]);
        return;
      }
      const categoryBody: { category: CategoryOption } = await categoryResponse.json();
      categoryId = categoryBody.category.id;
      onCategoryCreated(categoryBody.category);
    }

    const companyResponse = await deviceFetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        categoryId,
        address: address.trim() === "" ? null : address.trim(),
        lat,
        lng,
        googlePlaceId,
      }),
    });

    if (!companyResponse.ok) {
      onSubmittingChange(false);
      setErrors(["saveFailed"]);
      return;
    }

    const companyBody: { company: CreatedCompany } = await companyResponse.json();
    onSubmittingChange(false);
    onCreated(companyBody.company);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10"
    >
      <h2 className="text-lg font-semibold">{t("title")}</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-name`} className="text-sm font-medium">
          {t("nameLabel")}
        </label>
        <PlacesAutocomplete
          id={`${formId}-name`}
          value={name}
          disabled={submitting}
          placeholder={t("namePlaceholder")}
          noResultsLabel={tCardForm("placesNoResults")}
          onChange={handleNameChange}
          onPlaceSelect={handlePlaceSelect}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{tCardForm("mapsSearchHint")}</p>
        {errors.includes("nameRequired") && (
          <p className="text-sm text-status-urgent">{t("errors.nameRequired")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-address`} className="text-sm font-medium">
          {t("addressLabel")}
        </label>
        <Input
          id={`${formId}-address`}
          type="text"
          value={address}
          disabled={submitting}
          placeholder={t("addressPlaceholder")}
          onChange={(event) => setAddress(event.target.value)}
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("addressHint")}</p>
      </div>

      <CategoryPicker
        idPrefix={`${formId}-category`}
        categories={categories}
        disabled={submitting}
        categorySelection={categorySelection}
        onCategorySelectionChange={setCategorySelection}
        newCategoryName={newCategoryName}
        onNewCategoryNameChange={setNewCategoryName}
        newCategoryColor={newCategoryColor}
        onNewCategoryColorChange={setNewCategoryColor}
        categoryLabel={tCardForm("categoryLabel")}
        categoryPlaceholder={tCardForm("categoryPlaceholder")}
        newCategoryOptionLabel={tCardForm("newCategoryOption")}
        newCategoryNameLabel={tCardForm("newCategoryNameLabel")}
        newCategoryNamePlaceholder={tCardForm("newCategoryNamePlaceholder")}
        newCategoryColorLabel={tCardForm("newCategoryColorLabel")}
        categoryColorName={(color) => tCardForm(`categoryColors.${color}`)}
        categoryTranslation={tCategory}
        categoryError={
          errors.includes("categoryRequired") ? t("errors.categoryRequired") : undefined
        }
        newCategoryNameError={
          errors.includes("newCategoryNameRequired")
            ? tCardForm("errors.newCategoryNameRequired")
            : undefined
        }
        newCategoryColorError={
          errors.includes("newCategoryColorRequired")
            ? tCardForm("errors.newCategoryColorRequired")
            : undefined
        }
      />

      {errors.includes("saveFailed") && (
        <p className="text-sm text-status-urgent">{t("errors.saveFailed")}</p>
      )}

      <div className="mt-2 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {tCardForm("cancelButton")}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tCardForm("savingButton") : tCardForm("saveButton")}
        </Button>
      </div>
    </form>
  );
}
