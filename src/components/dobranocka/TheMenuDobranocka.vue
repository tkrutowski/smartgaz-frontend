<script setup lang="ts">
import {computed, ref} from 'vue'
import {useAuthorizationStore} from '@/stores/authorization'
import router from '@/router'
import {useRoute} from 'vue-router';

const route = useRoute();
const authorizationStore = useAuthorizationStore()
const activeMenu = computed(() => {
  // console.log('activeMenu', route.path)
  if (route.path.includes('/home')) return 'Tablica';
  if (route.path.includes('/customer')) return 'Klienci';
  if (route.path.includes('/finance')) return 'Finanse';
  if (route.path.includes('/company')) return 'Dane firmy';
  if (route.path.includes('/room')) return 'Pokoje';
  if (route.path.includes('/reservation')) return 'Rezerwacje';
  if (route.path.includes('/calendar')) return 'Kalendarz';
  return null; // Jeśli nie pasuje do żadnego menu
});

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
    class: `${activeMenu.value === 'Tablica' ? 'active' : ''}`,
    disabled: !authorizationStore.hasAccessDobranocka,
    command: () => {
      if (window.location.href.includes(router.resolve({name: 'DobranockaHome'}).href)) {
        const redirect = JSON.stringify({name: 'DobranockaHome'})
        router.push({path: '/refresh', query: {redirect: redirect}})
      } else {
        router.push({name: 'DobranockaHome'})
      }
    },
  },
  {
    label: "Klienci",
    icon: "pi pi-fw pi-users",
    class: `${activeMenu.value === 'Klienci' ? 'active' : ''}`,
    disabled: !authorizationStore.hasAccessDobranockaCustomer,
    items: [
      {
        label: "Nowy",
        icon: "pi pi-fw pi-user-plus",
        command: () => {
          router.push({
            name: "Customer",
            params: {isEdit: "false", customerId: 0},
          });
        },
      },
      {
        label: "Lista klientów",
        icon: "pi pi-fw pi-bars",
        command: () => {
          if (window.location.href.includes(router.resolve({name: 'Customers'}).href)) {
            const redirect = JSON.stringify({name: 'Customers'})
            router.push({path: '/refresh', query: {redirect: redirect}})
          } else {
            router.push({name: 'Customers'})
          }
        },
      },
    ],
  },
  {
    label: "Finanse",
    icon: "pi pi-fw pi-money-bill",
    class: `${activeMenu.value === 'Finanse' ? 'active' : ''}`,
    disabled: !authorizationStore.hasAccessDobranockaInvoice,
    items: [
      {
        label: "Nowa faktura",
        icon: "pi pi-fw pi-file",
        command: () => {
          router.push({
            name: "Invoice",
            params: {isEdit: "false", invoiceId: 0},
          });
        },
      },
      {
        label: "Lista faktur",
        icon: "pi pi-fw pi-list",
        command: () => {
          if (window.location.href.includes(router.resolve({name: 'Invoices'}).href)) {
            const redirect = JSON.stringify({name: 'Invoices'})
            router.push({path: '/refresh', query: {redirect: redirect}})
          } else {
            router.push({name: 'Invoices'})
          }
        },
      },
      {
        separator: true
      },
      {
        label: "Dane firmy",
        icon: "pi pi-fw pi-building",
        class: `${activeMenu.value === 'Dane firmy' ? 'active' : ''}`,
        disabled: !authorizationStore.hasAccessDobranockaCompany,
        command: () => {
          router.push({name: "Company"});
        },
      },
      {
        separator: true
      },
      {
        label: "Bank",
        icon: "pi pi-fw pi-building-columns",
        command: () => {
          window.open("https://ingbusiness.pl/gib/login", "_blank");
        }
      },
    ],
  },
  {
    label: 'Pokoje',
    icon: 'pi pi-home',
    class: `${activeMenu.value === 'Pokoje' ? 'active' : ''}`,
    disabled: !authorizationStore.hasAccessDobranockaRoom,
    items: [
      {
        label: 'Nowy pokój',
        icon: 'pi pi-plus',
        command: () => {
          router.push({
            name: 'Room',
            params: {isEdit: 'false', roomId: 0},
          })
        },
      },
      {
        label: 'Lista pokoi',
        icon: 'pi pi-fw pi-list',
        command: () => {
          if (window.location.href.includes(router.resolve({name: 'Rooms'}).href)) {
            const redirect = JSON.stringify({name: 'Rooms'})
            router.push({path: '/refresh', query: {redirect: redirect}})
          } else {
            router.push({name: 'Rooms'})
          }
        },
      },
    ],
  },
  {
    label: 'Rezerwacje',
    icon: 'pi pi-desktop',
    class: `${activeMenu.value === 'Rezerwacje' ? 'active' : ''}`,
    disabled: !authorizationStore.hasAccessDobranockaReservation,
    items: [
      {
        label: 'Nowa rezerwacja',
        icon: 'pi pi-plus',
        command: () => {
          router.push({
            name: 'ReservationSearch',
          })
        },
      },
      {
        label: 'Lista rezerwacji',
        icon: 'pi pi-fw pi-list',
        command: () => {
          if (window.location.href.includes(router.resolve({name: 'Reservations'}).href)) {
            const redirect = JSON.stringify({name: 'Reservations'})
            router.push({path: '/refresh', query: {redirect: redirect}})
          } else {
            router.push({name: 'Reservations'})
          }
        },
      },
    ],
  },

  {
    label: 'Kalendarz',
    icon: 'pi pi-calendar',
    class: `${activeMenu.value === 'Kalendarz' ? 'active' : ''}`,
    disabled: !authorizationStore.hasAccessDobranockaCalendar,
    command: () => {
      if (window.location.href.includes(router.resolve({name: 'Calendar'}).href)) {
        const redirect = JSON.stringify({name: 'Calendar'})
        router.push({path: '/refresh', query: {redirect: redirect}})
      } else {
        router.push({name: 'Calendar'})
      }
    },
  },
])
</script>

<template>
  <Menubar :model="items">
    <template #start>
      <!--      <img alt="logo" src="@/assets/logo_mini.png" height="30" class="mr-2"/>-->
    </template>
    <template #end>
      <div class="flex items-center">
        <p class="px-5 mr-10 text-lg md:hidden text-primary font-bold">{{ activeMenu }}</p>
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
      </div>
    </template>
  </Menubar>
</template>
<style scoped></style>
