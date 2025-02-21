export const Translations: Record<string, Record<string, string>> = {
    PaymentMethod: {CASH: "gotówka", CASH_LATE: "gotówka terminowa", TRANSFER: "przelew"},
    BedType: {SINGLE: "pojedyncze", DOUBLE: "podwójne"},
    BedStatus: {
        AVAILABLE: "Dostępny",
        BOOKED: "Zarezerwowany",
        OCCUPIED: "Zajęty",
        TO_CLEAN: "Do sprzątania",
        CLEANED: "Posprzątany",
        UNAVAILABLE: "Niedostępny"
    },
    ReservationStatus: {
        NO_PAYMENT: "Brak wpłaty",
        ADVANCE_PAID: "Wpłacony zadatek",
        FULLY_PAID: "Wpłacona całość",
        CANCELLED: "Anulowana"
    },
    PaymentStatus: {
        PAID: "Zapłacona",
        TO_PAY: "Do zapłaty",
        OVER_DUE: "Przeterminowana",
        ALL: "ALL"
    }
};

export const TranslationService = {
    translateEnum(enumName: string, key: string): string {
        // console.log("translateEnum ENUM, key",enumName,key, Translations[enumName]?.[key] || key)
        return Translations[enumName]?.[key] || key;
    }
}
