<script setup lang="ts">
import {useRoomStore} from "@/stores/rooms.ts";
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import OfficeButton from "@/components/OfficeButton.vue";
import {useToast} from "primevue/usetoast";
import type {AxiosError} from "axios";
import TheMenuDobranocka from "@/components/dobranocka/TheMenuDobranocka.vue";
import {
  type Bed,
  BedStatus,
  BedType,
  type Reservation,
  type ReservationBed,
  ReservationStatus,
  type Room
} from "@/types/Room.ts";
import {UtilsService} from "@/service/UtilsService.ts";
import {useReservationStore} from "@/stores/reservation.ts";
import {useCustomerStore} from "@/stores/customers.ts";
import type {Customer} from "@/types/Customer.ts";
import moment from "moment";
import {RentService} from "@/service/RentService.ts";
import {Button} from "primevue";
import router from "@/router";
import ConfirmationDialog from "@/components/ConfirmationDialog.vue";

const customerStore = useCustomerStore();
const reservationStore = useReservationStore();
const roomStore = useRoomStore();
const toast = useToast();

const numberOfBeds = ref<number>(1)
const info = ref<string>("")
const availableBeds = ref<Map<string, Bed[]>>(new Map<string, Bed[]>())
const selectedBeds = ref<Bed[]>([])
const selectedCustomer = ref<Customer | null>(null);

const isSearchBtnDisabled = computed(() => {
  return (
      reservationStore.loadingReservation ||
      checkin.value == null || checkout.value == null || numberOfBeds.value <= 0 || calculateRentPeriod.value.toString().startsWith("-")
  );
});

const toggleBedSelection = (bed: Bed) => {
  if (selectedBeds.value.includes(bed)) {
    selectedBeds.value = selectedBeds.value.filter((b) => b.id !== bed.id);
  } else {
    selectedBeds.value.push(bed);
  }
};


//
//PAYMENT
//
const checkin = ref<Date | null>(null)
const previousCheckin = ref<Date | null>(null)
const checkout = ref<Date | null>(null)
const previousCheckout = ref<Date | null>(null)
const advance = ref<number>(0)
const deposit = ref<number>(0)

const calculateRentPeriod = computed(() => {
  if (checkin.value != null && checkout.value != null) {
    const start = moment(checkin.value);
    const end = moment(checkout.value);

    // Oblicz różnicę w pełnych miesiącach
    const months = end.diff(start, 'months');

    // Oblicz datę po dodaniu pełnych miesięcy
    const startAfterFullMonths = start.clone().add(months, 'months');

    // Oblicz pozostałe dni po uwzględnieniu pełnych miesięcy
    const days = end.diff(startAfterFullMonths, 'days');

    if (months > 0 && days === 0) {
      // Jeśli są pełne miesiące bez dodatkowych dni
      return `${UtilsService.getMonthLabel(months)}`;
    } else if (months > 0 && days > 0) {
      // Jeśli są pełne miesiące i dodatkowe dni
      return `${UtilsService.getMonthLabel(months)} i ${days} dni`;
    } else {
      // Jeśli nie ma pełnych miesięcy, tylko dni
      const totalDays = end.diff(start, 'days');
      return `${totalDays} dni`;
    }
  }
  return 0;
});
const calculateRentPeriodArray = computed(() => {
  if (checkin.value != null && checkout.value != null) {
    const start = moment(checkin.value);
    const end = moment(checkout.value);

    const months = end.diff(start, 'months');

    const startAfterFullMonths = start.clone().add(months, 'months');

    const days = end.diff(startAfterFullMonths, 'days');

    if (months > 0 && days === 0) {
      return [months, 0];
    } else if (months > 0 && days > 0) {
      return [months, days];
    } else {
      const totalDays = end.diff(start, 'days');
      return [0, totalDays];
    }
  }
  return [0, 0];
});

const calculateNet = ((item: Bed) => {
  if (item) {
    const perMonth: number = item.priceMonth * calculateRentPeriodArray.value[0]
    const perDay: number = item.priceDay * calculateRentPeriodArray.value[1]
    return perMonth + perDay
  }
  return 0
});
const calculateNetSum = (() => {
  return selectedBeds.value.reduce((acc, bed) => acc + calculateNet(bed), 0);
});


//
//SEARCH
//
function findAvailable() {
  reservationStore.getAvailableBedsFromDb(checkin.value!, checkout.value!)
      .then((rooms: Room[]) => {
        if (rooms.length === 0) {
          toast.add({
            severity: "warn",
            summary: "Potwierdzenie",
            detail: "Nie znaleziono wolnych łóżek.",
            life: 5000,
          });
        } else {
          rooms.sort((a, b) => a.name.localeCompare(b.name)).forEach((room: Room) => availableBeds.value.set(room.name, room.beds));
        }
      }).catch((reason: AxiosError) => {
    toast.add({
      severity: "error",
      summary: "Błąd podczas wyszukiwania łóżek.",
      detail: (reason?.response?.data as { message: string }).message,
      life: 5000,
    });
  })
}

//
// SAVE
//
const reservationInProgress = ref<boolean>(false);

function saveReservation() {
  reservationInProgress.value = true;
  const reservation: Reservation = {
    id: 0,
    customer: selectedCustomer.value,
    advance: advance.value,
    startDate: checkin.value,
    endDate: checkout.value,
    deposit: deposit.value,
    reservationStatus: advance.value === 0 ? ReservationStatus.NO_PAYMENT : (advance.value > 0 && advance.value < calculateNetSum()) ? ReservationStatus.ADVANCE_PAID : ReservationStatus.FULLY_PAID,
    info: info.value,
    beds: selectedBeds.value.map((item: Bed) => {
      const today = moment().startOf("day");
      const startDate = moment(checkin.value).startOf("day");
      const dto: ReservationBed = {
        id: 0,
        bed: {
          ...item,
          status: startDate.isSameOrBefore(today) ? BedStatus.OCCUPIED : item.status,
        },
        priceDay: item.priceDay,
        priceMonth: item.priceMonth
      }
      return dto
    })
  }
  reservationStore.addReservationDb(reservation)
      .then(() => {
        const today = moment().startOf("day");
        const startDate = moment(checkin.value).startOf("day");
        //update beds status if today
        if (startDate.isSameOrBefore(today)) {
          reservation.beds.flatMap((resBed: ReservationBed) => resBed.bed).forEach((item: Bed) => {
            item.status = BedStatus.OCCUPIED;
            roomStore.updateBedDb(item).then(() => {
              toast.add({
                severity: "info",
                summary: "Potwierdzenie",
                detail: "Zmieniono status łóżka na 'Zajęte'.",
                life: 3000,
              });
            }).catch((reason: AxiosError) => {
              toast.add({
                severity: "error",
                summary: "Błąd podczas dodawania rezerwacji.",
                detail: "Nie udało się zmienić statusu łóżka na 'Zajęte'",
                life: 5000,
              });
            })
          })
        }
        toast.add({
          severity: "success",
          summary: "Potwierdzenie",
          detail: "Dodano rezerwację.",
          life: 3000,
        });
        //reset
        reset();
        if (window.location.href.includes(router.resolve({name: 'ReservationSearch'}).href)) {
          const redirect = JSON.stringify({name: 'ReservationSearch'})
          router.push({path: '/refresh', query: {redirect: redirect}})
        }
      }).catch((reason: AxiosError) => {
    toast.add({
      severity: "error",
      summary: "Błąd podczas dodawania rezerwacji.",
      detail: (reason?.response?.data as { message: string }).message,
      life: 5000,
    });
  }).finally(() => {
    reservationInProgress.value = false
  })
}


//change price to all beds if first change
watch(
    () => selectedBeds.value[0]?.priceDay,
    (newPrice) => {
      if (newPrice !== undefined) {
        selectedBeds.value.forEach((bed) => {
          bed.priceDay = newPrice;
        });
      }
    }
);
watch(
    () => selectedBeds.value[0]?.priceMonth,
    (newPrice) => {
      if (newPrice !== undefined) {
        selectedBeds.value.forEach((bed) => {
          bed.priceMonth = newPrice;
        });
      }
    }
);
//
//-----------------------------------------------------MOUNTED-------------------------------------------------------
//
onMounted(async () => {
  roomStore.getRooms();
  customerStore.getCustomers();
});


const showErrorCustomer = () => {
  return selectedCustomer.value == null;
};
//----------------------------------------------------SCREEN SIZE---------------------------------------------
const isMd = ref<boolean>(false);

const updateScreenSize = () => {
  isMd.value = window.innerWidth >= 768; // `md` zaczyna się od 768px
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});

//reset
const showResetConfirmationDialog = ref<boolean>(false);
const confirmDeleteReservation = () => {
  if (selectedBeds.value.length > 0) {
    showResetConfirmationDialog.value = true;
  }
};

function submitReset() {
  reset()
  const redirect = JSON.stringify({name: 'ReservationSearch'})
  router.push({path: '/refresh', query: {redirect: redirect}})
}

function submitCancel() {
  showResetConfirmationDialog.value = false;
  if (previousCheckin.value != null) {
    checkin.value = previousCheckin.value;
    previousCheckin.value = null;
  }
  if (previousCheckout.value != null) {
    checkout.value = previousCheckout.value;
    previousCheckout.value = null;
  }
}

function reset() {
  console.log("Reset form")
  selectedCustomer.value = null;
  selectedBeds.value = [];
  availableBeds.value.clear();
}

watch(checkin, (newVal, oldVal) => {
  if (selectedBeds.value.length > 0)
    previousCheckin.value = oldVal;
  previousCheckout.value=null
})
watch(checkout, (newVal, oldVal) => {
  if (selectedBeds.value.length > 0)
    previousCheckout.value = oldVal;
  previousCheckin.value = null;
})
</script>

<template>
  <ConfirmationDialog
      v-model:visible="showResetConfirmationDialog"
      msg="Zmiana daty spowoduje zresetowanie formularza."
      label="zatwierdz"
      @save="submitReset"
      @cancel="submitCancel"
  />
  <TheMenuDobranocka/>
  <div class="flex flex-row gap-4 mt-4 justify-center">
    <FloatLabel variant="on">
      <DatePicker v-model="checkin" inputId="checkin" showIcon iconDisplay="input" date-format="yy-mm-dd"
                  @date-select="confirmDeleteReservation"/>
      <label for="checkin"> {{ isMd ? 'Data zameldowania' : 'Zameldowanie' }} </label>
    </FloatLabel>
    <FloatLabel variant="on">
      <DatePicker v-model="checkout" inputId="checkout" showIcon iconDisplay="input" date-format="yy-mm-dd"
                  @date-select="confirmDeleteReservation"/>
      <label for="checkout">{{ isMd ? 'Data wymeldowania' : 'Wymeldowanie' }}</label>
    </FloatLabel>

    <OfficeButton btn-type="office-regular" type="button" :text="isMd ? 'wyszukaj' : ''"
                  :btn-disabled="isSearchBtnDisabled"
                  icon="pi pi-search" :loading="reservationStore.loadingReservation"
                  @click="findAvailable"/>
  </div>

  <div class="flex justify-center w-full">

    <Stepper value="1" class="w-full max-w-screen-xl ">
      <StepList>
        <Step value="1">Wybierz łóżka</Step>
        <Step value="2" :disabled="selectedBeds.length === 0">Wybierz klienta</Step>
        <Step value="3" :disabled="selectedBeds.length === 0 || selectedCustomer == null">Ustal cenę</Step>
        <Step value="4" :disabled="selectedBeds.length === 0 || selectedCustomer == null">Podsumowanie</Step>
      </StepList>
      <StepPanels>
        <!--      STEP 1            -->
        <StepPanel v-slot="{ activateCallback }" value="1">
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
          <div class="flex pt-6 justify-end">
            <Button label="Następna" icon="pi pi-arrow-right" iconPos="right" :disabled="selectedBeds.length === 0"
                    @click="activateCallback('2')"/>
          </div>
        </StepPanel>


        <!--      STEP 2                  -->
        <StepPanel v-slot="{ activateCallback }" value="2">
          <div class="flex flex-col pt-4">
            <!-- ROW-1   CUSTOMER -->
            <div class="flex flex-row gap-4 justify-center">
              <div class="flex flex-col w-full md:w-56">
                <label class="ml-2" for="input-customer">Wybierz klienta:</label>
                <Select
                    id="input-customer"
                    v-model="selectedCustomer"
                    :invalid="showErrorCustomer()"
                    :options="customerStore.customers"
                    option-label="name"
                    required
                />
                <small class="text-red-500">{{
                    showErrorCustomer() ? "Pole jest wymagane." : "&nbsp;"
                  }}</small>
              </div>
              <div v-if="customerStore.loadingCustomer" class="mt-5">
                <ProgressSpinner
                    class=""
                    style="width: 35px; height: 35px"
                    stroke-width="5"
                />
              </div>
            </div>
          </div>
          <div class="flex pt-6 justify-between">
            <Button label="Poprzednia" severity="secondary" icon="pi pi-arrow-left"
                    @click="activateCallback('1')"/>
            <Button label="Następna" icon="pi pi-arrow-right" iconPos="right" :disabled="selectedCustomer == null"
                    @click="activateCallback('3')"/>
          </div>
        </StepPanel>

        <!--      STEP 3 - PRICES            -->
        <StepPanel v-slot="{ activateCallback }" value="3">
          <div class="flex flex-col pt-4 gap-4 items-center justify-center">
            <div class="flex flex-col border-2 rounded-2xl py-2 w-fit px-5"
                 :style="{borderColor: `${roomStore.getRoomColorByBed(bed.id)}`}"
                 v-for="(bed) in selectedBeds" key="bed.id">

              <div class="flex flex-row  items-center justify-center gap-2">
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

                <FloatLabel variant="on">
                  <InputNumber v-model="bed.priceDay" inputId="day" mode="currency" currency="PLN" locale="pl-PL"
                               @focus="UtilsService.selectText" fluid :min="0"/>
                  <label for="day" class="font-bold block mb-1 ml-1"> Cena netto/dzień </label>
                </FloatLabel>

                <FloatLabel variant="on">
                  <InputNumber v-model="bed.priceMonth" inputId="month" mode="currency" currency="PLN" locale="pl-PL"
                               fluid @focus="UtilsService.selectText" :min="0"/>
                  <label for="month" class="font-bold block mb-1 ml-1"> Cena netto/miesiąc </label>
                </FloatLabel>

              </div>
            </div>

            <div class="flex flex-col gap-5">

              <p class="mb-1 mt-3 text-left">Do zapłaty NETTO:
                <span class="text-red-500">{{ UtilsService.formatCurrency(calculateNetSum()) }} </span>
                ({{ calculateRentPeriod }})
              </p>
              <FloatLabel variant="on">
                <InputNumber v-model="advance" inputId="advance" mode="currency" currency="PLN" locale="pl-PL"
                             fluid @focus="UtilsService.selectText"/>
                <label for="advance" class="font-bold block mb-1 ml-1"> Zaliczka (opcjonalnia) </label>
              </FloatLabel>
              <FloatLabel variant="on">
                <InputNumber v-model="deposit" inputId="deposit" mode="currency" currency="PLN" locale="pl-PL"
                             fluid @focus="UtilsService.selectText"/>
                <label for="deposit" class="font-bold block mb-1 ml-1"> Depozyt (opcjonalnia) </label>
              </FloatLabel>
            </div>

          </div>
          <div class="flex pt-6 justify-between">
            <Button label="Poprzednia" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('2')"/>
            <Button label="Następna" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('4')"/>
          </div>
        </StepPanel>

        <!--      STEP 4-->
        <StepPanel v-slot="{ activateCallback }" value="4">
          <div class="flex flex-col pt-4 items-center justify-center">
            <div class="flex flex-col mb-4 gap-5 w-full md:w-1/3">
              <p class="text-left">
                <span class="text-sm">Klient:</span> {{
                  selectedCustomer ? selectedCustomer.name + ' ' + selectedCustomer.firstName : ''
                }}
              </p>
              <p class="text-left">
                <span class="text-sm">Okres najmu:</span> {{ moment(checkin).format("YYYY-MM-DD") }} -
                {{ moment(checkout).format("YYYY-MM-DD") }} ({{ calculateRentPeriod }})
              </p>
              <p class="text-left">Zaliczka:
                <span class="text-red-500"> {{ UtilsService.formatCurrency(advance) }}</span>
              </p>
              <p class="text-left">Depozyt:
                <span class="text-red-500"> {{ UtilsService.formatCurrency(deposit) }}</span>
              </p>
            </div>
            <Divider/>
            <DataTable :value="selectedBeds" size="small" dataKey="id" class="w-full md:w-1/3">
              <!-- ROOM -->
              <Column header="Pokój" class="max-w-36">
                <template #body="{ data }">
                  <p>{{ roomStore.getRoomByBed(data['id'])?.name }}</p>
                </template>
              </Column>

              <!-- BED -->
              <Column field="name" header="Łóżko">
              </Column>

              <!-- QUANTITY -->
              <Column header="Okres najmu">
                <template #body="{ }">
                  <p> {{ calculateRentPeriod }}</p>
                </template>
              </Column>

              <!-- AMOUNT NET-->
              <Column header="Cena netto">
                <template #body="{ data }">
                  <div style="text-align: center">
                    {{ UtilsService.formatCurrency(calculateNet(data)) }}
                  </div>
                </template>
              </Column>

              <template #empty>
                <span class="text-red-500">Uzupełnij dane..</span>
              </template>

              <ColumnGroup type="footer">
                <Row>
                  <Column
                      :colspan="3"
                      footer-style="text-align:right; padding-right: 8px;"
                  >
                    <template #footer>
                      <p class="font-semibold">RAZEM NETTO:</p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="font-semibold">
                        {{ UtilsService.formatCurrency(calculateNetSum()) }}
                      </p>
                    </template>
                  </Column>
                </Row>
              </ColumnGroup>
            </DataTable>
            <div class="flex flex-col w-full md:w-1/3 mt-3">
              <label class="ml-2 text-sm" for="input">Dodatkowe informacje:</label>
              <Textarea v-model="info" rows="4" cols="30" fluid/>
            </div>
          </div>
          <div class="pt-6">
            <div class="flex pt-6 justify-between">
              <Button label="Poprzednia" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('3')"/>
              <OfficeButton btn-type="office-save" label="Zarezerwuj" icon="pi pi-check" iconPos="right"
                            @click="saveReservation()" :btn-disabled="reservationInProgress"
                            :loading="reservationInProgress"/>
            </div>
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>
