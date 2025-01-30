<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {FilterMatchMode, FilterOperator} from '@primevue/core/api';
import {useRoomStore} from "../../stores/rooms.ts";
import OfficeButton from "../../components/OfficeButton.vue";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";
import {useToast} from "primevue/usetoast";
import {useCustomerStore} from "../../stores/customers";
import {useReservationStore} from "../../stores/reservation.ts";
import OfficeIconButton from "../../components/OfficeIconButton.vue";
import TheMenuDobranocka from "../../components/dobranocka/TheMenuDobranocka.vue";
import {UtilsService} from "../../service/UtilsService.ts";
import type {AxiosError} from "axios";
import type {DataTablePageEvent} from "primevue/datatable";
import {RentService} from "../../service/RentService.ts";
import {BedType, type Reservation, type ReservationBed, ReservationStatus} from "../../types/Room.ts";
import type {Customer} from "../../types/Customer.ts";
import moment from "moment/moment";

const roomStore = useRoomStore();
const customerStore = useCustomerStore();
const reservationStore = useReservationStore();
const toast = useToast();

//filter
const filters = ref();
const initFilters = () => {
  filters.value = {
    global: {value: null, matchMode: FilterMatchMode.CONTAINS},
    customer: {value: null, matchMode: FilterMatchMode.IN},
    startDate: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]},
    endDate: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]},
    advance: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.EQUALS}]},
    deposit: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.EQUALS}]},
    reservationStatus: {value: null, matchMode: FilterMatchMode.IN},
  };
}
initFilters();
const clearFilter = () => {
  initFilters();
};

const expandedRows = ref([]);
const reservationTemp = ref<Reservation>();


//
//-------------------------------------------------DELETE RESERVATION-------------------------------------------------
//
const showDeleteConfirmationDialog = ref<boolean>(false);
const confirmDeleteReservation = (reservation: Reservation) => {
  reservationTemp.value = reservation;
  showDeleteConfirmationDialog.value = true;
};
const deleteConfirmationMessage = computed(() => {
  if (reservationTemp.value)
    return `Czy chcesz usunąc rezerwację użytkownika <b>${reservationTemp.value.customer?.name}</b>?`;
  return "No message";
});
const submitDelete = async () => {
  console.log("submitDelete()");
  if (reservationTemp.value) {
    await reservationStore.deleteReservationDb(reservationTemp.value.id)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Usunięto rezerwację",
            life: 3000,
          });
        })
        .catch((reason: AxiosError) => {
          toast.add({
            severity: "error",
            summary: "Nie usunięto rezerwacji",
            detail: (reason?.response?.data as { message: string }).message,
            life: 5000,
          });
        })
    showDeleteConfirmationDialog.value = false;
  }
}

//
//-------------------------------------------------EDIT RESERVATION-------------------------------------------------
//
const editReservation = (item: Reservation) => {
  router.push({
    name: "Reservation",
    params: {reservationId: item.id},
  });
};


onMounted(async () => {
  if (customerStore.customers.length === 0) await customerStore.refreshCustomers();
  if (reservationStore.reservations.length <= 1) await reservationStore.refreshReservations();
  if (roomStore.rooms.length === 0) await roomStore.refreshRooms();
});

const handleRowsPerPageChange = (event: DataTablePageEvent) => {
  localStorage.setItem("rowsPerPageReservation", event.rows.toString());
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

const getCustomerLabel = (customer: Customer) => {
  return `${customer.name} ${customer.firstName}`;
}

const calculateNet = (item: ReservationBed, checkin: Date, checkout: Date) => {
  if (item) {
    const perMonth: number = item.priceMonth * calculateRentPeriodArray(checkin, checkout)[0]
    const perDay: number = item.priceDay * calculateRentPeriodArray(checkin, checkout)[1]
    return perMonth + perDay
  }
  return 0
};
const calculateNetSum = (reservation: Reservation) => {
  if (reservation.startDate && reservation.endDate) {
    return reservation.beds.reduce((acc: number, bed: ReservationBed) => acc + calculateNet(bed, reservation.startDate!, reservation.endDate!), 0);
  }
  return 0;
};
const calculateRentPeriodArray = (checkin: Date, checkout: Date) => {
  if (checkin != null && checkout != null) {
    const start = moment(checkin);
    const end = moment(checkout);

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
};

const calculateRentPeriod = (checkin: Date, checkout: Date) => {
  if (checkin != null && checkout != null) {
    const start = moment(checkin);
    const end = moment(checkout);

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
};
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

  <Panel>
    <template #header>
      <div class="w-full flex justify-center gap-4">
        <p class="text-center text-xl md:text-2xl">LISTA REZERWACJI</p>
        <div v-if="reservationStore.loadingReservation">
          <ProgressSpinner
              class="ml-3"
              style="width: 35px; height: 35px"
              stroke-width="5"
          />
        </div>
      </div>
    </template>
    <DataTable
        v-if="!reservationStore.loadingReservation"
        v-model:expanded-rows="expandedRows"
        v-model:filters="filters"
        :value="reservationStore.reservations"
        :loading="reservationStore.loadingReservation"
        striped-rows
        removable-sort
        paginator
        sort-field="invoiceNumber"
        :sort-order="-1"
        :rows="reservationStore.rowsPerPage"
        :rows-per-page-options="[5, 10, 20, 50]"
        table-style="min-width: 50rem"
        filter-display="menu"
        :global-filter-fields="['customer', 'startDate', 'endDate']"
        @page="handleRowsPerPageChange"
    >
      <template #header>
        <div class="flex justify-between">
          <router-link
              :to="{ name: 'ReservationSearch'}"
              style="text-decoration: none"
          >
            <OfficeButton v-if="isMd" class="" text="Nowa rezerwacja" btn-type="office-regular"/>
            <OfficeButton v-else class="" text="Nowa " btn-type="office-regular"/>
          </router-link>
          <div class="flex gap-4">
            <IconField icon-position="left">
              <InputIcon>
                <i class="pi pi-search"/>
              </InputIcon>
              <InputText class="!max-w-32"
                         v-model="filters['global'].value"
                         placeholder="wyszukaj..."
              />
            </IconField>
            <Button
                type="button"
                icon="pi pi-filter-slash"
                outlined size="small"
                title="Wyczyść filtry"
                @click="clearFilter()"
            />
          </div>
        </div>
      </template>

      <template #empty>
        <p v-if="!reservationStore.loadingReservation" class="text-red-500 text-lg">
          Nie znaleziono rezerwacji...
        </p>
      </template>

      <template #loading>
        <p class="text-primary text-lg">Ładowanie danych. Proszę czekać...</p>
      </template>

      <Column expander style="width: 5rem"/>
      <!--      CUSTOMER  -->
      <Column
          header="Nazwa klienta"
          :sortable="true"
          style="min-width: 12rem"
          filter-field="customer"
          :show-filter-match-modes="false"
      >
        <template #body="{data}">
          {{ getCustomerLabel(data.customer) }}
        </template>
        <template #filter="{ filterModel }">
          <MultiSelect
              v-model="filterModel.value"
              :options="customerStore.customers"
              :option-label="getCustomerLabel"
              placeholder="Wybierz..."
              class="p-column-filter"
              :maxSelectedLabels="0"
              style="min-width: 12rem; width: 12rem"
          />
        </template>
      </Column>

      <!--      START DATE-->
      <Column field="startDate" header="Data zameldowania" :sortable="true" data-type="date">
        <template #body="{ data }">
          {{ UtilsService.formatDateToString(data.startDate) }}
        </template>
        <template #filter="{ filterModel }">
          <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="yyyy-dd-mm"/>
        </template>
      </Column>

      <!--      END DATE-->
      <Column field="endDate" header="Data wymeldowania" :sortable="true" data-type="date">
        <template #body="{ data }">
          {{ UtilsService.formatDateToString(data.endDate) }}
        </template>
        <template #filter="{ filterModel }">
          <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="yyyy-dd-mm"/>
        </template>
      </Column>

      <!--      ADVANCE-->
      <Column field="advance" header="Zaliczka" style="min-width: 120px" dataType="numeric">
        <template #body="{data, field}">
          {{ UtilsService.formatCurrency(data[field]) }}
        </template>
        <template #filter="{ filterModel }">
          <InputNumber v-model="filterModel.value" mode="currency" currency="PLN" locale="pl-PL"/>
        </template>
      </Column>

      <!--      DEPOSIT-->
      <Column field="deposit" header="Depozyt" style="min-width: 120px" dataType="numeric">
        <template #body="{data, field}">
          {{ UtilsService.formatCurrency(data[field]) }}
        </template>
        <template #filter="{ filterModel }">
          <InputNumber v-model="filterModel.value" mode="currency" currency="PLN" locale="pl-PL"/>
        </template>
      </Column>

      <!-- AMOUNT NET -->
      <Column header="Wartość" style="min-width: 120px" dataType="numeric">
        <template #body="{data}">
          {{ UtilsService.formatCurrency(calculateNetSum(data)) }}
        </template>
      </Column>

      <!--      STATUS -->
      <Column header="Status" field="reservationStatus" sortable :filterMenuStyle="{ width: '14rem' }"
              :show-filter-match-modes="false">
        <template #body="{ data }">
          <Tag :value="UtilsService.getEnumValueByKey(ReservationStatus, data.reservationStatus)"
               :severity="RentService.getSeverityReservation(data.reservationStatus)"/>
        </template>
        <template #filter="{ filterModel }">
          <MultiSelect v-model="filterModel.value" :options="Object.keys(ReservationStatus)" placeholder="Wybierz..."
                       :maxSelectedLabels="0">
            <template #option="slotProps">
              <Tag :value="UtilsService.getEnumValueByKey(ReservationStatus, slotProps.option)"
                   :severity="RentService.getSeverityReservation(slotProps.option)"/>
            </template>
          </MultiSelect>
        </template>
      </Column>

      <!--             STATUS,   EDIT, DELETE-->
      <Column header="Akcja" :exportable="false" style="min-width: 8rem">
        <template #body="slotProps">
          <div class="flex flex-row gap-1 justify-content-end">
            <!--            <OfficeIconButton-->
            <!--                title="Zmień status"-->
            <!--                icon="pi pi-wrench"-->
            <!--                @click="confirmStatusChange(data)"-->
            <!--               disabled-->
            <!--            />-->
            <OfficeIconButton
                title="Edytuj rezerwację"
                icon="pi pi-file-edit"
                @click="editReservation(slotProps.data)"
            />
            <OfficeIconButton
                title="Usuń rezerwację"
                icon="pi pi-trash"
                severity="danger"
                @click="confirmDeleteReservation(slotProps.data)"
            />
          </div>
        </template>
      </Column>
      <template #expansion="slotProps">
        <div class="flex flex-col pt-4 gap-4 items-center justify-center">
          {{ slotProps.data }}
          <div class="flex flex-col border-2 rounded-2xl py-2 w-fit px-5"
               :style="{borderColor: `${roomStore.getRoomColorByBed(bed.bed.id)}`}"
               v-for="(bed) in slotProps.data.beds" key="bed.id">

            <div class="flex flex-row  items-center justify-center gap-2">
              <svg v-if="UtilsService.getEnumValueByKey(BedType ,bed.bed.type) === BedType.SINGLE"
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

              <FloatLabel variant="on">
                <InputNumber v-model="bed.priceDay" inputId="day" mode="currency" currency="PLN" locale="pl-PL"
                             @focus="UtilsService.selectText" fluid readonly/>
                <label for="day" class="font-bold block mb-1 ml-1"> Cena netto/dzień </label>
              </FloatLabel>

              <FloatLabel variant="on">
                <InputNumber v-model="bed.priceMonth" inputId="month" mode="currency" currency="PLN" locale="pl-PL"
                             fluid @focus="UtilsService.selectText" readonly/>
                <label for="month" class="font-bold block mb-1 ml-1"> Cena netto/miesiąc </label>
              </FloatLabel>

            </div>
          </div>

          <div class="flex flex-col gap-5">
            <p class="mb-1 mt-3 text-left">Okres wynajmu:
              <span class="text-red-500 text-xl ml-2">{{
                  calculateRentPeriod(slotProps.data.startDate, slotProps.data.endDate)
                }} </span>
            </p>

            <p class="mb-1 mt-3 text-left">Do zapłaty NETTO:
              <span class="text-red-500 text-xl ml-2">{{
                  UtilsService.formatCurrency(calculateNetSum(slotProps.data))
                }} </span>
            </p>
          </div>

        </div>
      </template>
    </DataTable>
  </Panel>
</template>

<style scoped>
.p-datatable .p-datatable-tbody > tr > td {
  text-align: center !important;
}
</style>
