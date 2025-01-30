<script setup lang="ts">
import {useCustomerStore} from "@/stores/customers.ts";
import {useRoute} from "vue-router";
import {computed, onMounted, ref} from "vue";
import type {Customer} from "@/types/Customer.ts";
import OfficeButton from "@/components/OfficeButton.vue";
import {useToast} from "primevue/usetoast";
import router from "@/router";
import type {AxiosError} from "axios";
import OfficeIconButton from "@/components/OfficeIconButton.vue";
import TheMenuDobranocka from "@/components/dobranocka/TheMenuDobranocka.vue";

const customerStore = useCustomerStore();
const route = useRoute();

const toast = useToast();
const customer = ref<Customer>({
  id: 0,
  name: "",
  firstName: "",
  nip: "",
  phone: "",
  mail: "",
  info: "",
  regon: "",
  city: "",
  street: "",
  zip: "",
});

const btnSaveDisabled = ref<boolean>(false);
const btnShowBusy = ref<boolean>(false);

const isSaveBtnDisabled = computed(() => {
  return (
      customerStore.loadingCustomer ||
      btnSaveDisabled.value
  );
});
//
//SAVE
//
function saveCustomer() {
  submitted.value = true;
  if (isEdit.value) {
    editCustomer();
  } else {
    newCustomer();
  }
}

//
//---------------------------------------------------------NEW CUSTOMER----------------------------------------------
//
async function newCustomer() {
  console.log("newCustomer()");
  if (isNotValid()) {
    showError("Uzupełnij brakujące elementy");
  } else {
    btnSaveDisabled.value = true;
    btnShowBusy.value = true;
    await customerStore.addCustomerDb(customer.value).then(() => {
      toast.add({
        severity: "success",
        summary: "Potwierdzenie",
        detail: "Zapisano klienta: " + getCustomerFullName.value,
        life: 3000,
      });
      setTimeout(() => {
        btnSaveDisabled.value = false;
        router.push({name: "Customers"});
      }, 2000);
    }).catch((reason: AxiosError) => {
      btnSaveDisabled.value = false
      if (reason.response?.status === 409) {
        toast.add({
          severity: 'warn',
          summary: reason.message,
          detail: 'Klient o tym numerze NIP już istnieje w bazie danych.',
          life: 5000,
        })
      } else {
        toast.add({
          severity: "error",
          summary: "Błąd podczas dodawania klienta.",
          detail: (reason?.response?.data as { message: string }).message,
          life: 5000,
        });
      }
    }).finally(() => {
      btnShowBusy.value = false;
    })
    submitted.value = false;
  }
}

//
//-----------------------------------------------------EDIT CUSTOMER------------------------------------------------
//
const isEdit = ref<boolean>(false);

async function editCustomer() {
  if (isNotValid()) {
    showError("Uzupełnij brakujące elementy");
  } else {
    btnSaveDisabled.value = true;
    btnShowBusy.value = true;
    await customerStore.updateCustomerDb(customer.value)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Zaaktualizowano dane klienta: " + getCustomerFullName.value,
            life: 3000,
          });
          setTimeout(() => {
          btnSaveDisabled.value = false
            router.push({name: "Customers"});
          }, 3000);
        }).catch((reason: AxiosError) => {
          toast.add({
            severity: "error",
            summary: "Błąd podczas dodawania klienta.",
            detail: (reason?.response?.data as { message: string }).message,
            life: 5000,
          });
        }).finally(() => {
          btnShowBusy.value = false;
        })
  }
  submitted.value = false;
}


onMounted(async () => {
  console.log("onMounted EDIT", route.params);
  btnSaveDisabled.value = true;
  isEdit.value = route.params.isEdit === "true";
  if (isEdit.value === false) {
    console.log("onMounted NEW CUSTOMER");
  } else {
    console.log("onMounted EDIT CUSTOMER");
    const customerId = Number(route.params.customerId as string);
    customerStore
        .getCustomerFromDb(customerId)
        .then((data: Customer | null) => {
          if (data) {
            customer.value = data;
          }
        })
        .catch((error: AxiosError) => {
          console.error("Błąd podczas pobierania klienta:", error);
        });
  }
  btnSaveDisabled.value = false;
});

//
//-----------------------------------------------------ERROR-------------------------------------------------------
//
const submitted = ref(false);

const showError = (msg: string) => {
  toast.add({
    severity: "error",
    summary: "Error Message",
    detail: msg,
    life: 5000,
  });
};
const getCustomerFullName = computed(() => {
  return customer.value?.firstName + " " + customer.value?.name;
});
const isNotValid = () => {
  return (
      showErrorFirstName() ||
      showErrorName() ||
      showErrorNip() ||
      showErrorRegon() ||
      showErrorStreet() ||
      showErrorZip() ||
      showErrorCity() ||
      showErrorMail() ||
      showErrorPhone()
  );
};
const showErrorFirstName = () => {
  if (customer.value.firstName.length > 0) {
    return submitted.value && customer.value.firstName.length < 3;
  } else return false
};
const showErrorName = () => {
  return submitted.value && customer.value.name.length <= 0;
};
const showErrorNip = () => {
  if (customer.value.nip.length > 0) {
    const isTenDigits = /^\d{10}$/.test(customer.value.nip);
    return submitted.value && customer.value.nip.length > 0 && !isTenDigits;
  }else {
    return false;
  }
};
const showErrorRegon = () => {
  if (submitted.value && customer.value.regon.length > 0) {
    const isNineDigits = /^\d{9}$/.test(customer.value.regon);
    const isFourteenDigits = /^\d{14}$/.test(customer.value.regon);
    return !(isNineDigits || isFourteenDigits);
  } else {
    return false;
  }
};
const showErrorStreet = () => {
  return submitted.value && customer.value.street.length <= 0;
};

const showErrorZip = () => {
  if (submitted.value) {
    return (
        !(/(^\d{2}-\d{3}$)/.test(customer.value.zip) && customer.value.zip.length <= 6) &&
        !(/(^\d{5})/.test(customer.value.zip) && customer.value.zip.length <= 5)
    );
  }else {
    return false;
  }
};
const showErrorCity = () => {
  return submitted.value && customer.value.city.length <= 0;
};
const showErrorMail = () => {
  if (submitted.value && customer.value.mail.length > 0) {
    return !customer.value.mail.includes("@");
  }
  return false;
};
const showErrorPhone = () => {
  if (submitted.value && customer.value.phone.length > 0) {
    return !/^[0-9]+$/.test(customer.value.phone);
  }
  return false;
};
</script>

<template>
  <TheMenuDobranocka/>
  <div class="m-4 max-w-6xl mx-auto">
    <form
        class="col-12 col-md-9 col-xl-6 align-self-center"
        @submit.stop.prevent="saveCustomer"
    >
      <Panel>
        <template #header>
          <OfficeIconButton
              title="Powrót do listy klientów"
              icon="pi pi-fw pi-list"
              @click="() => router.push({ name: 'Customers' })"
          />
          <div class="w-full flex justify-center gap-4">
            <span class="text-3xl">
              {{ isEdit ? `Edycja danych klienta` : "Nowy klient" }}
            </span>
            <div v-if="customerStore.loadingCustomer">
              <ProgressSpinner
                  class="ml-3"
                  style="width: 30px; height: 30px"
                  stroke-width="5"
              />
            </div>
          </div>
        </template>


        <!-- ROW-1  FIRST_NAME / NAME  -->
        <div class="flex flex-col md:flex-row md:gap-4">
          <div class="flex flex-col w-full">
            <label for="input">Imię</label>
            <InputText
                id="input"
                v-model="customer.firstName"
                :invalid="showErrorFirstName()"
                maxlength="40"
            />
            <small class="text-red-500">{{
                showErrorFirstName() ? "Min 3 znaki." : "&nbsp;"
              }}</small>
          </div>
          <div class="flex flex-col w-full">
            <label for="input">Nazwisko/Nazwa</label>
            <InputText
                id="input"
                v-model="customer.name"
                maxlength="100"
                :invalid="showErrorName()"
            />
            <small class="text-red-500">{{
                showErrorName() ? "Pole jest wymagane." : "&nbsp;"
              }}</small>
          </div>
        </div>


        <!-- ROW-3  ADDRESS  -->
        <div class="flex flex-col md:flex-row md:gap-4">
          <div class="flex flex-col w-full">
            <label for="street">Ulica</label>
            <InputText
                id="street"
                v-model="customer.street"
                class="border-green"
                :invalid="showErrorStreet()"
                maxlength="30"
            />
            <small class="text-red-500">{{
                showErrorStreet() ? "Pole jest wymagane." : "&nbsp;"
              }}</small>
          </div>
          <div class="flex flex-col w-full">
            <label for="zip">Kod pocztowy</label>
            <InputText
                id="zip"
                v-model="customer.zip"
                :invalid="showErrorZip()"
                maxlength="6"
            />
            <small class="text-red-500">{{
                showErrorZip() ? "Format 61754 lub 61-754." : "&nbsp;"
              }}</small>
          </div>
          <div class="flex flex-col w-full">
            <label for="city">Miasto</label>
            <InputText
                id="city"
                v-model="customer.city"
                maxlength="100"
                :invalid="showErrorCity()"
            />
            <small class="text-red-500">{{
                showErrorCity() ? "Pole jest wymagane." : "&nbsp;"
              }}</small>
          </div>
        </div>

        <!-- ROW-3  NIP / REGON  -->
        <div class="flex flex-col md:flex-row md:gap-4">
          <div class="flex flex-col w-full">
            <label for="nip">NIP</label>
            <InputText
                id="nip"
                v-model="customer.nip"
                class="border-green"
                :invalid="showErrorNip()"
                :useGrouping="false"
            />
            <small class="text-red-500">{{
                showErrorNip() ? "Pole NIP musi mieć 10 znaków." : "&nbsp;"
              }}</small>
          </div>
          <div class="flex flex-col w-full">
            <label for="regon">Regon</label>
            <InputText
                id="regon"
                v-model="customer.regon"
                :invalid="showErrorRegon()"
                :useGrouping="false"
            />
            <small class="text-red-500">{{
                showErrorRegon() ? "Pole musi mieć 10 lub 14 znaków." : "&nbsp;"
              }}</small>
          </div>
        </div>

        <!-- ROW-4  MAIL / PHONE  -->
        <div class="flex flex-col md:flex-row md:gap-4">
          <div class="flex flex-col w-full">
            <label for="mail">E-mail</label>
            <InputText
                id="mail"
                v-model="customer.mail"
                class="border-green"
                :invalid="showErrorMail()"
                maxlength="100"
            />
            <small class="text-red-500">{{
                showErrorMail() ? "Niepoprawny format." : "&nbsp;"
              }}</small>
          </div>
          <div class="flex flex-col w-full">
            <label for="phone">Telefon</label>
            <InputText
                id="phone"
                v-model="customer.phone"
                maxlength="100"
                :invalid="showErrorPhone()"
            />
            <small class="text-red-500">{{
                showErrorPhone() ? "Niepoprawny format." : "&nbsp;"
              }}</small>
          </div>
        </div>

        <!-- ROW-6  OTHER INFO  -->
        <div class="row">
          <div class="flex flex-col">
            <label for="input">Dodatkowe informacje:</label>
            <Textarea v-model="customer.info" rows="4" cols="30"/>
          </div>
        </div>

        <!-- ROW-7  BTN SAVE -->
        <div class="flex mt-5 justify-center">
          <OfficeButton
              text="zapisz"
              btn-type="office-save"
              type="submit"
              :is-busy-icon="btnShowBusy"
              :btn-disabled="isSaveBtnDisabled"
          />
        </div>
      </Panel>
    </form>
  </div>
</template>
