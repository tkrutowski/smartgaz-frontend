import {BedStatus, BedType, ReservationStatus} from "../types/Room.ts";
import {PaymentMethod} from "../types/Invoice.ts";

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

    getPaymentMethodsKeyValue () {
        return Object.keys(PaymentMethod).map((key) => ({
            label: PaymentMethod[key as keyof typeof PaymentMethod], // wartość
            value: key, // klucz
        }));
    },

    getBedTypeKeyValue () {
        return Object.keys(BedType).map((key) => ({
            label: BedType[key as keyof typeof BedType], // wartość
            value: key, // klucz
        }));
    },

    getBedStatusKeyValue () {
        return Object.keys(BedStatus).map((key) => ({
            label: BedStatus[key as keyof typeof BedStatus], // wartość
            value: key, // klucz
        }));
    }
}
