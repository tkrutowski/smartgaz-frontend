import {defineStore} from "pinia";
import httpCommon from "../config/http-common";
import type {Customer} from "../types/Customer";

export const useCustomerStore = defineStore("customer", {
    state: () => ({
        loadingCustomer: false,
        rowsPerPage: parseInt(localStorage.getItem('rowsPerPageDobranockaCustomer') || '20', 10),
        customers: [] as Customer[],
    }),

    //getters = computed
    getters: {
        getCustomerNames: (state) => {
            return state.customers.map(
                (customer) => customer.firstName + " " + customer.name
            );
        },
    },

    //actions = metody w komponentach
    actions: {
        async refreshCustomers() {
            if (!this.loadingCustomer)
                this.customers = await this.getCustomersFromDb()
        },
        getCustomerById(id: number): Customer | null {
            const customer = this.customers.find((customer) => customer.id === id);
            if (customer) return customer
            else return null
        },
        //-----------------------------------------------------------DATABASE------------------------------------------
        //
        //GET CUSTOMER BY STATUS
        //
        async getCustomersFromDb(): Promise<Customer[]> {
            console.log("START - getCustomersFromDb()");
            this.loadingCustomer = true;
            const response = await httpCommon.get("/v1/dobranocka/customer");
            console.log("getCustomersFromDb() - size[]: " + response.data.length);
            this.customers = response.data;
            this.loadingCustomer = false
            console.log('END - getCustomersFromDb()')
            return response.data
        },

        //
        //GET  CUSTOMER FROM DB BY ID
        //
        async getCustomerFromDb(customerId: number): Promise<Customer | null> {
            console.log("START - getCustomerFromDb(" + customerId + ")");
            this.loadingCustomer = true;
            const response = await httpCommon.get(`/v1/dobranocka/customer/` + customerId);
            this.loadingCustomer = false;
            console.log("END - getCustomerFromDb()");
            return response.data || null
        },

        //
        //ADD CUSTOMER
        //
        async addCustomerDb(customer: Customer) {
            console.log("START - addCustomerDb()");
            const response = await httpCommon.post(`/v1/dobranocka/customer`, customer);
            this.customers.push(response.data);
            console.log("END - addCustomerDb()");
        },

        //
        //UPDATE CUSTOMER
        //
        async updateCustomerDb(customer: Customer) {
            console.log("START - updateCustomerDb()");
            const response = await httpCommon.put(`/v1/dobranocka/customer`, customer);
            const index = this.customers.findIndex(
                (item) => item.id === customer.id
            );
            if (index !== -1) this.customers.splice(index, 1, response.data);
            console.log("END - updateCustomerDb()");
        },

        //
        //DELETE CUSTOMER
        //
        async deleteCustomerDb(customerId: number) {
            console.log("START - deleteCustomerDb()");
            await httpCommon.delete(`/v1/dobranocka/customer/` + customerId);
            const index = this.customers.findIndex(
                (item) => item.id === customerId
            );
            if (index !== -1) this.customers.splice(index, 1);
            console.log("END - deleteCustomerDb()");
        },
    },
});
