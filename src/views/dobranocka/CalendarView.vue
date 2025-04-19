<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import TheMenuDobranocka from "@/components/dobranocka/TheMenuDobranocka.vue";
import moment from "moment";
import "moment/dist/locale/pl"; // Import lokalizacji polskiej
import {useRoomStore} from "@/stores/rooms.ts";
import {useReservationStore} from "@/stores/reservation.ts";
import type {Bed, Reservation, ReservationBed} from "@/types/Room.ts";
import {UtilsService} from "@/service/UtilsService.ts";
import ReservationInfoDialog from "@/components/dobranocka/ReservationInfoDialog.vue";
import OfficeIconButton from "@/components/OfficeIconButton.vue";
import ExtendReservationsByEndDateDialog from "@/components/dobranocka/ExtendReservationsByEndDateDialog.vue";
import {useToast} from "primevue/usetoast";
import router from "@/router";
import type {MenuItem} from "primevue/menuitem";

const toast = useToast();
const reservationStore = useReservationStore();
const roomStore = useRoomStore();
moment.locale("pl"); // Ustawienie lokalizacji na język polski

const selectedDateRange = ref([moment().startOf('day').subtract(30, "days").toDate(), moment().add(90, "days").toDate()]);

const scrollHeight = ref("800px");

function calculateTableHeight() {
  const windowHeight = window.innerHeight;
  const menuHeight = 200;

  // Pobranie rzeczywistej wysokości nagłówka tabeli
  const tableHeader = document.querySelector(".p-datatable-thead");
  const tableHeaderHeight = tableHeader ? tableHeader.clientHeight : 50; // Domyślnie 50px

  const availableHeight = windowHeight - menuHeight - tableHeaderHeight;
  scrollHeight.value = availableHeight < 350 ? '350px' : `${availableHeight}px`;
}

//
function isToday(day: string | Date): boolean {
  return moment(day).isSame(moment(), "day");
}


const dateRange = computed(() => {
  const [startDate, endDate] = selectedDateRange.value;
  const dates = [];
  let currentDate = moment(startDate).toDate();
  while (currentDate <= moment(endDate).toDate()) {
    dates.push(moment(currentDate).toDate());
    currentDate = (moment(currentDate).add(1, "days").toDate());
  }
  return dates;
});

const getHeaderClass = (day: Date) => {
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

function isSecondReservedDay(bedToCheck: Bed, day: Date): boolean {
  return reservationStore.reservations.some((reservation: Reservation) =>
      reservation.beds
          .flatMap((resBed: ReservationBed) => resBed.bed)
          .some((b: Bed) => b.id === bedToCheck.id) &&
      moment(reservation.startDate).add(1, 'days').isSame(moment(day), 'day')
  );
}

function getReservation(bed: Bed, date: Date): Reservation | undefined {
  return reservationStore.reservations.find((reservation: Reservation) =>
      reservation.beds.some((resBed: ReservationBed) => resBed.bed.id === bed.id) &&
      moment(date).isBetween(moment(reservation.startDate), moment(reservation.endDate), 'day', '[]')
  );
}

function getReservationLength(bed: Bed, date: Date): number {
  const reservation = reservationStore.reservations.find((reservation: Reservation) =>
      reservation.beds
          .flatMap((resBed: ReservationBed) => resBed.bed)
          .some((b: Bed) => b.id === bed.id) &&
      moment(date).isBetween(moment(reservation.startDate), moment(reservation.endDate), 'day', '[]')
  );
  if (!reservation) return 1;

  const start = moment(reservation.startDate);
  const end = moment(reservation.endDate);
  return end.diff(start, 'days') - 1;
}

//display current day in the table
const dataTableRef = ref(null);
const todayIndex = ref<number>(0);

const scrollToToday = () => {
  if (dataTableRef.value) {
    const columns = (dataTableRef.value as any).$el.querySelectorAll(".p-datatable-tbody > tr:first-child > td ");
    if (columns[todayIndex.value - 1]) { //-1 żeby było bardziej widoczne
      columns[todayIndex.value - 1].scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
    }
  }
};

function isContinuation(bed: Bed, date: Date): string {
  const currentReservation = getReservation(bed, date);
  if (!currentReservation) {
    return "";
  }
  const found = reservationStore.reservations.some(prevReservation =>
      prevReservation.customer?.id === currentReservation.customer?.id &&
      prevReservation.beds.length === currentReservation.beds.length &&
      moment(currentReservation.startDate).isSame(prevReservation.endDate)
  )
  return found ? " - kontynuacja" : ""
}

//
//-----------------------------------------------------MOUNTED-------------------------------------------------------
//
onMounted(async () => {
  await roomStore.getRooms();
  await reservationStore.refreshReservations()
  calculateTableHeight();
  window.addEventListener("resize", calculateTableHeight);

  todayIndex.value = dateRange.value.findIndex(day => moment(day).isSame(moment(), "day"));
  nextTick(() => {
    scrollToToday();
  });

});
onBeforeUnmount(() => {
  window.removeEventListener("resize", calculateTableHeight);
});

//display INFO
const showReservationInfoDialog = ref<boolean>(false);
const reservationInfo = ref<Reservation | undefined>(undefined);

function displayInfo(bed: Bed, date: Date) {
  const reservation = getReservation(bed, date);
  if (reservation) {
    reservationInfo.value = reservation;
    showReservationInfoDialog.value = true;
  }
}

function getRoomShortName(roomName: string | undefined) {
  if (roomName) {
    const index = roomName.indexOf(" - ");
    return index !== -1 ? roomName.substring(0, index).trim() : roomName.trim();
  }
}

// selected rows
const showExtendReservationsDialog = ref<boolean>(false);
const selectedReservations = ref<Set<Reservation>>(new Set());

//---------------------------------------------------MENU------------------------------------
const menuRef = ref();
const menuItems = computed(() => {
  const reservationItems: MenuItem[] = [];
  if (selectedReservation.value && selectedReservations.value.has(selectedReservation.value)) {
    reservationItems.push({
      label: 'Odznacz rezerwacje',
      icon: 'pi pi-stop',
      disabled: !selectedReservation.value,
      command: () => selectedReservations.value.delete(selectedReservation.value!)
    });
  } else {
    reservationItems.push({
      label: 'Zaznacz rezerwacje',
      icon: 'pi pi-check-square',
      disabled: selectedReservation.value == null,
      command: () => selectedReservations.value.add(selectedReservation.value!),
    });
  }
  reservationItems.push({
    separator: true
  });
  reservationItems.push({
    label: 'Przedłuż',
    icon: 'pi pi-sign-in',
    disabled: selectedReservations.value.size === 0 && selectedReservation.value === null,
    command: () => {
      if (selectedReservations.value.size === 0 && selectedReservation.value !== null) {
        selectedReservations.value.add(selectedReservation.value);
      }
      showExtendReservationsDialog.value = true
    },
  });
  reservationItems.push({
    label: 'Wystaw fakturę',
    icon: 'pi pi-dollar',
    disabled: ((selectedReservation.value !== null && selectedReservation.value.invoiceId !== null) || !isReservationSelectedForOneCustomer.value),
    command: () => {
      selectedReservations.value.add(selectedReservation.value!)
      reservationStore.selectedReservations = Array.from(selectedReservations.value);
      router.push({
        name: "Invoice",
        params: {isEdit: "false", invoiceId: -1},
      });
    },
  });
  reservationItems.push({
    label: 'Zmień status',
    icon: 'pi pi-th-large',
    items: [
      {
        label: 'Do sprzątania',
        disabled: true

      },
      {
        label: 'Posprzątany',
        disabled: true
      },
      {
        label: 'Niedostępny',
        disabled: true
      }
    ],
  });
  reservationItems.push({
    separator: true
  });

  return reservationItems
});
const selectedReservation = ref<Reservation | null>(null)

function onRightClick(event: Event, bed: Bed, date: Date) {
  const reservation = getReservation(bed, date);
  if (reservation) {
    selectedReservation.value = reservation;
  }
  menuRef.value.show(event)
}

function isReservationSelected(bedToCheck: Bed, date: Date): boolean {
  const reservation = getReservation(bedToCheck, date);
  if (reservation) {
    return (selectedReservations.value.has(reservation) || (selectedReservation.value !== null  && selectedReservation.value.id === reservation.id))
  } else {
    return false;
  }
}

const isReservationSelectedForOneCustomer = computed(() => {
  const iterator = selectedReservations.value.values();
  const first = iterator.next().value;

  if (!first) return true;

  for (const reservation of iterator) {
    if (reservation.customer?.id !== first.customer?.id) {
      return false;
    }
  }

  if (selectedReservation.value !== null){
       return selectedReservation.value.customer?.id === first.customer?.id
  }

  return true;
})

//-----------------------------------------EXTEND RESERVATION
const submitExtend = async (checkout: Date) => {
  for (const reservation of selectedReservations.value) {
    if (reservation.invoiceId) {
      reservation.startDate = moment(reservation.endDate).toDate();
      reservation.endDate = checkout;
      reservation.advance = 0;
      reservation.deposit = 0;
      reservation.id = 0;
      reservation.invoiceId = null;
      reservation.beds.forEach(bed => bed.id = 0)
      const newNumber = await reservationStore.findNewReservationNumber(moment().year());
      reservation.number = moment().year() + "/" + newNumber;
      reservationStore.addReservationDb(reservation)
          .then(() => {
            toast.add({
              severity: "info",
              summary: "Potwierdzenie",
              detail: "Dodano nową rezerwację.",
              life: 4000,
            });
            const redirect = JSON.stringify({name: 'Calendar'})
            router.push({path: '/refresh', query: {redirect: redirect}})
          })
    } else {
      reservation.endDate = checkout;
      reservationStore.updateReservationDb(reservation)
          .then(() => {
            toast.add({
              severity: "info",
              summary: "Potwierdzenie",
              detail: "Przedłużono rezerwację do " + moment(checkout).format('YYYY-MM-DD'),
              life: 4000,
            });
          })
    }
  }
  showExtendReservationsDialog.value = false;
};
</script>

<template>
  <TheMenuDobranocka/>
  <ReservationInfoDialog
      v-model:visible="showReservationInfoDialog"
      :reservation="reservationInfo!"
      @ok="showReservationInfoDialog = false"
  />
  <ExtendReservationsByEndDateDialog
      v-model:visible="showExtendReservationsDialog"
      :reservations="[...selectedReservations]"
      @cancel="showExtendReservationsDialog = false"
      @save="submitExtend"
  />
  <Panel>
    <template #header>
      <div class="w-full flex flex-col md:flex-row justify-center items-center gap-4">
        <FloatLabel variant="on" class="">
          <label for="on_label">Zakres dat</label>
          <DatePicker v-model="selectedDateRange" selectionMode="range" dateFormat="dd.mm.yy"/>
        </FloatLabel>
        <div v-if="reservationStore.loadingReservation || roomStore.loadingRooms">
          <ProgressSpinner
              class="ml-3"
              style="width: 35px; height: 35px"
              stroke-width="5"
          />
        </div>
      </div>
    </template>
    <ContextMenu ref="menuRef" :model="menuItems" @hide="selectedReservation = null"/>
    <DataTable v-if="!reservationStore.loadingReservation && !roomStore.loadingRooms" ref="dataTableRef"
               :value="roomStore.getAllBeds" scrollable :scrollHeight="scrollHeight">
      <template #empty><p class="text-lg text-red-500">Nie znaleziono rezerwacji.</p></template>
      <Column field="name" frozen style="z-index: 7">
        <template #header>
          <OfficeIconButton icon="pi pi-home" @click="scrollToToday()"/>
        </template>
        <template #body="{data}">
          <p class="h-full py-3 pr-2 text-nowrap"
             :style="`background-color: ${UtilsService.hexToRgba(getBodyClass(data), .3)}`">
            {{ getRoomShortName(roomStore.getRoomByBed(data.id)?.name) }} / {{ data.name }}
          </p>
        </template>
      </Column>
      <template v-for="(day) in dateRange" :key="day">
        <Column :header-class="getHeaderClass(day)" body-class="">
          <template #header>
            <div class="flex flex-col items-center justify-center w-full"
                 :class="{'bg-green-600 rounded-lg text-white font-bold px-2': isToday(day)}">
              <p>{{ moment(day).format("ddd") }}</p>
              <p>{{ moment(day).format("D") }}.{{ moment(day).format("MM") }}</p>
            </div>
          </template>
          <template #body="{data}">
            <div class="w-full h-full py-3 "
                 :style="`background-color: ${UtilsService.hexToRgba(getBodyClass(data), getBodyOpacity(day))}`"
                 @contextmenu.prevent="onRightClick($event, data, day)">

              <p class="relative" :class="{
                'bg-red-600 hover:cursor-pointer': isBedReserved(data, day),
                'cut-end': isLastReservedDay(data, day) && !isFirstReservedDay(data, day),
                'cut-start': isFirstReservedDay(data, day) && !isLastReservedDay(data, day),
                'cut-both': isFirstReservedDay(data, day) && isLastReservedDay(data, day),
                '!bg-blue-400': isReservationSelected(data, day)
                }"
                 @click="displayInfo(data, day)"
              >&emsp;
                <span v-if="isSecondReservedDay(data, day)"
                      class=" absolute left-0 top-0 z-[6] text-white whitespace-nowrap text-center"
                      @click="displayInfo(data, day)"
                      :style="{ width: getReservationLength(data, day) * 70 + 'px' }"
                >{{ getReservation(data, day)?.customer?.name }} {{ isContinuation(data, day) }}</span>
              </p>
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
  /*clip-path: polygon(0 0, 100% 0, 50% 100%, 0 100%);*/
  clip-path: polygon(0 0, 50% 0, 100% 50%, 50% 100%, 0 100%);
}

.cut-start {
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 0 50%);
  /*clip-path: polygon(50% 0, 100% 0, 100% 100%, 0 100%);*/
}

.cut-both {
  /*clip-path: polygon(0 0, 50% 50%, 100% 0, 100% 100%, 50% 50%, 0 100%);*/
  clip-path: polygon(0 0, 50% 50%, 100% 0, 100% 100%, 50% 50%, 0 100%);
}
</style>