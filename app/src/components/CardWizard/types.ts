import type { Dispatch, SetStateAction } from "react";
import type { CardFormValues, CategoryOption, CompanyOption } from "@/components/CardForm";

export type StepProps = {
  values: CardFormValues;
  setValues: Dispatch<SetStateAction<CardFormValues>>;
  submitting: boolean;
  companies: CompanyOption[];
  categories: CategoryOption[];
  /** Przetłumaczone komunikaty błędów dla pól bieżącego kroku (z walidacji przy "Dalej"). */
  fieldErrors: Partial<Record<keyof CardFormValues, string>>;
};
