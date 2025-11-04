import {defineStore} from 'pinia'
import httpCommon from '../config/http-common'
import {
    type Bed,
    BedStatus,
    type Reservation,
    type ReservationBed,
    ReservationStatus,
    type Room
} from "../types/Room.ts";
import moment from "moment/moment";

export const useReservationStore = defineStore('reservation', {
    state: () => ({
        rowsPerPage: parseInt(localStorage.getItem("rowsPerPageReservation") || "10", 10),
        loadingReservation: false,
        reservations: [] as Reservation[],
        selectedReservations: [] as Reservation[],
        beds: [] as Bed[]
    }),

    //getters = computed
    getters: {
        // getSortedSeries: (state) =>
        //     state.series.filter(serie => serie.id != 2)
        //         .sort((a, b) => a.title.localeCompare(b.title)),

    },

    //actions = metody w komponentach
    actions: {
        //
        //REFRESH RESERVATIONS
        //
        async refreshReservations() {
            this.reservations = await this.getReservationsFromDb()
        },
        //
        //GET RESERVATIONS
        //
        async getReservations() {
            console.log('START - getReservations()')
            if (this.reservations.length <= 1 && !this.loadingReservation) {
                await this.refreshReservations()
            }
            console.log('END - getReservations()')

            return this.reservations
        },

        //
        //FIND LAST RESERVATION NUMBER
        //
        async findNewReservationNumber(year: number): Promise<number> {
            console.log("findReservationNumber(", year, ")");
            if (this.reservations.length <= 1) {
                console.log("loading reservations from DB");
                await this.getReservations();
            }
            const newNo = this.reservations
                .filter((value) => value.number.includes(String(year)))
                .map((value) => value.number.split("/")[1])
                .map((value) => parseInt(value))
                .sort((a, b) => a - b)
                .pop();
            // console.log("last fv number: ", newNo);
            return newNo ? newNo + 1 : 1;
        },

        //-------------------------------------------------------DATABASE
        //
        //GET AVAILABLE BEDS FROM DB
        //
        async getAvailableBedsFromDb(start: Date, end: Date): Promise<Room[]> {
            console.log('START - getAvailableBedsFromDb()', start.toLocaleDateString())
            this.loadingReservation = true

            const response = await httpCommon.get(`/v1/dobranocka/reservation/search?start=${start.toLocaleDateString()}&end=${end.toLocaleDateString()}`)
            console.log('getRoomsFromDb() - Ilosc[]: ' + response.data.length)
            this.loadingReservation = false
            console.log('END - getAvailableBedsFromDb()')
            return response.data;
        },

        //
        //CHECK CHANGE DATE BEDS FROM DB
        //
        async checkBedAvailabilityFromDb(start: Date, end: Date, bedToCheckId: number, currentReservationId: number): Promise<boolean> {
            console.log('START - checkBedAvailabilityFromDb()', bedToCheckId)

            const response = await httpCommon.get(`/v1/dobranocka/reservation/checkbed?start=${start.toLocaleDateString()}&end=${end.toLocaleDateString()}&bedId=${bedToCheckId}&reservationId=${currentReservationId}`)
            console.log('END - checkBedAvailabilityFromDb()')
            return response.data;
        },

        //
        // CHECK IF RESERVATION ENDS THAT DAY FOR THAT BED
        //
        async isEndDateReservation(idBeds: number[], endDate: Date): Promise<{ [key: number]: boolean }> {
            console.log('START - isEndDateReservation()', idBeds, endDate)
            const response = await httpCommon.get(`/v1/dobranocka/reservation/check-end?beds=${idBeds}&date=${endDate.toLocaleDateString()}`)
            console.log('END - isEndDateReservation()', response)
            return response.data;
        },

        //
        // CHECK IF RESERVATION ENDS THAT DAY FOR THAT BED
        //
        async isStartDateReservation(idBeds: number[], startDate: Date): Promise<{ [key: number]: boolean }> {
            console.log('START - isStartDateReservation()', idBeds, startDate)
            const response = await httpCommon.get(`/v1/dobranocka/reservation/check-start?beds=${idBeds}&date=${startDate.toLocaleDateString()}`)
            console.log('END - isStartDateReservation()', response)
            return response.data;
        },

        //
        //GET RESERVATIONS FROM DB
        //
        async getReservationsFromDb(): Promise<Reservation[]> {
            console.log('START - getRoomsFromDb()')
            this.loadingReservation = true

            const response = await httpCommon.get(`/v1/dobranocka/reservation`)
            console.log('getReservationsFromDb() - Ilosc[]: ' + response.data.length)
            this.loadingReservation = false
            console.log('END - getReservationsFromDb()')
            return response.data
        },
        //
        //GET RESERVATION FROM DB BY ID
        //
        async getReservationFromDb(reservationId: number): Promise<Reservation | null> {
            console.log('START - getReservationFromDb(' + reservationId + ')')
            this.loadingReservation = true

            const response = await httpCommon.get(`/v1/dobranocka/reservation/` + reservationId)
            this.loadingReservation = false
            console.log('END - getReservationFromDb()', response)
            return response.data || null
        },

        //ADD RESERVATION
        //
        async addReservationDb(reservation: Reservation) {
            console.log('START - addReservationDb()', reservation)
            const payload = {
                ...reservation,
                startDate: reservation.startDate ? moment(reservation.startDate).format("YYYY-MM-DD") : null,
                endDate: reservation.endDate ? moment(reservation.endDate).format("YYYY-MM-DD") : null,
                reservationStatus: Object.keys(ReservationStatus).find(
                    key => ReservationStatus[key as keyof typeof ReservationStatus] === reservation.reservationStatus
                ),
                beds: reservation.beds.map((resBed: ReservationBed) => ({
                    ...resBed,
                    bed: {
                        ...resBed.bed,
                        // type: Object.keys(BedType).find(
                        //     key => BedType[key as keyof typeof BedType] ===  resBed.bed.type
                        // ),
                        status: Object.keys(BedStatus).find(
                            key => BedStatus[key as keyof typeof BedStatus] === resBed.bed.status
                        )
                    }
                }))
            };
            console.log('START - addReservationDb() payload', payload)
            const response = await httpCommon.post(`/v1/dobranocka/reservation`, payload)
            this.reservations.push(response.data)
            console.log('END - addReservationDb()')
        },


        //
        //DELETE ROOM
        //
        async deleteReservationDb(reservationId: number) {
            console.log('START - deleteReservationDb()')
            await httpCommon.delete(`/v1/dobranocka/reservation/` + reservationId)
            const index = this.reservations.findIndex((r: Reservation) => r.id === reservationId)
            if (index !== -1) this.reservations.splice(index, 1)
            console.log('END - deleteReservationDb()')
        },


        //
        //UPDATE RESERVATION
        //
        async updateReservationDb(reservation: Reservation) {
            console.log('START - updateReservationDb()')
            const payload = {
                ...reservation,
                startDate: reservation.startDate ? moment(reservation.startDate).format("YYYY-MM-DD") : null,
                endDate: reservation.endDate ? moment(reservation.endDate).format("YYYY-MM-DD") : null,
                // reservationStatus: Object.keys(ReservationStatus).find(
                //     key => ReservationStatus[key as keyof typeof ReservationStatus] === reservation.reservationStatus
                // ),
                // beds: reservation.beds.map((resBed: ReservationBed) => ({
                //     ...resBed,
                //     bed: {
                //         ...resBed.bed,
                //         type: Object.keys(BedType).find(
                //             key => BedType[key as keyof typeof BedType] ===  resBed.bed.type
                //         ),
                //         status: Object.keys(BedStatus).find(
                //             key => BedStatus[key as keyof typeof BedStatus] === resBed.bed.status
                //         )
                //     }
                // }))
            };
            // console.log('START - updateReservationDb()', payload)
            const response = await httpCommon.put(`/v1/dobranocka/reservation`, payload)
            const index = this.reservations.findIndex((r: Reservation) => r.id === reservation.id)
            if (index !== -1) this.reservations.splice(index, 1, response.data)
            console.log('END - updateReservationDb()')
        },

        // convertResponse(bed: Bed) {
        //     return {
        //         ...bed,
        //         type: BedType[bed.type as keyof typeof BedType] || bed.type,
        //         status: BedStatus[bed.status as keyof typeof BedStatus] || bed.status
        //     }
        // },
        //
        // convertResponse(res: Reservation) {
        //     console.log("convertResponse", res)
        //     return {
        //         ...res,
        //         beds: res.beds.map(bed => ({
        //             ...bed,
        //             // type: BedType[bed.type as keyof typeof BedType] || bed.type,
        //             // status: BedStatus[bed.status as keyof typeof BedStatus] || bed.status
        //         }))
        //     }
        // }

    },
})
