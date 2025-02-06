import type {Customer} from "./Customer.ts";

export interface Invoice {
  idInvoice: number;
  customer: Customer | null;
  invoiceNumber: string;
  sellDate: Date | null;
  invoiceDate:  Date | null;
  paymentDate:  Date | null;
  paymentMethod: PaymentMethod | undefined;
  paymentStatus: PaymentStatus;
  otherInfo: string;
  invoiceItems: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  idInvoice: number;
  name: string;
  pkwiu: string;
  unit: string;
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


export enum PaymentStatus {
  PAID = "Spłacony",
  TO_PAY = "Do zapłaty",
  OVER_DUE = "Przeterminowany",
  ALL = "Wszystkie"
}

export enum PaymentMethod {
  CASH = "gotówka",
  CASH_LATE = "gotówka terminowa",
  TRANSFER = "przelew",
}

export interface Vat {
  viewValue: string
  numberValue: number
  multiplier: number
}