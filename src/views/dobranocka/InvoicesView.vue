<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {FilterMatchMode, FilterOperator} from '@primevue/core/api';
import {type Invoice, type InvoiceItem, PaymentMethod, type PaymentStatus} from "../../types/Invoice";
import OfficeButton from "../../components/OfficeButton.vue";
import router from "../../router";
import StatusButton from "../../components/StatusButton.vue";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";
import {useToast} from "primevue/usetoast";
import {useCustomerStore} from "../../stores/customers";

const customerStore = useCustomerStore();
import {useInvoiceStore} from "../../stores/invoices";
import OfficeIconButton from "../../components/OfficeIconButton.vue";
import TheMenuDobranocka from "../../components/dobranocka/TheMenuDobranocka.vue";
import {UtilsService} from "../../service/UtilsService.ts";
import type {AxiosError, AxiosResponse} from "axios";
import type {DataTablePageEvent} from "primevue/datatable";
import {FinanceService} from "../../service/FinanceService.ts";
import type {Customer} from "@/types/Customer.ts";

const invoiceStore = useInvoiceStore();
const toast = useToast();

//filter
const filters = ref();
const initFilters = () => {
  filters.value = {
    global: {value: null, matchMode: FilterMatchMode.CONTAINS},
    customer: {value: null, matchMode: FilterMatchMode.IN},
    sellDate: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]},
    invoiceDate: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]},
    paymentDate: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]},
    amount: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.EQUALS}]},
    invoiceNumber: {value: null, matchMode: FilterMatchMode.CONTAINS},
  };
}
initFilters();
const clearFilter = () => {
  initFilters();
};

const expandedRows = ref([]);
const invoiceTemp = ref<Invoice>();

const calculateTotalGross = ((item: InvoiceItem) => {
  if (item && item.vat) {
    return item.amount * item.quantity * item.vat.multiplier
  }
  return 0
});
const calculateVatAmount = ((item: InvoiceItem) => {
  if (item) {
    return calculateTotalGross(item) - (item.amount * item.quantity)
  }
  return 0
});

//---------------------------------------------STATUS CHANGE--------------------------------------------------
//
const showStatusChangeConfirmationDialog = ref<boolean>(false);
const confirmStatusChange = (invoice: Invoice) => {
  invoiceTemp.value = invoice;
  showStatusChangeConfirmationDialog.value = true;
};
const changeStatusConfirmationMessage = computed(() => {
  if (invoiceTemp.value)
    return `Czy chcesz zmienić status faktury nr <b>${
        invoiceTemp.value.invoiceNumber
    }</b> na <b>${
        invoiceTemp.value.paymentStatus === "PAID"
            ? "Do zapłaty"
            : "Zapłacony"
    }</b>?`;
  return "No message";
});
const submitChangeStatus = async () => {
  console.log("submitChangeStatus()");
  if (invoiceTemp.value) {
    let newStatus: PaymentStatus = invoiceTemp.value.paymentStatus === "PAID" ? "TO_PAY" : "PAID";
    await invoiceStore.updateInvoiceStatusDb(invoiceTemp.value.idInvoice, newStatus)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail:
                "Zaaktualizowano status faktury nr: " +
                invoiceTemp.value?.invoiceNumber,
            life: 3000,
          });
        })
        .catch((reason: AxiosError) => {
          toast.add({
            severity: "error",
            summary: reason.message,
            detail: "Błąd podczas aktualizacji statusu faktury nr: " +
                invoiceTemp.value?.invoiceNumber,
            life: 5000,
          });
        })
  }

  showStatusChangeConfirmationDialog.value = false;
};

//
//-------------------------------------------------DELETE INVOICE-------------------------------------------------
//
const showDeleteConfirmationDialog = ref<boolean>(false);
const confirmDeleteInvoice = (invoice: Invoice) => {
  invoiceTemp.value = invoice;
  showDeleteConfirmationDialog.value = true;
};
const deleteConfirmationMessage = computed(() => {
  if (invoiceTemp.value)
    return `Czy chcesz usunąc fakturę nr <b>${invoiceTemp.value.invoiceNumber}</b>?`;
  return "No message";
});
const submitDelete = async () => {
  console.log("submitDelete()");
  if (invoiceTemp.value) {
    await invoiceStore.deleteInvoiceDb(invoiceTemp.value.idInvoice)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Usunięto fakturę nr: " + invoiceTemp.value?.invoiceNumber,
            life: 3000,
          });
        })
        .catch((reason: AxiosError) => {
          toast.add({
            severity: "error",
            summary: "Nie usunięto faktury nr: " + invoiceTemp.value?.invoiceNumber,
            detail: reason.response.data.message,
            life: 5000,
          });
        })
    showDeleteConfirmationDialog.value = false;
  }
}

//
//-------------------------------------------------CREATE PDF-------------------------------------------------
//
const downloadPdf = (idInvoice: number, invoiceNumber:string) => {
  console.log("START - downloadPdf for ",invoiceNumber)
   invoiceStore.getInvoicePdfFromDb(idInvoice)
      .then((response: AxiosResponse) => {
        const fileURL = window.URL.createObjectURL(new Blob([response.data]));
        const fileLink = document.createElement("a");
        fileLink.href = fileURL;
        fileLink.setAttribute("download", "dobranocka_" + invoiceNumber + ".pdf");
        document.body.appendChild(fileLink);
        // this.btnDisabled = false;
        fileLink.click();
      })
      .catch((reason:AxiosError) => {
        toast.add({
          severity: "error",
          summary: "Nie udało się utworzyć PDF dla faktury nr: " + invoiceNumber,
          detail: reason.response.data.message,
          life: 5000,
        });
      });
}


//
//-------------------------------------------------EDIT INVOICE-------------------------------------------------
//
  const editItem = (item: Invoice) => {
    const invoiceItem: Invoice = JSON.parse(JSON.stringify(item));
    router.push({
      name: "Invoice",
      params: {isEdit: "true", invoiceId: invoiceItem.idInvoice},
    });
  };

  onMounted(async () => {
    if (customerStore.customers.length === 0)await customerStore.refreshCustomers();
    if (invoiceStore.invoices.length === 0) await invoiceStore.refreshInvoices();
  });

const handleRowsPerPageChange = (event: DataTablePageEvent) => {
  localStorage.setItem("rowsPerPageInvoice", event.rows.toString());
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

const getCustomerLabel = (customer:Customer) =>{
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
        <p class="text-center text-xl md:text-2xl">LISTA FAKTUR</p>
        <div v-if="invoiceStore.loadingInvoices">
          <ProgressSpinner
              class="ml-3"
              style="width: 35px; height: 35px"
              stroke-width="5"
          />
        </div>
      </div>
    </template>
    <DataTable
        v-if="!invoiceStore.loadingInvoices"
        v-model:expanded-rows="expandedRows"
        v-model:filters="filters"
        :value="invoiceStore.invoices"
        :loading="invoiceStore.loadingInvoices"
        striped-rows
        removable-sort
        paginator
        sort-field="invoiceNumber"
        :sort-order="-1"
        :rows="invoiceStore.rowsPerPage"
        :rows-per-page-options="[5, 10, 20, 50]"
        table-style="min-width: 50rem"
        filter-display="menu"
        :global-filter-fields="['customer.name', 'invoiceNumber', 'sellDate']"
        @page="handleRowsPerPageChange"
    >
      <template #header>
        <div class="flex justify-between">
          <router-link
              :to="{ name: 'Invoice', params: { isEdit: 'false', invoiceId: 0 } }"
              style="text-decoration: none"
          >
            <OfficeButton v-if="isMd" class="" text="Nowa faktura" btn-type="office-regular"/>
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
        <p v-if="!invoiceStore.loadingInvoices" class="text-red-500 text-lg">
          Nie znaleziono faktur...
        </p>
      </template>

      <template #loading>
        <p class="text-primary text-lg">Ładowanie danych. Proszę czekać...</p>
      </template>

      <Column expander style="width: 5rem"/>
      <!--      INVOICE NUMBER  -->
      <Column field="invoiceNumber" header="Nr faktury" :sortable="true">
        <template #filter="{ filterModel }">
          <InputText v-model="filterModel.value" type="text" placeholder="Wpisz tutaj..."/>
        </template>
      </Column>
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
      <!--      SELL DATE-->
      <Column field="sellDate" header="Data sprzedaży" :sortable="true" data-type="date">
        <template #body="{ data }">
          {{ UtilsService.formatDateToString(data.sellDate) }}
        </template>
        <template #filter="{ filterModel }">
          <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="yyyy-dd-mm" />
        </template>
      </Column>

      <!--      INVOICE DATE-->
      <Column field="invoiceDate" header="Data wystawienia" :sortable="true" data-type="date" >
        <template #body="{ data }">
          {{ UtilsService.formatDateToString(data.invoiceDate) }}
        </template>
        <template #filter="{ filterModel }">
          <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="yyyy-dd-mm" />
        </template>
      </Column>

      <!--      PAYMENT METHOD-->
      <Column field="paymentMethod" header="Rodzaj płatności" :sortable="true">
        <template #body="{ data }">
          {{ UtilsService.getEnumValueByKey(PaymentMethod, data.paymentMethod) }}
        </template>
      </Column>

      <!--      PAYMENT DATE -->
      <Column field="paymentDate" header="Termin płatności" :sortable="true" data-type="date">
        <template #body="{ data }">
          {{ UtilsService.formatDateToString(data.paymentDate) }}
        </template>
        <template #filter="{ filterModel }">
          <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="yyyy-dd-mm" />
        </template>
      </Column>

      <!--      AMOUNT-->
      <Column header="Wartość netto" style="min-width: 120px" dataType="numeric">
        <template #body="slotProps">
          {{ UtilsService.formatCurrency(FinanceService.getInvoiceAmount(slotProps.data)) }}
        </template>
        <template #filter="{ filterModel }">
          <InputNumber v-model="filterModel.value" mode="currency" currency="PLN" locale="pl-PL"/>
        </template>
      </Column>

      <Column field="paymentStatus" header="Status" style="width: 100px">
        <template #body="{ data, field }">
          <StatusButton
              title="Zmień status faktury (Zapłacona/Do zapłaty)"
              :btn-type="data[field]"
              :color-icon="data[field] === 'PAID' ? '#2da687' : '#dc3545'"
              @click="confirmStatusChange(data)"
          />
        </template>
      </Column>
      <!--             PDF,   EDIT, DELETE-->
      <Column header="Akcja" :exportable="false" style="min-width: 8rem">
        <template #body="slotProps">
          <div class="flex flex-row gap-1 justify-content-end">
            <OfficeIconButton
                title="Pobierz PDF"
                icon="pi pi-file-pdf"
                :btn-disabled="invoiceStore.loadingFile"
                @click="
                downloadPdf(
                  slotProps.data.idInvoice,
                  slotProps.data.invoiceNumber
                )
              "
            />
            <OfficeIconButton
                title="Edytuj fakturę"
                icon="pi pi-file-edit"
                @click="editItem(slotProps.data)"
            />
            <OfficeIconButton
                title="Usuń fakturę"
                icon="pi pi-trash"
                severity="danger"
                @click="confirmDeleteInvoice(slotProps.data)"
            />
          </div>
        </template>
      </Column>
      <template #expansion="slotProps">
        <div class="p-3">
          <h4>Szczególy faktury nr {{ slotProps.data.invoiceNumber }}</h4>
          <DataTable :value="slotProps.data.invoiceItems">
            <Column field="name">
              <template #header>
                <div class="w-full" style="text-align: left">Nazwa</div>
              </template>
              <template #body="{ data, field }">
                <div style="text-align: left">{{ data[field] }}</div>
              </template>
            </Column>
            <Column field="unit" header="Jm">
              <template #body="{ data, field }">
                <div style="text-align: center">{{ data[field] }}</div>
              </template>
            </Column>
            <Column field="quantity" header="Ilość"></Column>
            <Column field="amount" header="Cena netto">
              <template #body="slotProps">
                {{ UtilsService.formatCurrency(slotProps.data.amount) }}
              </template>
            </Column>
            <Column field="amount" header="Wartość netto" class="min-w-16">
              <template #body="slotProps">
                {{
                  UtilsService.formatCurrency(
                      slotProps.data[slotProps.field] *
                      slotProps.data["quantity"]
                  )
                }}
              </template>
            </Column>
            <!-- VAT -->
            <Column field="vat" header="VAT" >
              <template #body="{ data, field }">
                {{ data[field].viewValue }}
              </template>
            </Column>
            <!--AMOUNT VAT -->
            <Column header="Wartość VAT">
              <template #body="slotProps">
                {{
                  UtilsService.formatCurrency(calculateVatAmount(slotProps.data))
                }}
              </template>
            </Column>
            <!--AMOUNT GROSS -->
            <Column header="Wartość brutto">
              <template #body="slotProps">
                {{
                  UtilsService.formatCurrency(calculateTotalGross(slotProps.data))
                }}
              </template>
            </Column>
          </DataTable>
          <p class="mt-2" style="text-align: center">
            <b>Info:</b> {{ slotProps.data.otherInfo }}
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
