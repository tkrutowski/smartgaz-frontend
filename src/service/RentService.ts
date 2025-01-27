import {BedStatus, ReservationStatus} from "../types/Room.ts";

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
    }


}
