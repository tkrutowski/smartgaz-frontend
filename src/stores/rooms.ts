import {defineStore} from 'pinia'
import httpCommon from '../config/http-common'
import {BedStatus, BedType, type Room} from "../types/Room.ts";

export const useRoomStore = defineStore('room', {
    state: () => ({
        loadingRooms: false,
        rooms: [] as Room[],
    }),

    //getters = computed
    getters: {
        getAllBeds: (state) =>
            state.rooms.flatMap((room: Room) => room.beds)
    },

    //actions = metody w komponentach
    actions: {
        //
        //REFRESH ROOMS
        //
        async refreshRooms() {
            if (!this.loadingRooms)
                this.rooms = await this.getRoomsFromDb()
        },
        //
        //GET ROOMS
        //
        async getRooms() {
            console.log('START - getRooms()')
            if (this.rooms.length === 0 && !this.loadingRooms) {
                await this.refreshRooms()
            }
            console.log('END - getRooms()')

            return this.rooms
        },
        getRoomColorByBed(idBed:number):string {
            // console.log('START - getRoomColorByBed()', idBed)
            const room = this.rooms.find(room =>
                room.beds.some(bed => bed.id === idBed)
            );

            // console.log('START - getRoomColorByBed()', room?.color)
            return room ? `#${room.color}` : '';
        },
        getRoomByBed(idBed:number):Room | null {
            console.log('START - getRoomByBed()')
            const room = this.rooms.find(room =>
                room.beds.some(bed => bed.id === idBed)
            );
            console.log('END - getRoomColorByBed()')

            return room ? room : null;
        },
        //-------------------------------------------------------DATABASE
        //
        //GET ROOM FROM DB
        //
        async getRoomsFromDb(): Promise<Room[]> {
            console.log('START - getRoomsFromDb()')
            this.loadingRooms = true

            const response = await httpCommon.get(`/v1/dobranocka/room`)
            console.log('getRoomsFromDb() - Ilosc[]: ' + response.data.length)
            this.loadingRooms = false
            console.log('END - getRoomsFromDb()')
            return response.data;
        },
        //
        //GET ROOM FROM DB BY ID
        //
        async getRoomFromDb(roomId: number): Promise<Room | null> {
            console.log('START - getRoomFromDb(' + roomId + ')')
            this.loadingRooms = true

            const response = await httpCommon.get(`/v1/dobranocka/room/` + roomId)
            this.loadingRooms = false
            console.log('END - getRoomFromDb()', response)
            if (response.data) {
                return response.data
            } else
                return null
        },
        //
        //DELETE ROOM
        //
        async deleteRoomDb(roomId: number) {
            console.log('START - deleteRoomDb()')
            await httpCommon.delete(`/v1/dobranocka/room/` + roomId)
            const index = this.rooms.findIndex((r: Room) => r.id === roomId)
            if (index !== -1) this.rooms.splice(index, 1)
            console.log('END - deleteRoomDb()')
        },

        //ADD ROOM
        //
        async addRoomDb(room: Room) {
            console.log('START - addRoomDb()', room)
            const payload = {
                ...room,
                beds: room.beds.map(bed => ({
                    ...bed,
                    type: Object.keys(BedType).find(
                        key => BedType[key as keyof typeof BedType] === bed.type
                    ),
                    status: Object.keys(BedStatus).find(
                        key => BedStatus[key as keyof typeof BedStatus] === bed.status
                    )
                }))
            };
            const response = await httpCommon.post(`/v1/dobranocka/room`, payload)
            this.rooms.push(response.data)
            console.log('END - addRoomDb()')
        },

        //
        //UPDATE ROOM
        //
        async updateRoomDb(room: Room) {
            console.log('START - updateRoomDb()', room)
            const payload = {
                ...room,
                beds: room.beds.map(bed => ({
                    ...bed,
                    type: Object.keys(BedType).find(
                        key => BedType[key as keyof typeof BedType] === bed.type
                    ),
                    status: Object.keys(BedStatus).find(
                        key => BedStatus[key as keyof typeof BedStatus] === bed.status
                    )
                }))
            };
            const response = await httpCommon.put(`/v1/dobranocka/room`, payload)
            const index = this.rooms.findIndex((r: Room) => r.id === room.id)
            if (index !== -1) this.rooms.splice(index, 1, response.data)
            console.log('END - updateRoomDb()')
        },
    },
})
