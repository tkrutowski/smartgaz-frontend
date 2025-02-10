<script setup lang="ts">

import TheMenuDobranocka from "@/components/dobranocka/TheMenuDobranocka.vue";
import OfficeButton from "@/components/OfficeButton.vue";
import {computed, onMounted, ref} from "vue";
import type {AxiosError} from "axios";
import {useToast} from "primevue/usetoast";
import {useReservationStore} from "@/stores/reservation.ts";
import {useCustomerStore} from "@/stores/customers.ts";
import {useRoute} from "vue-router";
import {useRoomStore} from "@/stores/rooms.ts";
import {
  type Bed,
  BedStatus,
  BedType,
  type Reservation,
  type ReservationBed,
  ReservationStatus,
  type Room
} from "@/types/Room.ts";
import moment from "moment";
import {UtilsService} from "@/service/UtilsService.ts";
import OfficeIconButton from "@/components/OfficeIconButton.vue";
import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
import router from "@/router";
import {RentService} from "@/service/RentService.ts";
import EditReservationDatesDialog from "@/components/dobranocka/EditReservationDatesDialog.vue";

const route = useRoute();
const reservationStore = useReservationStore();
const customerStore = useCustomerStore();
const roomStore = useRoomStore();
const toast = useToast();

const btnSaveDisabled = ref<boolean>(false);
const btnShowBusy = ref<boolean>(false);
const reservation = ref<Reservation>({
  id: 0,
  customer: null,
  startDate: null,
  endDate: null,
  advance: 0,
  beds: [],
  deposit: 0,
  info: "",
  reservationStatus: ReservationStatus.NO_PAYMENT
});

const isSaveBtnDisabled = computed(() => {
  return (
      customerStore.loadingCustomer ||
      btnSaveDisabled.value
  );
});
//
//------------------------------------------NEW BED----------------------------------------------
//
const showAddNewBedsDialog = ref<boolean>(false);
const availableBeds = ref<Map<string, Bed[]>>(new Map<string, Bed[]>())
const selectedBeds = ref<Bed[]>([])
const toggleBedSelection = (bed: Bed) => {
  if (selectedBeds.value.includes(bed)) {
    selectedBeds.value = selectedBeds.value.filter((b) => b.id !== bed.id);
  } else {
    selectedBeds.value.push(bed);
  }
};

const findNewBeds = () => {
  reservationStore.getAvailableBedsFromDb(new Date(reservation.value.startDate!), new Date(reservation.value.endDate!))
      .then((rooms: Room[]) => {
        if (rooms.length === 0) {
          toast.add({
            severity: "warn",
            summary: "Potwierdzenie",
            detail: "Nie znaleziono wolnych łóżek.",
            life: 5000,
          });
        } else {
          const beds: number[] = reservation.value.beds.flatMap((bed: ReservationBed) => bed.bed.id)
          for (const room of rooms) {
            room.beds = room.beds.filter((bed: Bed) => !beds.includes(bed.id))
          }
          rooms.forEach((room: Room) => availableBeds.value.set(room.name, room.beds));
          showAddNewBedsDialog.value = true;
        }
      }).catch((reason: AxiosError) => {
    console.log(reason);
    toast.add({
      severity: "error",
      summary: "Błąd podczas wyszukiwania łóżek.",
      detail: (reason?.response?.data as { message: string }).message,
      life: 5000,
    });
  })
}

const addNewBeds = () => {
  showAddNewBedsDialog.value = false
  const newBeds: ReservationBed[] = selectedBeds.value.map((item: Bed) => {
    const dto: ReservationBed = {
      id: 0,
      bed: item,
      priceDay: item.priceDay,
      priceMonth: item.priceMonth
    }
    return dto
  })
  newBeds.forEach((bed: ReservationBed) => reservation.value.beds.push(bed));
}
//
//------------------------------------------EDIT RESERVATION----------------------------------------------
//
const submitted = ref(false);

async function updateReservation() {
  submitted.value = true;
  if (isNotValid()) {
    showError("Rezerwacja musi mieć łóżka");
  } else {
    btnSaveDisabled.value = true;
    btnShowBusy.value = true;
    await reservationStore.updateReservationDb(reservation.value)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Zaaktualizowano dane rezerwacji",
            life: 3000,
          });
          setTimeout(() => {
            btnSaveDisabled.value = false
            router.push({name: "Reservations"});
          }, 5000);
        }).catch((reason: AxiosError) => {
          toast.add({
            severity: "error",
            summary: "Błąd podczas aktualizacji rezerwacji.",
            detail: (reason?.response?.data as { message: string }).message,
            life: 5000,
          });
          btnSaveDisabled.value = false
        }).finally(() => {
          btnShowBusy.value = false;
        })
  }
  submitted.value = false;
}

const isNotValid = () => {
  return (
      reservation.value.beds.length === 0
  );
};
const showError = (msg: string) => {
  toast.add({
    severity: "error",
    summary: "Błędne dane",
    detail: msg,
    life: 5000,
  });
};
//
//------------------------------------------DELETE BED----------------------------------------------
//
const tempBed = ref<Bed | null>(null);
;
const showDeleteConfirmationDialog = ref<boolean>(false);
const confirmDeleteBed = (item: Bed) => {
  tempBed.value = item;
  showDeleteConfirmationDialog.value = true;
};

const deleteConfirmationMessage = computed(() => {
  if (tempBed.value)
    return `Czy chcesz usunąc łóżko <b>${tempBed.value.name}</b>?`;
  return "No message";
});


const submitDelete = async () => {
  console.log("submitDelete()");

  if (tempBed.value !== null) {
    reservation.value.beds = reservation.value.beds.filter(
        (resBed: ReservationBed) => resBed.bed.id !== tempBed.value!.id
    );
  }

  showDeleteConfirmationDialog.value = false;
};

//
//------------------------------------------EDIT RESERVATION DATES----------------------------------------------
//
const showEditReservationDatesDialog = ref<boolean>(false);
const submitDateChange = async (checkin: Date, checkout: Date) => {
  console.log("submitDateChange()", checkin, checkout);
  reservation.value.startDate = checkin;
  reservation.value.endDate = checkout;
  toast.add({
    severity: "info",
    summary: "Potwierdzenie",
    detail: "Zmieniono datę rezerwacji.",
    life: 4000,
  });

  showEditReservationDatesDialog.value = false;
};

//--------------------------------------------------MOUNTED------------------------
onMounted(async () => {
  if (customerStore.customers.length <= 1) {
    await customerStore.refreshCustomers()
  }
  if (roomStore.rooms.length === 0) {
    await roomStore.refreshRooms()
  }
  console.log("onMounted EDIT", route.params);
  btnSaveDisabled.value = true;
  const reservationId = Number(route.params.reservationId as string);
  reservationStore
      .getReservationFromDb(reservationId)
      .then((data: Reservation | null) => {
        if (data) {
          reservation.value = data;
          //todo dodatkowe pole adres w pobranym kliencie, na bekendzie ustawić transparent na getAddress
          reservation.value.customer = customerStore.getCustomerById(data.customer!.id)
        }
      })
      .catch((error: AxiosError) => {
        console.error("Błąd podczas pobierania rezerwacji:", error);
      })
      .finally(() => btnSaveDisabled.value = false)
});
</script>

<template>
  <TheMenuDobranocka/>
  <ConfirmationDialog
      v-model:visible="showDeleteConfirmationDialog"
      :msg="deleteConfirmationMessage"
      label="Usuń"
      @save="submitDelete"
      @cancel="showDeleteConfirmationDialog = false"
  />
  <EditReservationDatesDialog
      v-model:visible="showEditReservationDatesDialog"
      :checkin="moment(reservation.startDate!).format('YYYY-MM-DD')"
      :checkout="moment(reservation.endDate!).format('YYYY-MM-DD')"
      :beds="reservation.beds"
      :reservation-id="reservation.id"
      @save="submitDateChange"
      @cancel="showEditReservationDatesDialog = false"
  />
  <Panel class="mt-2">
    <template #header>
      <div class="flex flex-col md:flex-row w-full">
        <div class="flex gap-3 order-2 md:order-1">

          <OfficeIconButton
              title="Powrót do listy rezerwacji"
              icon="pi pi-fw pi-table"
              @click="() => router.push({ name: 'Reservations' })"
          />
          <OfficeButton btn-type="office-regular" label="ŁÓŻKO" icon="pi pi-plus" icon-pos="left" @click="findNewBeds"
                        :loading="reservationStore.loadingReservation"/>
        </div>
        <div class="flex w-full gap-2 justify-center items-center order-1 md:order-2">

          <p class="text-lg md:text-2xl  ">Rezerwacja:
            <span class="text-lg md:text-2xl text-primary "> {{ moment(reservation.startDate).format("DD-MM-YYYY") }} -
          {{ moment(reservation.endDate).format("DD-MM-YYYY") }}</span></p>
          <OfficeIconButton
              title="Zamień łóżko na inne"
              icon="pi pi-file-edit"
              @click="showEditReservationDatesDialog=true"
          />
        </div>
      </div>
    </template>
    <div class="flex flex-col w-full gap-3 justify-center items-center">

      <!-- ROW-1   CUSTOMER -->
      <FloatLabel variant="in">
        <Select
            id="input-customer"
            v-model="reservation.customer"
            :options="customerStore.customers"
            option-label="name"
            required
            :loading="customerStore.loadingCustomer"
            class="min-w-60 w-full md:w-fit"

        />
        <label for="input-customer">Wybierz klienta</label>
      </FloatLabel>


      <!--BEDS-->
      <div class="flex flex-col border-2 rounded-2xl py-2 w-fit px-5"
           :style="{borderColor: `${roomStore.getRoomColorByBed(bed.bed.id)}`}"
           v-for="(bed) in reservation.beds" key="bed.id">

        <div class="flex flex-col md:flex-row gap-2">
          <div class="flex flex-row items-center justify-center gap-2">
            <svg
                v-if="UtilsService.getEnumValueByKey(BedType ,bed.bed.type.toString() as keyof typeof BedType)  === BedType.SINGLE"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
                id="single-bed"
                class="w-12 h-12 fill-current text-black dark:text-white">
              <path
                  d="M53.69 38.13c.004-.044.014-.085.014-.13v-3a4.004 4.004 0 0 0-4-4h-.778V19a2.002 2.002 0 0 0-2-2H17.074a2.002 2.002 0 0 0-2 2v12h-.778a4.004 4.004 0 0 0-4 4v3c0 .045.01.086.013.13A1.998 1.998 0 0 0 9 40v8a1.972 1.972 0 0 0 .097.583A.986.986 0 0 0 9 49v2a1 1 0 0 0 2 0v-1h42v1a1 1 0 0 0 2 0v-2a.985.985 0 0 0-.097-.417A1.972 1.972 0 0 0 55 48v-8a1.998 1.998 0 0 0-1.31-1.87ZM17.075 19h29.852v12h-7.977a2.5 2.5 0 0 0-2.449-3h-9a2.5 2.5 0 0 0-2.45 3h-7.976ZM27 30.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5ZM12.296 35a2.002 2.002 0 0 1 2-2h35.408a2.002 2.002 0 0 1 2 2l.001 3h-39.41ZM11 48v-8h42l.001 8Z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
                 class="w-12 h-12 fill-current text-black dark:text-white">
              <path
                  d="M57.01953,28.4104V15.12793a3.31572,3.31572,0,0,0-3.168-3.43945H10.3291a3.3165,3.3165,0,0,0-3.16894,3.43945V28.366A3.89066,3.89066,0,0,0,4,32.18066V47.1123a.99974.99974,0,0,0,1,1H7.15723v3.19922a.99973.99973,0,0,0,1,1h4.4873a.99973.99973,0,0,0,1-1V48.1123H50.53516v3.19922a.99973.99973,0,0,0,1,1h4.4873a.99973.99973,0,0,0,1-1V48.1123H59a.99974.99974,0,0,0,1-1V32.18066A3.88725,3.88725,0,0,0,57.01953,28.4104ZM10.3291,13.68848H53.85156a1.32691,1.32691,0,0,1,1.168,1.43945V28.29248H50.96484v-4.519A3.0454,3.0454,0,0,0,47.916,20.73926H40.06249a3.04541,3.04541,0,0,0-3.04882,3.03418v4.519H27.03223v-4.519a3.04562,3.04562,0,0,0-3.04981-3.03418H16.12988a3.04541,3.04541,0,0,0-3.04883,3.03418v4.519H9.16016V15.12793A1.32692,1.32692,0,0,1,10.3291,13.68848Zm28.68457,14.604v-4.519a1.04285,1.04285,0,0,1,1.04882-1.03418H47.916a1.05566,1.05566,0,0,1,1.04882,1.03418v4.519Zm-23.93262,0v-4.519a1.04286,1.04286,0,0,1,1.04883-1.03418h7.85254a1.05588,1.05588,0,0,1,1.04981,1.03418v4.519Zm-7.19335,2c13.02183-.00009,29.03173.00007,42.07472,0h6.1499A1.89007,1.89007,0,0,1,58,32.18066v3.666H6v-3.666A1.89008,1.89008,0,0,1,7.8877,30.29248Zm3.75683,20.019H9.15723V48.1123h2.4873Zm43.37793,0h-2.4873V48.1123h2.4873Zm1.02179-4.19922c-1.332-.00154-40.8701.00111-43.378,0-1.40064-.00082-5.29017.00054-6.66626,0l0-8.26562H58V46.1123Z"></path>
            </svg>

            <span class="text-xl">{{ bed.bed.name }}</span>

            <FloatLabel variant="in">
              <InputNumber v-model="bed.priceDay" inputId="day" mode="currency" currency="PLN" locale="pl-PL"
                           @focus="UtilsService.selectText" :min="0" fluid/>
              <label for="day" class="font-bold block mb-1 ml-1"> Cena/dzień </label>
            </FloatLabel>

            <FloatLabel variant="in">
              <InputNumber v-model="bed.priceMonth" inputId="month" mode="currency" currency="PLN" locale="pl-PL"
                           fluid @focus="UtilsService.selectText" :min="0"/>
              <label for="month" class="font-bold block mb-1 ml-1"> Cena/miesiąc </label>
            </FloatLabel>
          </div>
          <div class="flex flex-row justify-center items-center">
            <OfficeIconButton
                title="Usuń łóżko z rezerwacji"
                icon="pi pi-trash"
                severity="danger"
                @click="confirmDeleteBed(bed.bed)"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-row gap-2">
        <FloatLabel variant="in">
          <InputNumber v-model="reservation.advance" inputId="advance" mode="currency" currency="PLN" locale="pl-PL"
                       fluid @focus="UtilsService.selectText"/>
          <label for="advance" class="font-bold block mb-1 ml-1"> Zaliczka (opcjonalnia) </label>
        </FloatLabel>
        <FloatLabel variant="in">
          <InputNumber v-model="reservation.deposit" inputId="deposit" mode="currency" currency="PLN" locale="pl-PL"
                       fluid @focus="UtilsService.selectText"/>
          <label for="deposit" class="font-bold block mb-1 ml-1"> Depozyt (opcjonalnia) </label>
        </FloatLabel>
      </div>

    </div>

    <template #footer>
      <div class="flex mt-5 justify-center">
        <OfficeButton
            text="zapisz"
            btn-type="office-save"
            type="submit"
            :is-busy-icon="btnShowBusy"
            :btn-disabled="isSaveBtnDisabled"
            @click="updateReservation"
        />
      </div>
    </template>
  </Panel>

  <Dialog v-model:visible="showAddNewBedsDialog" modal header="Wyberz łóżka...">
    <div v-for="([key, beds]) in Array.from(availableBeds.entries())" :key="key">
      <div class="flex flex-col md:flex-row pt-4 gap-4 items-center justify-center">
        <div class="flex flex-col border-2 rounded-2xl w-fit px-5 "
             :style="{borderColor: `${roomStore.getRoomColorByBed(bed.id)}`}"
             v-for="(bed) in beds" key="bed.id">
          <div class="flex flex-row  items-center justify-center gap-2">
            <Checkbox :checked="selectedBeds.includes(bed)"
                      @change="toggleBedSelection(bed)" :value="bed"/>
            <svg
                v-if="UtilsService.getEnumValueByKey(BedType ,bed.type.toString() as keyof typeof BedType) === BedType.SINGLE"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
                id="single-bed"
                class="w-12 h-12 fill-current text-black dark:text-white">
              <path
                  d="M53.69 38.13c.004-.044.014-.085.014-.13v-3a4.004 4.004 0 0 0-4-4h-.778V19a2.002 2.002 0 0 0-2-2H17.074a2.002 2.002 0 0 0-2 2v12h-.778a4.004 4.004 0 0 0-4 4v3c0 .045.01.086.013.13A1.998 1.998 0 0 0 9 40v8a1.972 1.972 0 0 0 .097.583A.986.986 0 0 0 9 49v2a1 1 0 0 0 2 0v-1h42v1a1 1 0 0 0 2 0v-2a.985.985 0 0 0-.097-.417A1.972 1.972 0 0 0 55 48v-8a1.998 1.998 0 0 0-1.31-1.87ZM17.075 19h29.852v12h-7.977a2.5 2.5 0 0 0-2.449-3h-9a2.5 2.5 0 0 0-2.45 3h-7.976ZM27 30.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5ZM12.296 35a2.002 2.002 0 0 1 2-2h35.408a2.002 2.002 0 0 1 2 2l.001 3h-39.41ZM11 48v-8h42l.001 8Z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
                 class="w-12 h-12 fill-current text-black dark:text-white">
              <path
                  d="M57.01953,28.4104V15.12793a3.31572,3.31572,0,0,0-3.168-3.43945H10.3291a3.3165,3.3165,0,0,0-3.16894,3.43945V28.366A3.89066,3.89066,0,0,0,4,32.18066V47.1123a.99974.99974,0,0,0,1,1H7.15723v3.19922a.99973.99973,0,0,0,1,1h4.4873a.99973.99973,0,0,0,1-1V48.1123H50.53516v3.19922a.99973.99973,0,0,0,1,1h4.4873a.99973.99973,0,0,0,1-1V48.1123H59a.99974.99974,0,0,0,1-1V32.18066A3.88725,3.88725,0,0,0,57.01953,28.4104ZM10.3291,13.68848H53.85156a1.32691,1.32691,0,0,1,1.168,1.43945V28.29248H50.96484v-4.519A3.0454,3.0454,0,0,0,47.916,20.73926H40.06249a3.04541,3.04541,0,0,0-3.04882,3.03418v4.519H27.03223v-4.519a3.04562,3.04562,0,0,0-3.04981-3.03418H16.12988a3.04541,3.04541,0,0,0-3.04883,3.03418v4.519H9.16016V15.12793A1.32692,1.32692,0,0,1,10.3291,13.68848Zm28.68457,14.604v-4.519a1.04285,1.04285,0,0,1,1.04882-1.03418H47.916a1.05566,1.05566,0,0,1,1.04882,1.03418v4.519Zm-23.93262,0v-4.519a1.04286,1.04286,0,0,1,1.04883-1.03418h7.85254a1.05588,1.05588,0,0,1,1.04981,1.03418v4.519Zm-7.19335,2c13.02183-.00009,29.03173.00007,42.07472,0h6.1499A1.89007,1.89007,0,0,1,58,32.18066v3.666H6v-3.666A1.89008,1.89008,0,0,1,7.8877,30.29248Zm3.75683,20.019H9.15723V48.1123h2.4873Zm43.37793,0h-2.4873V48.1123h2.4873Zm1.02179-4.19922c-1.332-.00154-40.8701.00111-43.378,0-1.40064-.00082-5.29017.00054-6.66626,0l0-8.26562H58V46.1123Z"></path>
            </svg>

            <span class="text-xl">{{ bed.name }}</span>
            <Tag :severity="RentService.getSeverity(bed.status.toString() as keyof typeof BedStatus)"
                 :value="UtilsService.getEnumValueByKey(BedStatus, bed.status.toString() as keyof typeof BedStatus)"></Tag>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <OfficeButton btn-type="office-regular" label="Anuluj" @click="showAddNewBedsDialog = false" autofocus/>
      <OfficeButton btn-type="office-regular" label="dodaj" @click="addNewBeds" autofocus/>
    </template>
  </Dialog>
</template>
