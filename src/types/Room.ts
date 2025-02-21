import type {Customer} from "./Customer.ts";

export enum BedType {
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE"
}
export enum BedStatus {
  AVAILABLE = "AVAILABLE",
  BOOKED = "BOOKED",
  OCCUPIED = "OCCUPIED",
  TO_CLEAN = "TO_CLEAN",
  CLEANED = "CLEANED",
  UNAVAILABLE = "UNAVAILABLE"
}
export enum ReservationStatus {
  NO_PAYMENT = "NO_PAYMENT",
  ADVANCE_PAID = "ADVANCE_PAID",
  FULLY_PAID = "FULLY_PAID",
  CANCELLED = "CANCELLED",
}
export interface Room {
  id: number
  name: string
  color: string
  beds: Bed[]
  info: string
}
export interface Bed {
  id: number
  name: string
  type: BedType
  status: BedStatus
  priceDay: number
  priceMonth: number
}

export interface Reservation {
  id: number
  number: string
  customer: Customer | null
  invoiceId: number;
  beds: ReservationBed[]
  startDate: Date | null
  endDate: Date | null
  reservationStatus:ReservationStatus
  advance: number
  deposit: number
  info: string
}

export interface ReservationBed {
  id: number
  bed: Bed
  priceDay: number
  priceMonth: number
}