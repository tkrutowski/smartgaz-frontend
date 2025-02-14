import type {Customer} from "./Customer.ts";

export interface Invoice {
  idInvoice: number;
  customer: Customer | null;
  number: string;
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
  number: string;
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
  PAID = "PAID",
  TO_PAY = "TO_PAY",
  OVER_DUE = "OVER_DUE",
  ALL = "ALL"
}

export enum PaymentMethod {
  CASH = "CASH",
  CASH_LATE = "CASH_LATE",
  TRANSFER = "TRANSFER",
}

export interface Vat {
  viewValue: string
  numberValue: number
  multiplier: number
}