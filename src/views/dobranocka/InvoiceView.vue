<script setup lang="ts">
import {useCustomerStore} from "../../stores/customers";
import {useInvoiceStore} from "../../stores/invoices";
import {useRoute} from "vue-router";
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {type Invoice, type InvoiceItem, PaymentMethod, PaymentStatus} from "../../types/Invoice";
import OfficeButton from "../../components/OfficeButton.vue";
import {useToast} from "primevue/usetoast";
import router from "../../router";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";
import TheMenuDobranocka from "../../components/dobranocka/TheMenuDobranocka.vue";
import OfficeIconButton from "../../components/OfficeIconButton.vue";
import {UtilsService} from "../../service/UtilsService.ts";
import type {DataTableCellEditCompleteEvent} from "primevue/datatable";
import type {AxiosError} from "axios";
import moment from "moment";
import type {Customer} from "../../types/Customer.ts";

const customerStore = useCustomerStore();
const invoiceStore = useInvoiceStore();
const route = useRoute();

const toast = useToast();
// const selectedCustomer = ref<Customer | null>(null);
const invoice = ref<Invoice>({
  idInvoice: 0,
  customer: null,
  invoiceNumber: "",
  sellDate: null,
  invoiceDate: null,
  paymentMethod: PaymentMethod.TRANSFER,
  paymentStatus: PaymentStatus.TO_PAY,
  paymentDate: null,
  otherInfo: "",
  invoiceItems: [],
});

const invoiceItem = ref<InvoiceItem>({
  id: 0,
  idInvoice: 0,
  name: "",
  pkwiu: "",
  unit: "",
  quantity: 0,
  amount: 0,
  vat: {
    viewValue: "8%",
    numberValue: 8,
    multiplier: 1.08
  }
});
const invoiceNumber = ref<number>(0);
const invoiceYear = ref<number>(2020);
const btnShowBusy = ref<boolean>(false);
const paymentDeadline = ref<number>(14);

const btnSaveDisabled = ref<boolean>(false);
let editedInvoiceNumber: number = 0;

watch(invoiceYear, async (newValue) => {
  console.log('watch year', newValue)
  if (!isEdit.value)
    invoiceNumber.value = await invoiceStore.findInvoiceNumber(newValue);
})

const totalAmountNet = computed(() => {
  let total = invoice.value.invoiceItems.reduce((acc, item) => {
    return acc + item.quantity * item.amount;
  }, 0);
  return UtilsService.formatCurrency(total);
});

const totalAmountVat = computed(() => {
  let total = invoice.value.invoiceItems.reduce((acc, item) => {
    return acc + calculateVatAmount(item);
  }, 0);
  return UtilsService.formatCurrency(total);
});

const totalAmountGross = computed(() => {
  let total = invoice.value.invoiceItems.reduce((acc, item) => {
    return acc + item.quantity * item.amount * item.vat.multiplier;
  }, 0);
  return UtilsService.formatCurrency(total);
});

interface VatSummary {
  net: number;
  vat: number;
  gross: number;
}
const vatSummaries = computed(() => {
  const summaries: Record<string, VatSummary> = {};
  invoice.value.invoiceItems.forEach((item: InvoiceItem) => {
    const vatKey = item.vat.viewValue; // Używamy viewValue jako identyfikatora
    if (!summaries[vatKey]) {
      summaries[vatKey] = {
        net: 0,
        vat: 0,
        gross: 0
      };
    }
    summaries[vatKey].net += item.quantity * item.amount;
    summaries[vatKey].vat += item.quantity * item.amount * (item.vat.multiplier - 1);
    summaries[vatKey].gross += item.quantity * item.amount * item.vat.multiplier;
  });
  return summaries;
});


const isSaveBtnDisabled = computed(() => {
  return (
      invoiceStore.loadingPaymentType ||
      invoiceStore.loadingInvoices ||
      invoiceStore.loadingInvoiceNo ||
      customerStore.loadingCustomer ||
      btnSaveDisabled.value
  );
});
function saveInvoice() {
  submitted.value = true;
  if (isEdit.value) {
    editInvoice();
  } else {
    newInvoice();
  }
}

//
//---------------------------------------------------------NEW INVOICE----------------------------------------------
//
async function newInvoice() {
  console.log("newInvoice()");
  if (isNotValid()) {
    showError("Uzupełnij brakujące elementy");
  } else {
    btnSaveDisabled.value = true;
    invoice.value.invoiceNumber = invoiceYear.value + "/" + invoiceNumber.value;
    const invoiceDate = moment(invoice.value.invoiceDate);
    invoice.value.paymentDate = invoiceDate.add(paymentDeadline.value, 'day').toDate()
    await invoiceStore.addInvoiceDb(invoice.value)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Zapisano fakturę nr: " + invoice.value.invoiceNumber,
            life: 3000,
          });
          setTimeout(() => {
            router.push({name: "Invoices"});
          }, 3000);
        })
        .catch((reason: AxiosError) => {
          toast.add({
            severity: "error",
            summary: "Błąd podczas zapisu faktury.",
            detail: (reason?.response?.data as { message: string }).message,
            life: 5000,
          });
        }).finally(() => btnSaveDisabled.value = false);
  }
}

//
//-----------------------------------------------------EDIT INVOICE------------------------------------------------
//
const isEdit = ref<boolean>(false);

async function editInvoice() {
  if (isNotValid()) {
    showError("Uzupełnij brakujące elementy");
  } else {
    invoice.value.invoiceNumber = invoiceYear.value + "/" + invoiceNumber.value;
    btnSaveDisabled.value = true;
    await invoiceStore.updateInvoiceDb(invoice.value)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Zaaktualizowano fakturę nr: " + invoice.value.invoiceNumber,
            life: 3000,
          });
          setTimeout(() => {
            btnSaveDisabled.value = false
            router.push({name: "Invoices"});
          }, 3000);
        })
        .catch((reason:AxiosError) => {
          btnSaveDisabled.value = false
          toast.add({
            severity: "error",
            summary: "Błąd podczas edycji faktury.",
            detail: (reason?.response?.data as { message: string }).message,
            life: 5000,
          });
        })
  }
}

function onInvoiceNumberUpdate( newNumber: number) {
  const year = invoiceYear.value; // Rok wpisany w innym polu (v-model)
  // Ustaw następny wolny numer faktury
  invoiceNumber.value = findNextInvoiceNumber(year, newNumber, invoiceStore.invoices);
}

function findNextInvoiceNumber(year: number, invoiceNumber: number, invoices: Invoice[]): number {
  // Filtruj faktury dla danego roku
  const currentYearInvoices = invoices.filter(invoice => {
    const [invoiceYear] = invoice.invoiceNumber.split("/");
    return parseInt(invoiceYear) === year;
  });
  // Wyciągnij istniejące numery faktur dla danego roku
  const usedNumbers = currentYearInvoices
      .map(invoice => {
        const parts = invoice.invoiceNumber.split("/"); // Podziel numer faktury na części
        const invoiceNo = parseInt(parts[1], 10); // Pobierz drugą część (numer faktury) jako liczbę
        return isNaN(invoiceNo) ? null : invoiceNo; // Sprawdź, czy wynik to liczba
      })
      .filter((number:number | null) => number !== null && number !== editedInvoiceNumber); // Usuń wartości null i aktualny numer faktury

  // Znajdź pierwszy wolny numer
  let nextNumber: number = invoiceNumber;
  while (usedNumbers.includes(nextNumber)) {
    nextNumber++;
  }
  return nextNumber;
}


//
// ---------------------------------------------------------NEW INVOICE_ITEM---------------------------------------
//
function newItem() {
  console.log('new item')
  invoiceItem.value.idInvoice = invoice.value.idInvoice;
  invoiceItem.value.name = "Najem krótkotrwały pomieszczeń mieszkalnych, Siekierki Wielkie ul. Poznańska 32";
  invoiceItem.value.amount = 0;
  invoiceItem.value.unit = 'szt.'
  invoiceItem.value.quantity = 0;
  invoiceItem.value.vat = {
    viewValue: "8%",
    numberValue: 8,
    multiplier: 1.08
  }
  invoice.value.invoiceItems.push({...invoiceItem.value})
}

//
//------------------------------------------------- EDIT INVOICE_ITEM---------------------------------------------------
//

const onCellEditComplete = (event: DataTableCellEditCompleteEvent) => {
  let {data, newValue, field, originalEvent} = event;

  switch (field) {
    case 'amount':
    case 'quantity':
      if (UtilsService.isPositiveFloat(newValue)) data[field] = newValue;
      else originalEvent.preventDefault();
      break;
    case 'vat':
      data[field] = newValue;
      break;

    default:
      if (newValue.trim().length > 0) data[field] = newValue;
      else originalEvent.preventDefault();
      break;
  }
};

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

//
//------------------------------------------DELETE INVOICE ITEM MODAL----------------------------------------------
//
const showDeleteConfirmationDialog = ref<boolean>(false);
const invoiceDeleteItemIndex = ref<number>(-1);
const confirmDeleteItem = (item: InvoiceItem, index: number) => {
  invoiceItem.value = item;
  invoiceDeleteItemIndex.value = index;
  showDeleteConfirmationDialog.value = true;
};

const deleteConfirmationMessage = computed(() => {
  if (invoiceItem.value)
    return `Czy chcesz usunąc pozycję <b>${invoiceItem.value.name}</b>?`;
  return "No message";
});


const submitDelete = async () => {
  console.log("submitDelete()");
  if (invoiceItem.value) {
    if (invoiceDeleteItemIndex.value !== -1)
      invoice.value.invoiceItems.splice(invoiceDeleteItemIndex.value, 1);
  }
  showDeleteConfirmationDialog.value = false;
};

//----------------------------------------MOUNTED-----------------------------------------------
onMounted(() => {
  console.log("onMounted GET");
  btnSaveDisabled.value = true;
  if (customerStore.customers.length === 0) customerStore.refreshCustomers();
  if (invoiceStore.invoices.length === 0) invoiceStore.refreshInvoices();
  invoiceStore.getVatType();
  btnSaveDisabled.value = false;
});

onMounted(async () => {
  // console.log("onMounted EDIT", route.params);
  btnSaveDisabled.value = true;
  isEdit.value = route.params.isEdit === "true";
  if (!isEdit.value) {
    console.log("onMounted NEW INVOICE");
    invoiceYear.value = new Date(Date.now()).getFullYear();
  } else {
    console.log("onMounted EDIT INVOICE");
    const invoiceId = Number(route.params.invoiceId as string);
    invoiceStore
        .getInvoiceFromDb(invoiceId)
        .then((data) => {
          if (data) {
            invoice.value = data;
            if (data.paymentDate && data.invoiceDate) {
              const paymentDate = moment(data.paymentDate);
              const invoiceDate = moment(data.invoiceDate);

              paymentDeadline.value = paymentDate.diff(invoiceDate, 'days');
            } else {
              paymentDeadline.value = 0;
            }

            invoiceNumber.value = Number(
                invoice.value.invoiceNumber.split("/")[1]
            );
            invoiceYear.value = Number(invoice.value.invoiceNumber.split("/")[0]);
            editedInvoiceNumber = Number(
                invoice.value.invoiceNumber.split("/")[1]
            );
          }
        })
        .catch((error) => {
          console.error("Błąd podczas pobierania faktury:", error);
        });
  }
  btnSaveDisabled.value = false;
});

//
//-------------------------------------------------------ERROR
//
const submitted = ref<boolean>(false);

const showError = (msg: string) => {
  toast.add({
    severity: "error",
    summary: "Error Message",
    detail: msg,
    life: 5000,
  });
};
const isNotValid = () => {
  return (
      showErrorCustomer() ||
      showErrorInvoiceDate() ||
      showErrorSellDate() ||
      showErrorInvoiceItems()
  )
}
const showErrorInvoiceItems = () => {
  if (submitted.value){
   return  invoice.value.invoiceItems.length == 0 || hasInvalidInvoiceItems()
  }else
    return false
};
const hasInvalidInvoiceItems = (): boolean => {
  return invoice.value.invoiceItems.some(item => {
    return !item.name || !item.unit || item.quantity <= 0 || item.amount <= 0;
  });
};

const showErrorCustomer = () => {
  return submitted.value && invoice.value.customer === null;
};
const showErrorInvoiceDate = () => {
  return submitted.value && !invoice.value.invoiceDate
}
const showErrorSellDate = () => {
  return submitted.value && !invoice.value.sellDate
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

const getCustomerLabel = (option: Customer) =>{
  // console.log("getCustomerLabel",option);
  return `${option.name} ${option.firstName}`;
}
const paymentMethods = Object.keys(PaymentMethod).map((key) => ({
  label: PaymentMethod[key as keyof typeof PaymentMethod], // wartość
  value: key, // klucz
}));
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

  <div class="m-4">
    <form @submit.stop.prevent="saveInvoice">
      <Panel>
        <template #header>
          <OfficeIconButton
              title="Powrót do listy faktur"
              icon="pi pi-fw pi-clipboard"
              @click="() => router.push({ name: 'Invoices' })"
          />
          <div class="w-full flex justify-center">
            <span class="text-2xl">
              {{
                isEdit
                    ? `Edycja faktury nr: ${invoice.invoiceNumber}`
                    : "Nowa faktura"
              }}
            </span>
          </div>
        </template>
        <div class="flex flex-col md:flex-row gap-4">
          <Panel class="w-full md:w-1/2  " :toggleable="!isMd">
            <template #header>
              <p class="text-lg font-semibold">Dane faktury</p>
            </template>
            <!-- ROW-1   CUSTOMER -->
            <div class="flex flex-row gap-4">
              <div class="flex flex-col w-full">
                <label for="input-customer">Wybierz klienta:</label>
                <Select
                    id="input-customer"
                    v-model="invoice.customer"
                    :invalid="showErrorCustomer()"
                    :options="customerStore.customers"
                    :option-label="getCustomerLabel"
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

            <!-- ROW-2  INVOICE NUMBER/YEAR  -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <!--              <div class="col">-->
              <div class="flex flex-row gap-4">
                <div class="flex flex-col w-full">
                  <label for="number">Numer faktury</label>
                  <InputNumber class=""
                               id="number"
                               v-model="invoiceNumber"
                               mode="decimal"
                               show-buttons fluid
                               :min="1"
                               :max="500"
                               @update:modelValue="onInvoiceNumberUpdate"
                  />
                </div>
                <div v-if="invoiceStore.loadingInvoiceNo" class="mt-6">
                  <ProgressSpinner
                      class="ml-2 mt-1"
                      style="width: 30px; height: 30px"
                      stroke-width="5"
                  />
                </div>
              </div>
              <div class="">
                <div class="flex flex-col ">
                  <label for="year">Rok faktury</label>
                  <InputNumber
                      id="year"
                      v-model="invoiceYear"
                      mode="decimal"
                      :use-grouping="false"
                      show-buttons
                      :min="2000"
                      :max="2050"
                      fluid
                  />
                </div>
              </div>
            </div>

            <!-- ROW-3  DATES  -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:mt-4">
              <div class="flex flex-col w-full mt-4 sm:mt-0">
                <label for="invoiceDate">Data wystawienia:</label>
                <DatePicker
                    id="invoiceDate"
                    v-model="invoice.invoiceDate"
                    show-icon
                    date-format="yy-mm-dd"
                    :invalid="showErrorInvoiceDate()"
                />
                <small class="text-red-500">{{
                    showErrorInvoiceDate() ? 'Pole jest wymagane.' : '&nbsp;'
                  }}</small>
              </div>
              <div class="flex flex-col w-full">
                <label for="sellDate">Data sprzedaży:</label>
                <DatePicker
                    id="sellDate"
                    v-model="invoice.sellDate"
                    show-icon
                    date-format="yy-mm-dd"
                    :invalid="showErrorSellDate()"
                />
                <small class="text-red-500">{{
                    showErrorSellDate() ? 'Pole jest wymagane.' : '&nbsp;'
                  }}</small>
              </div>
            </div>

            <!-- ROW-4  LATE PAYMENT, PAYMENT_TYPE  -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:mt-4">
              <div class="flex flex-col w-full mt-4 sm:mt-0">
                <label for="input">Odroczenie płatności:</label>
                <InputNumber
                    id="input"
                    v-model="paymentDeadline"
                    mode="decimal"
                    :use-grouping="false"
                    show-buttons
                    :min="0"
                    :max="90"
                    fluid
                />
              </div>
              <div class="flex flex-row gap-4">
                <div class="flex flex-col w-full">
                  <label for="payment-method">Forma płatności:</label>
                  <Select
                      id="payment-method"
                      v-model="invoice.paymentMethod"
                      :options="paymentMethods"
                      option-label="label"
                      option-value="value"
                      required
                  />
                </div>
                <div v-if="invoiceStore.loadingPaymentType" class="mt-6">
                  <ProgressSpinner
                      class="ml-2 mt-1"
                      style="width: 30px; height: 30px"
                      stroke-width="5"
                  />
                </div>
              </div>
            </div>

            <!-- ROW-5  OTHER INFO  -->
            <div class="flex-row flex mt-4">
              <div class="flex flex-col col-12 w-full">
                <label for="input">Dodatkowe informacje:</label>
                <Textarea v-model="invoice.otherInfo" rows="4" cols="30" fluid/>
              </div>
            </div>
          </Panel>

          <!-- TABLE INVOIS_ITEMS -->
          <Panel class="max-w-full">
            <template #header>
              <div class="flex w-full justify-between">
                <p class="text-lg font-semibold">Pozycje na fakturze</p>
                <OfficeButton
                    title="Podaj nową pozycję do faktury."
                    text="Dodaj"
                    btn-type="office-regular"
                    type="button"
                    @click="newItem"
                />
              </div>
            </template>
            <DataTable :value="invoice.invoiceItems" size="small"
                       editMode="cell" dataKey="id" @cell-edit-complete="onCellEditComplete">
              <!-- NAME -->
              <Column field="name" header="Nazwa"
                      class="min-w-52 hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
                <template #editor="{ data, field }">
                  <Textarea v-model="data[field]" fluid rows="4" cols="30"/>
                </template>
              </Column>

              <!-- PKWIU -->
              <Column field="pkwiu" header="PKWiU"
                      class="hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
                <template #editor="{ data, field }">
                  <InputText v-model="data[field]" fluid maxlength="20"/>
                </template>
              </Column>

              <!-- QUANTITY -->
              <Column field="quantity" header="Ilość"
                      class="min-w-16 hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
                <template #editor="{ data, field }">
                  <InputNumber v-model="data[field]" :min="0" mode="decimal" fluid @focus="UtilsService.selectText"/>
                </template>
              </Column>

              <!-- JM -->
              <Column field="unit" header="Jm"
                      class="min-w-16 hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
                <template #editor="{ data, field }">
                  <InputText v-model="data[field]" fluid maxlength="10"/>
                </template>
              </Column>


              <!-- AMOUNT NET-->
              <Column field="amount" header="Cena netto"
                      class="min-w-16 hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
                <template #body="{ data, field }">
                  <div style="text-align: center">
                    {{ UtilsService.formatCurrency(data[field]) }}
                  </div>
                </template>
                <template #editor="{ data, field }">
                  <InputNumber v-model="data[field]" mode="currency" currency="PLN" locale="pl-PL" fluid @focus="UtilsService.selectText"/>
                </template>
              </Column>

              <!-- TOTAL AMOUNT NETT-->
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
              <Column field="vat" header="VAT" class="hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
                <template #body="{ data, field }">
                  {{ data[field].viewValue }}
                </template>
                <template #editor="{ data, field }">
                  <Select v-model="data[field]" :options="invoiceStore.vatTypes" option-label="viewValue"
                          placeholder="Wybierz..." fluid/>
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

              <template #empty>
                <span class="text-red-500">Uzupełnij dane..</span>
              </template>

              <!--                EDIT, DELETE-->
              <Column
                  header="Akcja"
                  :exportable="false"
              >
                <template #body="slotProps">
                  <OfficeIconButton
                      title="Usuń pozycję."
                      icon="pi pi-trash"
                      severity="danger"
                      @click="
                        confirmDeleteItem(slotProps.data, slotProps.index)
                      "
                  />
                </template>
              </Column>
              <ColumnGroup type="footer">
                <Row>
                  <Column
                      :colspan="5"
                      footer-style="text-align:right; padding-right: 8px;"
                  >
                    <template #footer>
                      <p class="font-semibold">RAZEM:</p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="font-semibold">
                        {{ totalAmountNet }}
                      </p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="font-semibold">X</p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="font-semibold">
                        {{ totalAmountVat }}
                      </p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="font-semibold">
                        {{ totalAmountGross }}
                      </p>
                    </template>
                  </Column>
                </Row>
                <!-- Dynamiczne wiersze dla każdej stawki VAT -->
                <Row v-for="(summary, vatKey) in vatSummaries" :key="vatKey">
                  <Column :colspan="5" footer-style="text-align:right; padding-right: 8px;">
                    <template #footer>
                      <p class="text-sm">W tym:</p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="text-sm">{{ UtilsService.formatCurrency(summary.net) }}</p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="text-sm">{{ vatKey }}</p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="text-sm">{{ UtilsService.formatCurrency(summary.vat) }}</p>
                    </template>
                  </Column>
                  <Column>
                    <template #footer>
                      <p class="text-sm">{{ UtilsService.formatCurrency(summary.gross) }}</p>
                    </template>
                  </Column>
                </Row>
              </ColumnGroup>
            </DataTable>
          </Panel>
        </div>
        <!-- ROW-6  BTN SAVE -->
        <div class="flex justify-center mt-6">
          <OfficeButton
              text="zapisz"
              btn-type="office-save"
              type="submit"
              :loading="btnShowBusy"
              :btn-disabled="isSaveBtnDisabled"
          />
        </div>
      </Panel>
    </form>
  </div>
</template>
