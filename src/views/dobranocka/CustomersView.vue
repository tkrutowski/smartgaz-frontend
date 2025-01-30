<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {FilterMatchMode} from '@primevue/core/api';
import OfficeButton from "@/components/OfficeButton.vue";
import router from "@/router";
import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
import type {Customer} from "@/types/Customer";
import {useCustomerStore} from "@/stores/customers";
import {useToast} from "primevue/usetoast";
import type {DataTablePageEvent} from "primevue/datatable";
import OfficeIconButton from "@/components/OfficeIconButton.vue";
import type {AxiosError} from "axios";
import TheMenuDobranocka from "@/components/dobranocka/TheMenuDobranocka.vue";

const customerStore = useCustomerStore();
const toast = useToast();
const expandedRows = ref([]);
const customerTemp = ref<Customer>();

//filter
const filters = ref();
const initFilters = () => {
  filters.value = {
    global: {value: null, matchMode: FilterMatchMode.CONTAINS},
    name: {value: null, matchMode: FilterMatchMode.CONTAINS},
    'street': {value: null, matchMode: FilterMatchMode.CONTAINS},
    'city': {value: null, matchMode: FilterMatchMode.CONTAINS},
  };
}
initFilters();
const clearFilter = () => {
  initFilters();
};


//
//-------------------------------------------------DELETE CUSTOMER-------------------------------------------------
//
const showDeleteConfirmationDialog = ref<boolean>(false);

const confirmDeleteCustomer = async (customer: Customer) => {
  customerTemp.value = customer;
  showDeleteConfirmationDialog.value = true;
};

const deleteConfirmationMessage = computed(() => {
  return `Czy chcesz usunąc klienta: <b>${getCustomerFullName.value}</b>?`;
});

const getErrorMessage = (error: AxiosError) => {
  if (
      typeof error === 'object' &&
      'response' in error &&
      typeof (error as any).response === 'object'
  ) {
    const response = (error as any).response;

    // Sprawdzenie statusu w response
    return response.data?.message || 'Nie można usunąć'
  }
  return "Nie można usunąć"
};

const submitDelete = async () => {
  console.log("submitDelete()");
  if (customerTemp.value) {
    await customerStore.deleteCustomerDb(customerTemp.value.id)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Usunięto klienta: " + getCustomerFullName.value,
            life: 3000,
          });
        }).catch((reason: AxiosError) => {
          if (reason && reason.response && reason.response.status === 423) {
            toast.add({
              severity: 'warn',
              summary: "Blokada",
              detail:getErrorMessage(reason),
              life: 5000,
            })
          } else
            toast.add({
              severity: "error",
              summary: "Nie udało się usunąć klienta",
              detail: (reason?.response?.data as { message: string }).message,
              life: 5000,
            });
        });
  }
  showDeleteConfirmationDialog.value = false;
};

//
//-------------------------------------------------EDIT CUSTOMER-------------------------------------------------
//
const editCustomer = (customer: Customer) => {
  // console.log("EDIT CUSTOMER:", customer);
  const customerTemp: Customer = JSON.parse(JSON.stringify(customer));
  router.push({
    name: "Customer",
    params: {isEdit: "true", customerId: customerTemp.id},
  });
};

onMounted(() => {
  customerStore.refreshCustomers();
});

const getCustomerFullName = computed(() => {
  return customerTemp.value?.firstName + " " + customerTemp.value?.name;
})

const handleRowsPerPageChange = (event: DataTablePageEvent) => {
  localStorage.setItem('rowsPerPageDobranockaCustomer', event.rows.toString())
}

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

  <Panel class="my-5 mx-2">
    <template #header>
      <div class="w-full flex justify-center gap-4">
        <p class="text-center text-xl md:text-2xl">LISTA KLIENTÓW</p>
        <div v-if="customerStore.loadingCustomer">
          <ProgressSpinner
              class="ml-3"
              style="width: 35px; height: 35px"
              stroke-width="5"
          />
        </div>
      </div>
    </template>
    <DataTable
        v-if="!customerStore.loadingCustomer"
        v-model:filters="filters"
        v-model:expanded-rows="expandedRows"
        :value="customerStore.customers"
        :loading="customerStore.loadingCustomer"
        striped-rows
        removable-sort
        paginator
        :rows="customerStore.rowsPerPage"
        :rows-per-page-options="[5, 10, 20, 50]"
        table-style="min-width: 50rem"
        filter-display="menu"
        :global-filter-fields="[
        'firstName',
        'name',
        'nip',
        'street',
        'city',
      ]"
        size="small"
        @page="handleRowsPerPageChange"
    >
      <template #header>
        <div class="flex flex-row justify-between">
          <router-link
              :to="{
              name: 'Customer',
              params: { isEdit: 'false', customerId: 0 },
            }"
              style="text-decoration: none"
          >
            <OfficeButton v-if="isMd" class="" text="Nowy klient" btn-type="office-regular"/>
            <OfficeButton v-else class="" text="Nowy " btn-type="office-regular"/>
          </router-link>
          <div class="flex gap-4">
            <IconField icon-position="left">
              <InputIcon>
                <i class="pi pi-search"/>
              </InputIcon>
              <InputText class="!max-w-32" size="small"
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
        <p v-if="!customerStore.loadingCustomer" class="text-red-500 text-lg">
          Nie znaleziono klientów...
        </p>
      </template>

      <template #loading>
        <p class="text-primary text-lg">Ładowanie danych. Proszę czekać...</p>
      </template>

      <Column expander style="width: 5rem"/>
      <Column field="firstName" header="Imię"></Column>
      <Column
          field="name"
          header="Nazwisko/Nazwa"
          :sortable="true"
          style="text-align: left"
      >
        <template #filter="{ filterModel }">
          <InputText v-model="filterModel.value" type="text" placeholder="Wpisz tutaj..."/>
        </template>
      </Column>
      <Column field="street" header="Ulica" sortable>
        <template #filter="{ filterModel }">
          <InputText v-model="filterModel.value" type="text" placeholder="Wpisz tutaj..."/>
        </template>
      </Column>
      <Column field="city" header="Miasto" sortable>
        <template #filter="{ filterModel }">
          <InputText v-model="filterModel.value" type="text" placeholder="Wpisz tutaj..."/>
        </template>
      </Column>
      <Column field="nip" header="NIP" sortable></Column>


      <!--                EDIT, DELETE-->
      <Column header="Akcja" :exportable="false" style="width: 6rem">
        <template #body="slotProps">
          <div class="flex flex-row gap-1 justify-content-end">
            <OfficeIconButton
                title="Edytuj klienta"
                icon="pi pi-file-edit"
                @click="editCustomer(slotProps.data)"
            />
            <OfficeIconButton
                title="Usuń klienta"
                icon="pi pi-trash"
                severity="danger"
                @click="confirmDeleteCustomer(slotProps.data)"
            />
          </div>
        </template>
      </Column>
      <template #expansion="slotProps">
        <div class="p-3">
          <h5>Szczególy klienta:</h5>

          <p class="mt-2 ml-8" style="text-align: left">
            <b>Adres:</b> ul. {{ slotProps.data.street }},
            {{ slotProps.data.zip }} {{ slotProps.data.city }}
          </p>
          <p class="mt-2 ml-8" style="text-align: left">
            <b>E-mail:</b> {{ slotProps.data.mail }}
          </p>
          <p class="mt-2 ml-8" style="text-align: left">
            <b>Regon:</b> {{ slotProps.data.regon }}
          </p>
          <p class="mt-2 ml-8" style="text-align: left">
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
