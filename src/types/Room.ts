import type {Customer} from "./Customer.ts";

export enum BedType {
  SINGLE = "pojedyńcze",
  DOUBLE = "podwójne"
}
export enum BedStatus {
  AVAILABLE = "Dostępny",
  BOOKED = "Zarezerwowany",
  OCCUPIED = "Zajęty",
  TO_CLEAN = "Do sprzątania",
  CLEANED = "Posprzątany",
  UNAVAILABLE = "Niedostępny"
}
export enum ReservationStatus {
  NO_PAYMENT = "Brak wpłaty",
  ADVANCE_PAID = "Wpłacony zadatek",
  FULLY_PAID = "Wpłacona całość",
  CANCELLED = "Anulowana",
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
  customer: Customer
  beds: ReservationBed[]
  startDate: Date
  endDate: Date
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