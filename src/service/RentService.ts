import {BedStatus, BedType, ReservationStatus} from "../types/Room.ts";
import {PaymentMethod} from "../types/Invoice.ts";
import {TranslationService} from "@/service/TranslationService.ts";

export const RentService = {


    getSeverity(status: keyof typeof BedStatus | undefined): string | undefined {
        if (status)
            switch (status) {
                case 'AVAILABLE':
                    return 'success';
                case 'BOOKED':
                case 'OCCUPIED':
                case 'CLEANED':
                    return 'info';
                case 'TO_CLEAN':
                    return 'warning';
                case 'UNAVAILABLE':
                    return 'danger';
                default:
                    return undefined;
            }

        return undefined;
    },

    getSeverityReservation
    (status: keyof typeof ReservationStatus): string | undefined {
        switch (status) {
            case 'FULLY_PAID':
                return 'success';
            case 'ADVANCE_PAID':
                return 'info';
            case 'CANCELLED':
                return 'warning';
            case 'NO_PAYMENT':
                return 'danger';
            default:
                return undefined;
        }
    },

    getPaymentMethodsOption () {
        return Object.keys(PaymentMethod).map((key) => ({
            label: TranslationService.translateEnum("PaymentMethod", key), // klucz
            value: PaymentMethod[key as keyof typeof PaymentMethod], // wartość
        }));
    },

    getBedTypeOption () {
        return Object.keys(BedType).map((key) => ({
            label: TranslationService.translateEnum("BedType", key), // klucz
            value: BedType[key as keyof typeof BedType], // wartość
        }));
    },

    getBedStatusOption () {
        return Object.keys(BedStatus).map((key) => ({
            label: TranslationService.translateEnum("BedStatus", key), // klucz
            value: BedStatus[key as keyof typeof BedStatus], // wartość
        }));
    }
}
