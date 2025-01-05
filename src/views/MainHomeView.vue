<script setup lang="ts">
import TheMenu from '../components/TheMenu.vue'
import { useAuthorizationStore } from '../stores/authorization'
import AppCard from '../components/AppCard.vue'
import router from '../router'

const authorizationStore = useAuthorizationStore()

function runDobranocka() {
  console.log('START - runDobranocka()')
  if (authorizationStore.hasAccessDobranocka) {
    router.push({
      name: 'DobranockaHome',
    })
  }
}

function runSmartgaz() {
  console.log('START - library()')
  // if (authorizationStore.hasAccessSmartgaz) {
  //   router.push({
  //     name: 'LibraryHome',
  //   })
  // }
}

</script>

<template>
  <TheMenu />
  <h1
    v-if="!authorizationStore.isAuthenticatedOrToken"
    class="color-office flex justify-center mt-8"
  >
    Musisz się najpierw zalogować... ;)
  </h1>
  <div v-else class="flex flex-col justify-center gap-4 mt-5 md:flex-row">
    <AppCard
        class="mx-2 "
      text-content="Wynajem pokoi na łóżka"
      text-title="Dobranocka"
      :disabled="!authorizationStore.hasAccessDobranocka"
      @clicked="runDobranocka"
    />
    <AppCard
        class="mx-2 "
      text-content="Projekty przyłączy gazowych"
      text-title="SmartGaz"
      :disabled="!authorizationStore.hasAccessSmartgaz"
      @clicked="runSmartgaz"
    />
  </div>
</template>

<style scoped></style>
