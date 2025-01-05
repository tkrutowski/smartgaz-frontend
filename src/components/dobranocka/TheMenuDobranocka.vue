<script setup lang="ts">
import {ref} from 'vue'
import {useAuthorizationStore} from '../../stores/authorization'
import router from '../../router'

const authorizationStore = useAuthorizationStore()
const items = ref([
  {
    label: 'Home',
    icon: 'pi pi-fw pi-home',
    command: () => {
      router.push({name: 'Home'})
    },
  },
  {
    label: 'Tablica',
    icon: 'pi pi-fw pi-clipboard',
    disabled: !authorizationStore.hasAccessDobranocka,
    command: () => {
      router.push({name: 'DobranockaHome'})
    },
  },
  {
    label: "Klienci",
    icon: "pi pi-fw pi-users",
    disabled: !authorizationStore.hasAccessDobranockaCustomer,
    items: [
      {
        label: "Nowy",
        icon: "pi pi-fw pi-user-plus",
        command: () => {
          router.push({
            name: "Customer",
            params: { isEdit: "false", customerId: 0 },
          });
        },
      },
      {
        label: "Lista klientów",
        icon: "pi pi-fw pi-bars",
        command: () => {
          router.push({ name: "Customers" });
        },
      },
    ],
  },
  {
    label: "Finanse",
    icon: "pi pi-fw pi-euro",
    disabled: true,
    items: [
      {
        label: "Nowa faktura",
        icon: "pi pi-fw pi-file",
        // to: { name: "Invoice", params: { isEdit: "false", invoiceId: 0 } },
        command: () => {
          // router.push({
          //   name: "Invoice",
          //   params: { isEdit: "false", invoiceId: 0 },
          // });
        },
      },
      {
        label: "Lista faktur",
        icon: "pi pi-fw pi-list",
        // to: { name: "Invoices" },
        // command: () => {
        //   router.push({ name: "Invoices" });
        // },
      },
    ],
  },
])
</script>

<template>
  <Menubar :model="items">
    <template #start>
<!--      <img alt="logo" src="@/assets/logo_mini.png" height="30" class="mr-2"/>-->
    </template>
    <template #end>
      <div v-if="!authorizationStore.isAuthenticatedOrToken">
        <router-link :to="{ name: 'login' }" style="text-decoration: none">
          <Button class="font-bold uppercase tracking-wider" size="small" outlined>zaloguj</Button>
        </router-link>
      </div>
      <div v-else>
        <Button
            class="font-bold uppercase tracking-wider"
            outlined
            size="small"
            :onclick="authorizationStore.logout"
        >wyloguj
        </Button>
      </div>
    </template>
  </Menubar>
</template>
<style scoped></style>
