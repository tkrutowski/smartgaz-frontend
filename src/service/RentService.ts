import {type Bed, BedStatus, BedType, type ReservationBed, ReservationStatus} from "../types/Room.ts";
import {PaymentMethod} from "../types/Invoice.ts";
import {TranslationService} from "@/service/TranslationService.ts";
import moment from "moment";
import {useReservationStore} from "@/stores/reservation.ts";

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
    },

    getNextBedReservationStartDate(bedToCheck: Bed): string | null {
        const reservationStore = useReservationStore();
        const today = moment().startOf('day').toDate();

        // Sprawdzamy, czy łóżko NIE jest aktualnie zajęte
        if (bedToCheck.status !== BedStatus.OCCUPIED) {
            // Filtrujemy rezerwacje tylko dla tego łóżka, które mają datę rozpoczęcia w przyszłości
            const futureReservations = reservationStore.reservations
                .filter(reservation =>
                    reservation.beds.flatMap((resBed: ReservationBed) => resBed.bed)
                        .some((bed: Bed) => bed.id === bedToCheck.id) &&
                    reservation.startDate !== null &&
                    moment(reservation.startDate).toDate() > today // Rezerwacja zaczyna się w przyszłości
                );
            // Jeśli brak przyszłych rezerwacji, zwracamy null
            if (futureReservations.length === 0) {
                return null;
            }
            // Znajdujemy najbliższą przyszłą datę rozpoczęcia rezerwacji
            const earliestStartDate = futureReservations
                .map(reservation => new Date(reservation.startDate!))
                .reduce((earliest, current) => (current < earliest ? current : earliest));
            return "(Zajęty od " + moment(earliestStartDate).format("YYYY-MM-DD") + ")";
        }
        return null; // Jeśli łóżko jest zajęte dzisiaj, nie sprawdzamy przyszłych rezerwacji
    },

    getBedReservationEndDate(bedToCheck: Bed): string | null {
        const reservationStore = useReservationStore();
        const today = moment().startOf('day').toDate();

        // Sprawdzamy, czy łóżko jest aktualnie zajęte
        if (bedToCheck.status === BedStatus.OCCUPIED) {

            // Filtrujemy rezerwacje tylko dla tego łóżka, które są aktywne dzisiaj
            const bedReservations = reservationStore.reservations
                .filter(reservation =>
                    reservation.beds.flatMap((resBed: ReservationBed) => resBed.bed)
                        .some((bed: Bed) => bed.id === bedToCheck.id) &&
                    reservation.startDate !== null &&
                    reservation.endDate !== null &&
                    moment(reservation.startDate).toDate() <= today &&
                    moment(reservation.endDate).toDate() >= today
                );

            // Jeśli brak aktywnej rezerwacji dla dzisiejszego dnia, zwracamy null
            if (bedReservations.length === 0) {
                return null;
            }

            // Znajdujemy najpóźniejszą datę zakończenia aktywnej rezerwacji
            const latestEndDate = bedReservations
                .map(reservation => new Date(reservation.endDate!))
                .reduce((latest, current) => (current > latest ? current : latest));

            return " do " + moment(latestEndDate).format("YYYY-MM-DD");
        }
        return null; // Jeśli łóżko nie jest zajęte
    }
}
