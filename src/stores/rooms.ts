import {defineStore} from 'pinia'
import httpCommon from '../config/http-common'
import type {Room} from "../types/Room.ts";

export const useRoomStore = defineStore('room', {
    state: () => ({
        loadingRooms: false,
        rooms: [] as Room[],
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
        //REFRESH ROOMS
        //
        async refreshRooms() {
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
            return response.data
        },
        //
        //GET ROOM FROM DB BY ID
        //
        async getRoomFromDb(roomId: number): Promise<Room | null> {
            console.log('START - getRoomFromDb(' + roomId + ')')
            this.loadingRooms = true

            const response = await httpCommon.get(`/v1/dobranocka/room/` + roomId)
            this.loadingRooms = false
            console.log('END - getRoomFromDb()',response)
            if (response.data)
                return response.data
            else
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
            console.log('START - addRoomDb()',room)
            const response = await httpCommon.post(`/v1/dobranocka/room`, room)
            this.rooms.push(response.data)
            console.log('END - addRoomDb()')
        },

        //
        //UPDATE ROOM
        //
        async updateRoomDb(room: Room) {
            console.log('START - updateRoomDb()', room)
            const response = await httpCommon.put(`/v1/dobranocka/room`, room)
            const index = this.rooms.findIndex((r: Room) => r.id === room.id)
            if (index !== -1) this.rooms.splice(index, 1, response.data)
            console.log('END - updateRoomDb()')
        },
    },
})
