<script setup lang="ts">
import OfficeButton from '@/components/OfficeButton.vue'
import {type PropType, ref, watch} from "vue";
import {type Reservation, type ReservationBed} from "@/types/Room.ts";
import {useRoomStore} from "@/stores/rooms.ts";
import {useInvoiceStore} from "@/stores/invoices.ts";
import type {Invoice} from "@/types/Invoice.ts";
import {TranslationService} from "@/service/TranslationService.ts";
import {UtilsService} from "@/service/UtilsService.ts";
import {RentService} from "@/service/RentService.ts";

const invoiceStore = useInvoiceStore();
const roomStore = useRoomStore();
const invoice = ref<Invoice | null>(null);
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
      reservation.value = newValue
      if (reservation.value?.invoiceId && reservation.value?.invoiceId > 0) {
        invoiceStore.getInvoiceFromDb(reservation.value.invoiceId)
            .then((inv: Invoice) => {
              invoice.value = inv;
            })
      } else {
        invoice.value = null;
      }
    },
    {immediate: true},
)
const calculateNet = ((item: ReservationBed) => {
  if (item && reservation.value.startDate && reservation.value.endDate) {
    const perMonth: number = item.priceMonth * RentService.calculateRentPeriodArray(reservation.value.startDate, reservation.value.endDate)[0]
    const perDay: number = item.priceDay * RentService.calculateRentPeriodArray(reservation.value.startDate, reservation.value.endDate)[1]
    return perMonth + perDay
  }
  return 0
});
const calculateNetSum = (() => {
  return reservation.value.beds.reduce((acc, bed) => acc + calculateNet(bed), 0);
});
</script>

<template>
  <Dialog :style="{ width: '550px' }" header="Szczegóły rezerwacji" :modal="true">

    <!--  CUSTOMER  -->
    <Fieldset legend="Klient" class="relative">
      <router-link class=""
                   :to="{ name: 'Customer', params: { isEdit: 'true', customerId: reservation.customer?.id || 0 } }"
                   style="text-decoration: none"
      >
        <OfficeButton class="absolute top-1 right-3" text="Klient" btn-type="office-regular"/>
      </router-link>
      <div class="flex flex-col gap-2 justify-center">
        <p class="text-sm">Nazwa:<span
            class="ml-2 font-semibold"> {{ reservation?.customer?.name }} {{ reservation?.customer?.firstName }}</span>
        </p>
        <p class="text-sm">
          Tel:
          <a :href="'tel:' + reservation?.customer?.phone" class="ml-2 font-semibold">
            {{ reservation?.customer?.phone }}
          </a>
        </p>
        <p class="text-sm">
          Mail:
          <a :href="'mailto:' + reservation?.customer?.mail" class="ml-2 font-semibold">
            {{ reservation?.customer?.mail }}
          </a>
        </p>
      </div>
    </Fieldset>

    <!--  INVOICE  -->
    <Fieldset legend="Finanse" class="relative">
      <router-link class=""
                   :to="{ name: 'Invoice', params: { isEdit: 'true', invoiceId: invoice?.idInvoice || 0 } }"
                   style="text-decoration: none"
      >
        <OfficeButton class="absolute top-1 right-3" text="Faktura" btn-type="office-regular"
                      :btn-disabled="invoice == null"/>
      </router-link>
      <div class="flex flex-col gap-2 justify-center">
        <p class="text-sm">Faktura nr:<span class="ml-2 font-semibold"> {{ invoice?.number }}</span></p>
        <p class="text-sm">Kwota do zapłaty:<span
            class="ml-2 font-semibold">{{ UtilsService.formatCurrency(calculateNetSum()) }}</span></p>
        <p class="text-sm" v-if="invoice">Płatność:<span
            class="ml-2 font-semibold"> {{
            TranslationService.translateEnum("PaymentStatus", String(invoice?.paymentStatus))
          }}</span>
        </p>
        <p class="text-sm">Zaliczka:<span
            class="ml-2 font-semibold"> {{ UtilsService.formatCurrency(reservation.advance) }}</span></p>
        <p class="text-sm">Kaucja:<span
            class="ml-2 font-semibold"> {{ UtilsService.formatCurrency(reservation.deposit) }}</span></p>
      </div>
    </Fieldset>

    <!--    RESERVATION  -->
    <Fieldset legend="Rezerwacja" class="relative">
      <router-link
          :to="{ name: 'Reservation', params: { reservationId: reservation.id || 0 } }"
          style="text-decoration: none"
      >
        <OfficeButton class="absolute top-5 md:top-1 right-3" text="Rezerwacja" btn-type="office-regular"/>
      </router-link>
      <p class="text-sm">Rezerwacja nr:<span class="ml-2 font-semibold"> {{ reservation.number }}</span></p>
      <p class="text-sm mb-2">Data pobytu:<span
          class="ml-2 font-semibold">{{ reservation.startDate }} - {{ reservation.endDate }}</span></p>
      <div class="flex flex-col gap-2 justify-center" v-for="bed in reservation.beds" :key="bed.bed.id">
        <p class="text-sm">Miejsce:<span
            class="ml-2 font-semibold">{{ roomStore.getRoomByBed(bed.bed.id)?.name }} / {{ bed.bed.name }}</span></p>
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

