<script lang="ts" setup>
import { useAuthorizationStore } from '../stores/authorization'
import ThemeSwitcher from './ThemeSwitcher.vue'
import InstanceControl from "@/components/InstanceControl.vue";

const authStore = useAuthorizationStore()
</script>

<template>
  <div id="logo-back-mobile" class="w-full p-2">
      <p class="pr-3 pt-2 text-primary text-4xl font-bold">SmartGaz</p>
    <div class="flex flex-col">
      <div class="flex justify-end items-center">
        <InstanceControl :idInstance="'i-0c84ab8759cefd840'" :nameInstance="'Smartgaz'" />
        <theme-switcher />
      </div>
      <p
        v-if="authStore.isAuthenticatedOrToken"
        class="flex justify-end font-bold pr-1 text-primary"
      >
        Użytkownik: {{ authStore.username }}
      </p>
    </div>
  </div>
  <br />
</template>
<style scoped>
#logo-mobile {
  width: 75px;
  height: 75px;
  margin-left: 5px;
  margin-top: 5px;
}

#logo-back-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  width: auto;
  background-color: #515455 !important;
}
</style>
