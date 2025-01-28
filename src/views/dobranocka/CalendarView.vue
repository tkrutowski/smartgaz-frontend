<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import TheMenuDobranocka from "../../components/dobranocka/TheMenuDobranocka.vue";
import moment from "moment";
import "moment/dist/locale/pl"; // Import lokalizacji polskiej
import {useRoomStore} from "@/stores/rooms.ts";
import {useReservationStore} from "@/stores/reservation.ts";
import type {Bed, Reservation, ReservationBed} from "@/types/Room.ts";
import {UtilsService} from "@/service/UtilsService.ts";

const reservationStore = useReservationStore();
const roomStore = useRoomStore();
moment.locale("pl"); // Ustawienie lokalizacji na język polski

const selectedDateRange = ref([moment().startOf('day').toDate(), moment().add(90, "days").toDate()]);

const dateRange = computed(() => {
  const [startDate, endDate] = selectedDateRange.value;
  console.log("COMPUTED", startDate, endDate);
  const dates = [];
  let currentDate = moment(startDate).toDate();
  while (currentDate <= moment(endDate).toDate()) {
    dates.push(moment(currentDate).toDate());
    currentDate = (moment(currentDate).add(1, "days").toDate());
  }
  return dates;
});

const getHederClass = (day: Date) => {
  return isWeekendOrHoliday(day) ? "bg-surface-300 dark:bg-surface-700" : null;
};

const getBodyClass = (bed: Bed) => {
  return roomStore.getRoomColorByBed(bed.id);
};
const getBodyOpacity = (day: Date) => {
  return isWeekendOrHoliday(day) ? .1 : .3;
};
const holidays = ref<string[]>([
  "2025-01-01", // Nowy Rok
  "2025-01-06", // święto Trzech Króli
  "2025-04-20", // Wielkanoc
  "2025-04-21", // Poniedziałek Wielkanocny
  "2025-05-01", // Święto Pracy
  "2025-05-03", // Święto Konstytucji 3 Maja
  "2025-06-08", // Zesłanie Ducha Świętego
  "2025-06-19", // Boże Ciało
  "2025-08-15", // Wniebowzięcie NMP
  "2025-11-01", // Wszystkich Świętych
  "2025-11-11", // Święto Niepodległości
  "2025-12-24", // Wigilia Bożego Narodzenia
  "2025-12-25", // Boże Narodzenie
  "2025-12-26" // Drugi dzień świąt Bożego Narodzenia
]);

function isWeekendOrHoliday(date: Date): boolean {
  const momentDate = moment(date);
  const isWeekend = momentDate.isoWeekday() === 6 || momentDate.isoWeekday() === 7;
  const isHoliday = holidays.value.includes(momentDate.format("YYYY-MM-DD"));
  return isWeekend || isHoliday;
}

function isBedReserved(bedToCheck: Bed, day: Date): boolean {
  return reservationStore.reservations.some((reservation: Reservation) => {
    if (!reservation.startDate || !reservation.endDate) {
      return false;
    }

    const start = moment(reservation.startDate).toDate().getTime();
    const end = moment(reservation.endDate).toDate().getTime();
    const checkDay = moment(day).toDate().getTime();
    return (
        checkDay >= start &&
        checkDay <= end &&
        reservation.beds.flatMap((resBed: ReservationBed) => resBed.bed)
            .some((bed: Bed) => bed.id === bedToCheck.id)
    );
  });
}

function isLastReservedDay(bedToCheck: Bed, day: Date): boolean {
  return reservationStore.reservations.some((reservation: Reservation) =>
      reservation.beds.flatMap((resBed: ReservationBed) => resBed.bed).some((b: Bed) => b.id === bedToCheck.id) &&
      new Date(reservation.endDate!).toDateString() === day.toDateString()
  );
}

function isFirstReservedDay(bedToCheck: Bed, day: Date): boolean {
  return reservationStore.reservations.some((reservation: Reservation) =>
      reservation.beds.flatMap((resBed: ReservationBed) => resBed.bed).some((b: Bed) => b.id === bedToCheck.id) &&
      new Date(reservation.startDate!).toDateString() === day.toDateString()
  );
}

//
//-----------------------------------------------------MOUNTED-------------------------------------------------------
//
onMounted(async () => {
  await roomStore.getRooms();
  await reservationStore.refreshReservations()
});

</script>

<template>
  <TheMenuDobranocka/>
  <Panel>
    <template #header>
      <div class="w-full flex flex-col md:flex-row justify-center items-center gap-4">

        <div class="flex">
          <p class="text-center text-xl md:text-2xl">Kalendarz</p>
          <div v-if="reservationStore.loadingReservation || roomStore.loadingRooms">
            <ProgressSpinner
                class="ml-3"
                style="width: 35px; height: 35px"
                stroke-width="5"
            />
          </div>
        </div>
        <FloatLabel variant="on" class="">
          <label for="on_label">Zakres dat</label>
          <DatePicker v-model="selectedDateRange" selectionMode="range" dateFormat="dd.mm.yy"/>
        </FloatLabel>
      </div>
    </template>
    <DataTable :value="roomStore.getAllBeds">
      <Column field="name" header="Łóżko" body-class="py-2">
        <template #body="{data, field}">
          <p class="">{{ data[field] }}</p>
        </template>
      </Column>
      <template v-for="(day) in dateRange" :key="day">
        <Column :header-class="getHederClass(day)" body-class="">
          <template #header>
            <div class="flex flex-col items-center justify-center w-full">
              <p>{{ moment(day).format("ddd") }}</p>
              <p>{{ moment(day).format("D") }}</p>
            </div>
          </template>
          <template #body="{data}" class="calendar">
            <div class="w-full h-full py-3"
                 :style="`background-color: ${UtilsService.hexToRgba(getBodyClass(data), getBodyOpacity(day))}`">

              <p :class="{'bg-red-600': isBedReserved(data, day),
                'cut-end': isLastReservedDay(data, day), 'cut-start': isFirstReservedDay(data, day)}">
                &nbsp;</p>
            </div>
          </template>
        </Column>
      </template>
    </DataTable>
  </Panel>
</template>

<style scoped>
::v-deep(.p-datatable-tbody > tr > td) {
  padding: 0 !important;
}

.cut-end {
  clip-path: polygon(0 0, 100% 0, 50% 100%, 0 100%);
}

.cut-start {
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 0 100%);
}
</style>