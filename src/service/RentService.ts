import {BedStatus, ReservationStatus} from "../types/Room.ts";

export const RentService = {


    getSeverity (status: keyof typeof BedStatus): string | null {
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
                return null;
        }
    },

    getSeverityReservation (status: keyof typeof ReservationStatus): string | null {
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
                return null;
        }
    }


}
