<script setup lang="ts">
import OfficeButton from '@/components/OfficeButton.vue'
import {computed, type PropType, ref, watchEffect} from "vue";
import {useReservationStore} from "@/stores/reservation.ts";
import {type Bed, type Reservation, type ReservationBed} from "@/types/Room.ts";

const reservationStore = useReservationStore();

interface BedWithAvailability extends Bed {
  availability: string;
  overlapping: boolean;
}

interface ReservationWithAvailability extends Reservation {
  availability: string;
  overlapping: boolean;
}

const props = defineProps({
  reservations: {
    type: Array as PropType<Reservation[]>,
    required: true,
  },
})
const emit = defineEmits<{
  (e: 'save', checkout: Date): void
  (e: 'cancel'): void
}>()

const save = () => {
  emit('save', checkout.value!)
}

const cancel = () => {
  emit('cancel')
}
const checkout = ref<Date | null>(null)
const reservationsWithAvailability = ref<ReservationWithAvailability[]>([])
const searching = ref<boolean>(false)

const isSaveBtnDisabled = computed(() => {
  return !reservationsWithAvailability.value.every(res => res.availability === "available");
})

watchEffect(() => {
  reservationsWithAvailability.value = props.reservations?.map((res: Reservation) => ({
    ...res,
    availability: "",
    overlapping: false
  })) ?? [];
});

//
//SEARCH
//
async function checkAvailable() {
  searching.value = true;
  reset()
  for (const res of reservationsWithAvailability.value){
    console.log(res)
    res.availability = "checking";
    const beds: BedWithAvailability[] = res.beds.map((resBed: ReservationBed) => ({
      ...resBed.bed,
      availability: "",
      overlapping: false
    })) ?? [];

    const result = await checkAvailableBeds(beds, res.startDate!, res.id)
    res.availability = result ? "available" : "unavailable";
    res.overlapping = beds.some((bed: BedWithAvailability) => bed.overlapping);
  }
  searching.value = false;
}
async function checkAvailableBeds(beds: BedWithAvailability[], checkin: Date, reservationId: number) {
  const promises = beds.map(async (bed) => {
    bed.availability = "checking";
    const result = await reservationStore.checkBedAvailabilityFromDb(
        new Date(checkin),
        checkout.value!,
        bed.id,
        reservationId
    );
    const overlappingCheck = await reservationStore.isStartDateReservation(bed.id, checkout.value!);
    console.log("overlappingCheck",overlappingCheck)
    bed.availability = result ? "available" : "unavailable";
    bed.overlapping = overlappingCheck;
  });

  await Promise.all(promises); // Czekamy, aż wszystkie się zakończą

  return beds.every((bed: BedWithAvailability) => bed.availability === "available");
}

function reset(): void {
  reservationsWithAvailability.value.forEach(res => res.availability = "");
}
const minCheckoutDate = computed(() => {
  const validDates = props.reservations
      .map(r =>  new Date(r.endDate!))

  if (validDates.length === 0) {
    return undefined;
  }

   let latest = validDates.reduce((latest, current) =>
      current > latest ? current : latest
  );
  const nextDay = new Date(latest);
  nextDay.setDate(nextDay.getDate() + 1);

  checkout.value = nextDay;
  return nextDay;
});
</script>

<template>
  <Dialog :style="{ width: '550px' }" :modal="true">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-lg">Przedłużenie rezerwacji</span>
      </div>
    </template>
    <Fieldset legend="Data rezerwacji">
      <div class="flex flex-row gap-4 mt-4 justify-center">
        <FloatLabel variant="on">
          <DatePicker v-model="checkout" inputId="checkout" showIcon iconDisplay="input" date-format="yy-mm-dd"
                      @date-select="reset" :min-date="minCheckoutDate"/>
          <label for="checkout">Wymeldowanie</label>
        </FloatLabel>

        <OfficeButton btn-type="office-regular" type="button"
                      title="Sprawdz dostępność"
                      :btn-disabled="searching"
                      icon="pi pi-search"
                      :loading="searching"
                      @click="checkAvailable"/>
      </div>
    </Fieldset>

    <Fieldset legend="Rezerwacje">
      <div class="flex" v-for="(res) in reservationsWithAvailability" key="res.id">
        <div class="flex flex-col border-2 rounded w-fit px-5 mb-4">
          <div class="flex flex-row  items-center justify-center gap-2">

            <span class="text-xl py-2 text-color break-all whitespace-nowrap" style="word-break: break-word;">
              {{ res.number }},<wbr> łóżek: {{ res.beds.length }}
          </span>
          </div>

        </div>
        <Tag v-if="res.availability === 'checking'" class="mt-2 mb-6 ml-4 text-lg" severity="warning"
             value="..."></Tag>
        <Tag v-else-if="res.availability === 'available'" class="mt-2 mb-6 ml-4 text-lg" severity="success">
          <div class="flex gap-2 items-center">
            <span>Dostępne</span>
            <span class="pt-0.5" :class="{ 'pi pi-exclamation-circle' :res.overlapping}" title="Inna rezerwacja zaczyna się tego dnia."/>
          </div>
        </Tag>
        <Tag v-else-if="res.availability === 'unavailable'" class="mt-2 mb-6 ml-4 text-lg" severity="error"
             value="Niedostępne"></Tag>
      </div>
    </Fieldset>

    <template #footer>
      <div class="flex flex-row gap-3 justify-content-end">
        <OfficeButton
            text="Anuluj"
            btn-type="office-regular"
            @click="cancel"
            @abort="cancel"
        ></OfficeButton>
        <OfficeButton text="zatwierdz" btn-type="office-save" @click="save"
                      title="Możesz zatwierdzić tylko, gdy wszystkie łóżka są dostępne."
                      :btn-disabled="isSaveBtnDisabled"></OfficeButton>
      </div>
    </template>
  </Dialog>
</template>

