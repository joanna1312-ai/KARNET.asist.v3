import { CardType, CompanyCategory, VoucherMode } from "@/generated/prisma/enums";

// Prowizoryczny, lokalny słownik tekstów PL na czas Sesji 3-6, zanim next-intl
// wejdzie w Sesji 7 (patrz plan-pracy-claude-code.md). Cel: żaden tekst widoczny dla
// użytkownika nie jest hardkodowany bezpośrednio w komponentach, więc migracja na
// właściwy mechanizm i18n (PL/EN) będzie tylko przeniesieniem tego obiektu.
export const dictionary = {
  cardsPage: {
    title: "Twoje karnety",
    addButton: "Dodaj karnet",
    emptyState:
      "Nie masz jeszcze żadnego karnetu. Dodaj pierwszy, żeby mieć go zawsze pod ręką.",
    loadError: "Nie udało się pobrać listy karnetów. Spróbuj odświeżyć stronę.",
    editButton: "Edytuj",
    deleteButton: "Usuń",
  },
  cardForm: {
    addTitle: "Nowy karnet",
    editTitle: "Edytuj karnet",
    companyLabel: "Firma",
    companyPlaceholder: "Wybierz firmę",
    typeLabel: "Typ karnetu",
    typeOptions: {
      [CardType.limit]: "Limit wejść",
      [CardType.unlimited]: "Bez limitu",
    } satisfies Record<CardType, string>,
    totalVisitsLabel: "Liczba wejść",
    expiryDateLabel: "Data ważności",
    expiryDateHintRequired: "Wymagana dla karnetu bez limitu.",
    expiryDateHintOptional: "Opcjonalna — możesz zostawić puste.",
    voucherModeLabel: "Sposób pokazywania vouchera",
    voucherModeOptions: {
      [VoucherMode.single]: "Jednorazowy (jeden kod/plik)",
      [VoucherMode.per_visit]: "Przy każdej wizycie",
    } satisfies Record<VoucherMode, string>,
    saveButton: "Zapisz",
    cancelButton: "Anuluj",
    savingButton: "Zapisywanie…",
    errors: {
      companyRequired: "Wybierz firmę.",
      typeRequired: "Wybierz typ karnetu.",
      expiryDateRequiredForUnlimited: "Karnet bez limitu wymaga daty ważności.",
      totalVisitsRequiredForLimit: "Podaj liczbę wejść dla karnetu z limitem.",
      totalVisitsPositive: "Liczba wejść musi być większa od zera.",
      voucherModeRequired: "Wybierz sposób pokazywania vouchera.",
      saveFailed: "Nie udało się zapisać karnetu. Spróbuj ponownie.",
    },
  },
  deleteCardDialog: {
    title: "Usunąć ten karnet?",
    body: "Tej operacji nie da się cofnąć z poziomu listy — karnet zniknie z Twojego widoku. Historia wejść pozostaje zapisana.",
    confirmButton: "Usuń karnet",
    cancelButton: "Anuluj",
    deleteFailed: "Nie udało się usunąć karnetu. Spróbuj ponownie.",
  },
  cardDetailsPage: {
    backLink: "Wróć do listy karnetów",
    loadError: "Nie udało się pobrać danych karnetu. Spróbuj odświeżyć stronę.",
    notFound: "Nie znaleziono tego karnetu.",
    limitCounter: (used: number, total: number) => `${used}/${total} wejść`,
    unlimitedLabel: "Bez limitu wejść",
    expiryLabel: (date: string) => `ważny do ${date}`,
    noExpiryLabel: "bez terminu ważności",
    visitsTitle: "Historia wejść",
    addVisitButton: "Dodaj wejście",
    emptyState: "Ten karnet nie ma jeszcze żadnych wejść. Dodaj pierwsze, gdy z niego skorzystasz.",
    archivedNotice: "Ten karnet jest zarchiwizowany — nie można już dodawać do niego wejść.",
    editButton: "Edytuj",
    deleteButton: "Usuń",
  },
  visitForm: {
    addTitle: "Nowe wejście",
    editTitle: "Edytuj wejście",
    visitDateLabel: "Data",
    visitTimeLabel: "Godzina",
    visitTimeHint: "Opcjonalna.",
    noteLabel: "Notatka",
    noteHint: "Opcjonalna, do 80 znaków.",
    saveButton: "Zapisz",
    cancelButton: "Anuluj",
    savingButton: "Zapisywanie…",
    errors: {
      visitDateInvalid: "Podaj poprawną datę.",
      noteTooLong: "Notatka może mieć maksymalnie 80 znaków.",
      saveFailed: "Nie udało się zapisać wejścia. Spróbuj ponownie.",
      cardArchived: "Ten karnet jest zarchiwizowany — nie można już dodawać do niego wejść.",
    },
  },
  deleteVisitDialog: {
    title: "Usunąć to wejście?",
    body: "Licznik wykorzystanych wejść zostanie odpowiednio zmniejszony. Tej operacji nie da się cofnąć.",
    confirmButton: "Usuń wejście",
    cancelButton: "Anuluj",
    deleteFailed: "Nie udało się usunąć wejścia. Spróbuj ponownie.",
  },
  companyCategory: {
    [CompanyCategory.gym]: "Siłownia",
    [CompanyCategory.pool]: "Basen",
    [CompanyCategory.group_classes]: "Zajęcia grupowe",
    [CompanyCategory.massage]: "Masaż",
    [CompanyCategory.beauty]: "Uroda",
  } satisfies Record<CompanyCategory, string>,
} as const;
