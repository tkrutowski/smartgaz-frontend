import {defineStore} from "pinia";
import httpCommon from "../config/http-common";
import type {Invoice, Vat} from "../types/Invoice.ts";
import {PaymentMethod, PaymentStatus} from "../types/Invoice.ts";
import moment from "moment";

export const useInvoiceStore = defineStore("invoice", {
    state: () => ({
        rowsPerPage: parseInt(localStorage.getItem("rowsPerPageInvoice") || "10", 10),
        btnDisabled: false,
        loadingInvoices: false,
        loadingInvoiceNo: false,
        loadingPaymentType: false,
        loadingFile: false,
        loadingWait: false,
        invoices: [] as Invoice[],
        paymentTypes: [] as PaymentMethod[],
        vatTypes: [] as Vat[],
    }),

    //getters = computed
    getters: {
        getSortedInvoices: (state) =>
            state.invoices.sort((a, b) => a.idInvoice - b.idInvoice),
    },
    //actions = metody w komponentach
    actions: {
        async refreshInvoices() {
            if (!this.loadingInvoices)
                await this.getInvoicesFromDb("ALL")
        },

        //
        //GET CUSTOMER'S INVOICES
        //
        async getCustomerInvoices(customerId: number) {
            console.log("geCustomerInvoices() ", customerId);
            if (this.invoices.length === 0) {
                console.log("Downloading Invoices...", this.invoices.length);
                this.loadingWait = true;
                await this.getInvoicesFromDb("ALL");
                this.loadingWait = false;
                console.log("Downloaded Invoices ", this.invoices.length);
            }
            const result = this.invoices.filter(
                (invoice) => invoice.customer?.id === customerId
            );
            console.log("geCustomerInvoices() size: ", result.length);
            return result;
        },

        //
        //GET ALL INVOICES FROM DB BY PAYMENT_STATUS
        //
        async getInvoicesFromDb(paymentStatus: string): Promise<void> {
            console.log("START - getInvoicesFromDb(" + paymentStatus + ")");
            this.loadingInvoices = true;
                const response = await httpCommon.get(`/v1/dobranocka/invoice?status=` + paymentStatus);
                console.log(
                    "getInvoicesFromDb() - Ilosc faktur[]: " + response.data.length
                );
                this.invoices = response.data.map((invoice: any) => this.convertResponse(invoice));
                console.log("getInvoicesFromDb()", this.invoices);
            this.loadingInvoices = false;
            console.log("END - getInvoicesFromDb(" + paymentStatus + ")");
        },

        //
        //GET  INVOICE FROM DB BY ID
        //
        async getInvoiceFromDb(invoiceId: number): Promise<Invoice | undefined> {
            console.log("START - getInvoiceFromDb(" + invoiceId + ")");
            this.loadingInvoices = true;
            const response = await httpCommon.get(`/v1/dobranocka/invoice/` + invoiceId);
            this.loadingInvoices = false;
            console.log("END - getInvoiceFromDb()");
            return this.convertResponse(response.data);
        },

        //
        //CHANGE PAYMENT_STATUS
        //
        async updateInvoiceStatusDb(invoiceId: number, status: PaymentStatus) {
            console.log("START - updateInvoiceStatusDb()",status);
            await httpCommon.put(
                `/v1/dobranocka/invoice/paymentstatus/${invoiceId}?status=${status}`);
            const inv = this.invoices.find((inv) => inv.idInvoice === invoiceId);
            if (inv) {
                inv.paymentStatus = status;
            }
            console.log("END - updateInvoiceStatusDb()");
        },

        //
        //ADD INVOICE
        //
        async addInvoiceDb(invoice: Invoice) {
            console.log("START - addInvoiceDb()", invoice);
            const transformedInvoice = {
                ...invoice,
                invoiceDate: invoice.invoiceDate ? moment(invoice.invoiceDate).format("YYYY-MM-DD") : null,
                sellDate: invoice.sellDate ? moment(invoice.sellDate).format("YYYY-MM-DD") : null,
                paymentDate: invoice.paymentDate ? moment(invoice.paymentDate).format("YYYY-MM-DD") : null,
            };
            console.log("addInvoiceDb() trans", transformedInvoice);

            const response = await httpCommon.post(`/v1/dobranocka/invoice`, transformedInvoice);
            this.invoices.push(this.convertResponse(response.data));
            console.log("END - addInvoiceDb()");
        },


        //
        //UPDATE INVOICE
        //
        async updateInvoiceDb(invoice: Invoice) {
            console.log("START - updateInvoiceDb()");
            const transformedInvoice = {
                ...invoice,
                invoiceDate: invoice.invoiceDate ? moment(invoice.invoiceDate).format("YYYY-MM-DD") : null,
                sellDate: invoice.sellDate ? moment(invoice.sellDate).format("YYYY-MM-DD") : null,
                paymentDate: invoice.paymentDate ? moment(invoice.paymentDate).format("YYYY-MM-DD") : null,
            };
            console.log("updateInvoiceDb() trans", transformedInvoice);
            const response = await httpCommon.put(`/v1/dobranocka/invoice`, transformedInvoice);
            const index = this.invoices.findIndex(
                (inv) => inv.idInvoice === invoice.idInvoice
            );
            if (index !== -1) this.invoices.splice(index, 1, this.convertResponse(response.data));
            console.log("END - updateInvoiceStatusDb()");
        },

        //
        //DELETE INVOICE
        //
        async deleteInvoiceDb(invoiceId: number) {
            console.log("START - deleteInvoiceDb()");
            await httpCommon.delete(`/v1/dobranocka/invoice/` + invoiceId);
            const index = this.invoices.findIndex(
                (inv) => inv.idInvoice === invoiceId
            );
            if (index !== -1) this.invoices.splice(index, 1);
            console.log("END - deleteInvoiceDb()");
        },

        //
        //FIND INVOICE NUMBER
        //
        async findInvoiceNumber(year: number): Promise<number> {
            this.loadingInvoiceNo = true;
            console.log("findInvoiceNumber(", year, ")");
            if (this.invoices.length === 0) {
                console.log("loading invoices from DB");
                await this.getInvoicesFromDb("ALL");
            }
            const newNo = this.invoices
                .filter((value) => value.invoiceNumber.includes(String(year)))
                .map((value) => value.invoiceNumber.split("/")[1])
                .map((value) => parseInt(value))
                .sort((a, b) => a - b)
                .pop();
            console.log("new fv number: ", newNo);
            this.loadingInvoiceNo = false;
            return newNo ? newNo + 1 : 1;
        },


        //
        //GET VAT TYPE
        //
        async getVatType() {
            console.log("START - getVatType()");
            this.loadingPaymentType = true;
            if (this.vatTypes.length === 0) {
                const response = await httpCommon.get(
                    `/v1/dobranocka/invoice/vattype`);
                this.vatTypes = response.data;
            } else {
                console.log("getVatType() - BEZ GET");
            }
            this.loadingPaymentType = false;
        },

        //
        // DOWNLOAD PDF
        //
        async getInvoicePdfFromDb(invoiceID: number) {
            console.log("START - getInvoicePdfFromDb()");
            this.loadingFile = true;
            const response = await httpCommon.get(
                `/v1/dobranocka/invoice/pdf/` + invoiceID,
                {
                    responseType: "blob",
                }
            );
            console.log("getInvoicePdfFromDb", response);
            // Sprawdzenie, czy odpowiedź jest prawidłowa
            if (response.status !== 200) {
                throw new Error(`Błąd serwera: ${response.status}`);
            }
            this.loadingFile = false;
            console.log("END - getInvoicePdfFromDb()");
            return response
        },

        convertResponse(invoice: Invoice) {
            console.log("getInvoicesFromDb()", invoice);
            return {
                ...invoice,
                invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : null,
                sellDate: invoice.sellDate ? new Date(invoice.sellDate) : null,
                paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate) : null,
                // paymentMethod: PaymentMethod[invoice.paymentMethod as keyof typeof PaymentMethod] || invoice.paymentMethod,
                // paymentStatus: PaymentStatus[invoice.paymentStatus as keyof typeof PaymentStatus] || invoice.paymentStatus,
            }
        }
    },
});
