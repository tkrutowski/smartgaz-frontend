export type BedType = 'SINGLE' | 'DOUBLE'
export interface Room {
  id: number
  name: string
  color: string
  beds: BedType[]
  price: number
  info: string
}
