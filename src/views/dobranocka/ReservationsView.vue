<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {FilterMatchMode, FilterOperator} from '@primevue/core/api';
import type {Invoice, InvoiceItem, PaymentStatus} from "../../types/Invoice";
import OfficeButton from "../../components/OfficeButton.vue";
import router from "../../router";
import StatusButton from "../../components/StatusButton.vue";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";
import {useToast} from "primevue/usetoast";
import {useCustomerStore} from "../../stores/customers";
import {useReservationStore} from "@/stores/reservation.ts";
import {useInvoiceStore} from "../../stores/invoices";
import OfficeIconButton from "../../components/OfficeIconButton.vue";
import TheMenuDobranocka from "../../components/dobranocka/TheMenuDobranocka.vue";
import {UtilsService} from "../../service/UtilsService.ts";
import type {AxiosError, AxiosResponse} from "axios";
import type {DataTablePageEvent} from "primevue/datatable";
import {FinanceService} from "../../service/FinanceService.ts";
import {RentService} from "@/service/RentService.ts";
import {BedStatus, type Reservation, ReservationStatus} from "@/types/Room.ts";
import type {Customer} from "@/types/Customer.ts";


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


//---------------------------------------------STATUS CHANGE--------------------------------------------------
//
const showStatusChangeConfirmationDialog = ref<boolean>(false);
const confirmStatusChange = (reservation: Reservation) => {
  reservationTemp.value = reservation;
  showStatusChangeConfirmationDialog.value = true;
};
const changeStatusConfirmationMessage = computed(() => {
  // if (reservationTemp.value)
  //   return `Czy chcesz zmienić status faktury nr <b>${
  //       reservationTemp.value.invoiceNumber
  //   }</b> na <b>${
  //       reservationTemp.value.paymentStatus.name === "PAID"
  //           ? "Do zapłaty"
  //           : "Zapłacony"
  //   }</b>?`;
  return "No message";
});
const submitChangeStatus = async () => {
  console.log("submitChangeStatus()");
  if (reservationTemp.value) {
    let newStatus: PaymentStatus = {
      name: reservationTemp.value.paymentStatus.name === "PAID" ? "TO_PAY" : "PAID",
      viewName:
          reservationTemp.value?.paymentStatus.viewName !== "PAID"
              ? "Zapłacony"
              : "Do zapłaty",
    };
    await reservationStore.updateReservationStatusDb(reservationTemp.value.id, newStatus)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail:
                "Zaaktualizowano status rezerwacji.",
            life: 3000,
          });
        })
        .catch((reason: AxiosError) => {
          toast.add({
            severity: "error",
            summary: "Błąd podczas aktualizacji statusu",
            detail: reason.response.data.message,
            life: 5000,
          });
        })
  }

  showStatusChangeConfirmationDialog.value = false;
};

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
    return `Czy chcesz usunąc rezerwację użytkownika <b>${reservationTemp.value.customer.name}</b>?`;
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
            detail: reason.response.data.message,
            life: 5000,
          });
        })
    showDeleteConfirmationDialog.value = false;
  }
}


onMounted(async () => {
  if (customerStore.customers.length === 0) await customerStore.refreshCustomers();
  if (reservationStore.reservations.length === 0) await reservationStore.refreshReservations();
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
</script>


<template>
  <TheMenuDobranocka/>
  <ConfirmationDialog
      v-model:visible="showStatusChangeConfirmationDialog"
      :msg="changeStatusConfirmationMessage"
      @save="submitChangeStatus"
      @cancel="showStatusChangeConfirmationDialog = false"
  />

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
              :to="{ name: 'Invoice', params: { isEdit: 'false', invoiceId: 0 } }"
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

      <!--      STATUS -->
      <Column header="Status" field="reservationStatus" sortable :filterMenuStyle="{ width: '14rem' }"
                :show-filter-match-modes="false">
        <template #body="{ data }">
          <Tag :value="UtilsService.getEnumValueByKey(ReservationStatus, data.reservationStatus)"
               :severity="RentService.getSeverityReservation(data.reservationStatus)"/>
        </template>
        <template #filter="{ filterModel }">
          <MultiSelect v-model="filterModel.value" :options="Object.keys(ReservationStatus)" placeholder="Wybierz..."
                       :maxSelectedLabels="0" >
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
<!--            <OfficeIconButton-->
<!--                title="Edytuj fakturę"-->
<!--                icon="pi pi-file-edit"-->
<!--                @click="editItem(slotProps.data)"-->
<!--            />-->
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
        <div class="p-3">
          <p class="text-lg">Szczególy rezerwacji</p>
          <DataTable :value="slotProps.data.beds" size="small" dataKey="id">
            <!-- ROOM -->
            <Column header="Pokój" class="max-w-36">
              <template #body="{ data, field }">
                <p>{{ roomStore.getRoomByBed(data['id']).name }}</p>
              </template>
            </Column>

            <!-- BED -->
            <Column field="name" header="Łóżko">
            </Column>

            <!-- QUANTITY -->
            <Column header="Okres najmu">
              <template #body="{ data, field }">
                <p> {{ calculateRentPeriod }}</p>
              </template>
            </Column>

            <!-- AMOUNT NET-->
            <Column header="Cena netto">
              <template #body="{ data, field }">
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

          <p class="mt-2" style="text-align: center">
            <b>Info:</b> {{ slotProps.data.info }}
          </p>
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
