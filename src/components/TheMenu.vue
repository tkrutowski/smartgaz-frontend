<script setup lang="ts">
import {computed, ref} from 'vue'
import {useAuthorizationStore} from '@/stores/authorization'
import router from '@/router'
import OfficeIconButton from "@/components/OfficeIconButton.vue";
import {useUsersStore} from "@/stores/users.ts";
import {useCustomerStore} from "@/stores/customers.ts";
import {useInvoiceStore} from "@/stores/invoices.ts";
import {useReservationStore} from "@/stores/reservation.ts";
import {useRoomStore} from "@/stores/rooms.ts";

const authorizationStore = useAuthorizationStore()
const userStore = useUsersStore()

const customerStore = useCustomerStore()
const invoiceStore = useInvoiceStore()
const reservationStore = useReservationStore()
const roomStore = useRoomStore()

const allLoading = computed(() => {
  return userStore.someLoading || authorizationStore.loading || customerStore.loadingCustomer || invoiceStore.someLoading || reservationStore.loadingReservation || roomStore.loadingRooms;
});

const items = ref([
  {
    label: 'Home',
    icon: 'pi pi-fw pi-home',
    // to: { name: "Home" },
    command: () => {
      router.push({name: 'Home'})
    },
  },
  {
    label: 'Administracja',
    icon: 'pi pi-fw pi-user',
    visible: authorizationStore.hasAccessAdmin,
    items: [
      {
        label: 'Użytkownicy',
        icon: 'pi pi-fw pi-users',
        disabled: true,
        // to: { name: "Invoice", params: { isEdit: "false", invoiceId: 0 } },
        command: () => {
          router.push({
            name: 'Book',
            params: { isEdit: 'false', bookId: 0 },
          })
        },
      },
      {
        label: 'Uprawnienia ',
        icon: 'pi pi-fw pi-folder-open',
        disabled: !authorizationStore.hasAccessAdmin,
        command: () => {
          if (window.location.href.includes(router.resolve({ name: 'Privileges' }).href)) {
            const redirect = JSON.stringify({ name: 'Privileges' })
            router.push({ path: '/refresh', query: { redirect: redirect } })
          } else {
            router.push({ name: 'Privileges' })
          }
        },
      },
      {
        label: 'Logi ',
        icon: 'pi pi-fw pi-chart-bar',
        disabled: !authorizationStore.hasAccessAdmin,
        command: () => {
          if (window.location.href.includes(router.resolve({ name: 'Logs' }).href)) {
            const redirect = JSON.stringify({ name: 'Logs' })
            router.push({ path: '/refresh', query: { redirect: redirect } })
          } else {
            router.push({ name: 'Logs' })
          }
        },
      },
    ],
  },
])
</script>

<template>
  <Menubar :model="items">
    <template #start>
<!--      <img alt="logo" src="@/assets/logo_mini.png" height="30" class="mr-2" />-->
    </template>
    <template #end>
      <div class="flex flex-row gap-4 text-green-500">
        <OfficeIconButton
            class="cursor-default"
            icon="pi pi-check-square"
            :loading="allLoading"
            title="Określa, czy wyświetlane dane są aktualne."
        />
        <div v-if="!authorizationStore.isAuthenticatedOrToken">
          <router-link :to="{ name: 'login' }" style="text-decoration: none">
            <Button class="font-bold uppercase tracking-wider" outlined>zaloguj</Button>
          </router-link>
        </div>
        <div v-else>
          <Button
              class="font-bold uppercase tracking-wider"
              outlined
              :onclick="authorizationStore.logout"
          >wyloguj
          </Button
          >
        </div>
      </div>
    </template>
  </Menubar>
</template>
<style scoped></style>
