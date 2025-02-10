<script setup lang="ts">
import OfficeButton from '@/components/OfficeButton.vue'
import {type PropType, ref, watch} from "vue";
import {type Reservation} from "@/types/Room.ts";


const props = defineProps({
  reservation: {
    type: Object as PropType<Reservation>,
    required: true,
  },
})
const emit = defineEmits<{
  (e: 'ok'): void
}>()

const ok = () => {
  emit('ok')
}
const reservation = ref<Reservation>(props.reservation)

watch(
    () => props.reservation,
    (newValue) => {
      console.log("watch",newValue)
      reservation.value = newValue
    },
    { immediate: true },
)
</script>

<template>
  <Dialog :style="{ width: '550px' }" header="Szczegóły rezerwacji" :modal="true">

    <Fieldset legend="Klient">
      <div class="flex flex-col gap-2 justify-center">
      <p class="text-sm">Nazwa:<span class="ml-2 font-semibold"> {{reservation?.customer?.name}} {{reservation?.customer?.firstName}}</span></p>
        <p class="text-sm">Tel:<span class="ml-2 font-semibold">{{reservation?.customer?.phone}}</span></p>
        <p class="text-sm">Mail:<span class="ml-2 font-semibold">{{reservation?.customer?.mail}}</span></p>
      </div>
    </Fieldset>
    <Fieldset legend="Finanse">
      <div class="flex flex-col gap-2 justify-center">
        <p class="text-sm">Faktura nr:<span class="ml-2 font-semibold"> chyba trzeba połączyć fakture z rezerwacją</span></p>
        <p class="text-sm">Kwota:<span class="ml-2 font-semibold">suma czy rozpisane pokoje?</span></p>
        <p class="text-sm">Płatność:<span class="ml-2 font-semibold">co tutaj?</span></p>
      </div>
    </Fieldset>
    <Fieldset legend="???">
      <div class="flex flex-col gap-2 justify-center">
        <p class="text-sm">coś jeszcze?</p>
      </div>
    </Fieldset>
    <template #footer>
      <div class="flex justify-center w-full">
        <OfficeButton
            class="w-20"
            text="OK"
            btn-type="office-regular"
            @click="ok"
            @abort="ok"
        ></OfficeButton>
      </div>
    </template>
  </Dialog>
</template>

