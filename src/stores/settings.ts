import {defineStore} from "pinia";
import httpCommon from "../config/http-common";
import type {Company} from "../types/Company.ts";

export const useSettingsStore = defineStore("settings", {
    state: () => ({
        loading: false,
    }),

    //getters = computed
    getters: {
    },

    //actions = metody w komponentach
    actions: {
        //
        //---------------------------------------COMPANY NAME----------------------------------------------
        //
        async getCompanyDb():Promise<Company> {
            console.log("START - getCompanyName()");
            const response = await httpCommon.get(`/v1/dobranocka`);
            console.log("END - getCompanyName()");
            return response.data;
        },
        async updateCompanyDb(company: Company) {
            console.log("START - updateCompanyNameDb()",company);
            await httpCommon.put(`/v1/dobranocka`, company);
            console.log("END - updateCompanyNameDb()");
        },
    },
});
