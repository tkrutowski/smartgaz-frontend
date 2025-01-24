import {BedStatus} from "../types/Room.ts";
import type {Invoice} from "../types/Invoice.ts";

export const FinanceService = {

    getInvoiceAmount (inv : Invoice): number {
        if (!inv) return 0;
        return inv.invoiceItems.reduce((acc, item) => {
            return acc + item.quantity * item.amount;
        }, 0);
    }


}
