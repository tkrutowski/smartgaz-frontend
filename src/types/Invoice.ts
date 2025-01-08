
export interface Invoice {
  idInvoice: number;
  idCustomer: number;
  invoiceNumber: string;
  sellDate: Date | null;
  invoiceDate:  Date | null;
  paymentDate:  Date | null;
  paymentDeadline: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  otherInfo: string;
  invoiceItems: InvoiceItem[];
}
// export default Invoice
export interface InvoiceItem {
  id: number;
  idInvoice: number;
  name: string;
  pkwiu: string;
  jm: string;
  quantity: number;
  amount: number;
  vat: Vat
}

export interface InvoiceDto {
  idInvoice: number;
  customer: string;
  invoiceNumber: string;
  sellDate: Date | null;
  invoiceDate:  Date | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentDeadline: number;
  paymentDate:  Date | null;
  otherInfo: string;
  invoiceItems: InvoiceItem[];
}

type Status = 'PAID' | 'TO_PAY' | 'OVER_DUE'
export interface PaymentStatus {
  name: Status
  viewName: string
}

export interface PaymentMethod {
  name: string
  viewName: string
}

export interface Vat {
  viewValue: string
  numberValue: number
  multiplier: number
}