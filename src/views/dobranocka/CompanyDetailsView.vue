<script setup lang="ts">
import {onMounted, ref} from "vue";
import OfficeButton from "@/components/OfficeButton.vue";
import {useToast} from "primevue/usetoast";
import type {AxiosError} from "axios";
import TheMenuDobranocka from "@/components/dobranocka/TheMenuDobranocka.vue";
import type {Company} from "@/types/Company.ts";
import {useSettingsStore} from "@/stores/settings.ts";


const settingStore = useSettingsStore();

const toast = useToast();
const company = ref<Company>({
  name: "",
  city: "",
  zip: "",
  street: "",
  nip: "",
  regon: "",
  phone1: "",
  phone2: "",
  fax: "",
  mail: "",
  www: "",
  bank: "",
  accountNo: "",
  info:""
});

const btnSaveDisabled = ref<boolean>(false);
const btnShowBusy = ref<boolean>(false);


//
//-----------------------------------------------------UPDATE ------------------------------------------------
//

async function saveCompany() {
  submitted.value = true;
  if (isNotValid()) {
    showError("Uzupełnij brakujące elementy");
  } else {
    btnSaveDisabled.value = true;
    btnShowBusy.value = true;
    await settingStore.updateCompanyDb(company.value)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Zaaktualizowano dane firmy",
            life: 3000,
          });
        }).catch((reason: AxiosError) => {
          toast.add({
            severity: "error",
            summary: "Błąd podczas aktualizacji danych firmy.",
            detail: (reason?.response?.data as { message: string }).message,
            life: 5000,
          });
        }).finally(() => {
          btnSaveDisabled.value = false
          btnShowBusy.value = false;
          submitted.value = false;
        })
  }
}

//
//-----------------------------------------------------MOUNTED-------------------------------------------------------
//
onMounted(async () => {
  btnSaveDisabled.value = true;
    console.log("onMounted COMPANY");
    settingStore
        .getCompanyDb()
        .then((data: Company | null) => {
          if (data) {
            company.value = data;
          }
        })
        .catch((error: AxiosError) => {
          console.error("Błąd podczas pobierania danych firmy:", error);
        })
        .finally(() => btnSaveDisabled.value = false);
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
const isNotValid = () => {
  return (
      showErrorName() ||
      showErrorNip() ||
      showErrorRegon() ||
      showErrorStreet() ||
      showErrorZip() ||
      showErrorCity() ||
      showErrorMail() ||
      showErrorPhone1() ||
      showErrorPhone2()
  );
};
const showErrorName = () => {
  return submitted.value && company.value.name.length <= 0;
};
const showErrorNip = () => {
  if (company.value.nip.length > 0) {
    const isTenDigits = /^\d{10}$/.test(company.value.nip);
    return submitted.value && company.value.nip.length > 0 && !isTenDigits;
  }else {
    return false;
  }
};
const showErrorRegon = () => {
  if (submitted.value && company.value.regon.length > 0) {
    const isNineDigits = /^\d{9}$/.test(company.value.regon);
    const isFourteenDigits = /^\d{14}$/.test(company.value.regon);
    return !(isNineDigits || isFourteenDigits);
  } else {
    return false;
  }
};
const showErrorStreet = () => {
  return submitted.value && company.value.street.length <= 0;
};

const showErrorZip = () => {
  if (submitted.value) {
    return (
        !(/(^\d{2}-\d{3}$)/.test(company.value.zip) && company.value.zip.length <= 6) &&
        !(/(^\d{5})/.test(company.value.zip) && company.value.zip.length <= 5)
    );
  }else {
    return false;
  }
};
const showErrorCity = () => {
  return submitted.value && company.value.city.length <= 0;
};
const showErrorMail = () => {
  if (submitted.value && company.value.mail.length > 0) {
    return !company.value.mail.includes("@");
  }
  return false;
};
const showErrorPhone1 = () => {
  if (submitted.value && company.value.phone1.length > 0) {
    return !/^[0-9]+$/.test(company.value.phone1);
  }
  return false;
};
const showErrorPhone2 = () => {
  if (submitted.value && company.value.phone2.length > 0) {
    return !/^[0-9]+$/.test(company.value.phone2);
  }
  return false;
};
const showErrorFax = () => {
  if (submitted.value && company.value.fax.length > 0) {
    return !/^[0-9]+$/.test(company.value.fax);
  }
  return false;
};
</script>

<template>
  <TheMenuDobranocka/>
  <div class="m-4 max-w-6xl mx-auto">
    <form
        class="col-12 col-md-9 col-xl-6 align-self-center"
        @submit.stop.prevent="saveCompany"
    >
      <Panel>
        <template #header>
            <span class="w-full text-2xl md:text-3xl text-center">Dane firmy</span>
        </template>

        <!-- ROW-1  NAME  -->
          <div class="flex flex-col w-full">
            <label for="input">Nazwa</label>
            <InputText
                id="input"
                v-model="company.name"
                :invalid="showErrorName()"
                maxlength="40"
            />
            <small class="text-red-500">{{
                showErrorName() ? "Pole jest wymagane." : "&nbsp;"
              }}</small>
          </div>


        <!-- ROW-2  ADDRESS  -->
        <div class="flex flex-col md:flex-row md:gap-4">
          <div class="flex flex-col w-full">
            <label for="street">Ulica</label>
            <InputText
                id="street"
                v-model="company.street"
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
                v-model="company.zip"
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
                v-model="company.city"
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
                v-model="company.nip"
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
                v-model="company.regon"
                :invalid="showErrorRegon()"
                :useGrouping="false"
            />
            <small class="text-red-500">{{
                showErrorRegon() ? "Pole musi mieć 10 lub 14 znaków." : "&nbsp;"
              }}</small>
          </div>
        </div>

        <!-- ROW-4  FAX / PHONE  -->
        <div class="flex flex-col md:flex-row md:gap-4">
          <div class="flex flex-col w-full">
            <label for="phone">Telefon</label>
            <InputText
                id="phone"
                v-model="company.phone1"
                maxlength="15"
                :invalid="showErrorPhone1()"
            />
            <small class="text-red-500">{{
                showErrorPhone1() ? "Niepoprawny format." : "&nbsp;"
              }}</small>
          </div>
          <div class="flex flex-col w-full">
            <label for="phone2">Telefon</label>
            <InputText
                id="phone2"
                v-model="company.phone2"
                maxlength="15"
                :invalid="showErrorPhone2()"
            />
            <small class="text-red-500">{{
                showErrorPhone2() ? "Niepoprawny format." : "&nbsp;"
              }}</small>
          </div>
          <div class="flex flex-col w-full">
            <label for="phone">Fax</label>
            <InputText
                id="phone"
                v-model="company.fax"
                maxlength="100"
                :invalid="showErrorFax()"
            />
            <small class="text-red-500">{{
                showErrorFax() ? "Niepoprawny format." : "&nbsp;"
              }}</small>
          </div>
        </div>

        <!-- ROW-5  MAIL / WWW  -->
        <div class="flex flex-col md:flex-row md:gap-4">
          <div class="flex flex-col w-full">
            <label for="mail">E-mail</label>
            <InputText
                id="mail"
                v-model="company.mail"
                class="border-green"
                :invalid="showErrorMail()"
                maxlength="100"
            />
            <small class="text-red-500">{{
                showErrorMail() ? "Niepoprawny format." : "&nbsp;"
              }}</small>
          </div>
          <div class="flex flex-col w-full">
            <label for="www">WWW</label>
            <InputText
                id="www"
                v-model="company.www"
                maxlength="100"
            />
          </div>
        </div>

        <!-- ROW-6  BANK / ACCOUNT NO  -->
        <div class="flex flex-col md:flex-row md:gap-4">
          <div class="flex flex-col w-full mt-4 md:mt-0">
            <label for="mail">Nazwa banku</label>
            <InputText
                id="mail"
                v-model="company.bank"
                class="border-green"
                maxlength="30"
            />
          </div>
          <div class="flex flex-col w-full mt-4 md:mt-0">
            <label for="www">Numer konta</label>
            <InputMask
                id="www"
                v-model="company.accountNo"
                mask="99 9999 9999 9999 9999 9999 9999"
            />
          </div>
        </div>
        <!-- ROW-7  OTHER INFO  -->
        <div class="row mt-4">
          <div class="flex flex-col">
            <label for="input">Dodatkowe informacje:</label>
            <Textarea v-model="company.info" rows="4" cols="30"/>
          </div>
        </div>

        <!-- ROW-8  BTN SAVE -->
        <div class="flex mt-5 justify-center">
          <OfficeButton
              text="zapisz"
              btn-type="office-save"
              type="submit"
              :loading="btnShowBusy"
              :btn-disabled="btnSaveDisabled"
          />
        </div>
      </Panel>
    </form>
  </div>
</template>
