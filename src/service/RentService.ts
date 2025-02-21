import {BedStatus, BedType, ReservationStatus} from "../types/Room.ts";
import {PaymentMethod} from "../types/Invoice.ts";
import {TranslationService} from "@/service/TranslationService.ts";
import moment from "moment";

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

    getPaymentMethodsOption() {
        return Object.keys(PaymentMethod).map((key) => ({
            label: TranslationService.translateEnum("PaymentMethod", key), // klucz
            value: PaymentMethod[key as keyof typeof PaymentMethod], // wartość
        }));
    },

    getBedTypeOption() {
        return Object.keys(BedType).map((key) => ({
            label: TranslationService.translateEnum("BedType", key), // klucz
            value: BedType[key as keyof typeof BedType], // wartość
        }));
    },

    getBedStatusOption() {
        return Object.keys(BedStatus).map((key) => ({
            label: TranslationService.translateEnum("BedStatus", key), // klucz
            value: BedStatus[key as keyof typeof BedStatus], // wartość
        }));
    },

    calculateRentPeriodArray(startDate: Date, endDate: Date): [number, number] {
        // console.log("calculateRentPeriodArray: ", startDate, endDate);
        const start = moment(startDate);
        const end = moment(endDate);

        const months = end.diff(start, 'months');

        const startAfterFullMonths = start.clone().add(months, 'months');

        const days = end.diff(startAfterFullMonths, 'days');

        if (months > 0 && days === 0) {
            return [months, 0];
        } else if (months > 0 && days > 0) {
            return [months, days];
        } else {
            const totalDays = end.diff(start, 'days');
            return [0, totalDays];
        }
    }
}
