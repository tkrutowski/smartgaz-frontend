<script setup lang="ts">
import OfficeButton from '@/components/OfficeButton.vue'
import {ref} from "vue";

defineProps({
  msg: {
    type: String,
    required: true,
    default: 'NO MESSAGE',
  },
  label: {
    type: String,
    required: false,
    default: 'Zapisz',
  },
})
const emit = defineEmits<{
  (e: 'save'): void
  (e: 'cancel'): void
}>()

const save = () => {
  emit('save')
}

const cancel = () => {
  emit('cancel')
}
const selectedOption = ref(null)
</script>

<template>
  <Dialog :style="{ width: '550px' }" header="Potwierdzenie" :modal="true">
    <div class="confirmation-content">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-html="msg"></span>

    </div>
    <Select v-model="selectedOption" :options=""
            option-label="label"
            option-value="value"
            placeholder="Wybierz..." fluid/>
    <template #footer>
      <div class="flex flex-row gap-3 justify-content-end">
        <OfficeButton
            text="Anuluj"
            btn-type="office-regular"
            @click="cancel"
            @abort="cancel"
        ></OfficeButton>
        <OfficeButton :text="label" btn-type="office-save" @click="save"></OfficeButton>
      </div>
    </template>
  </Dialog>
</template>

<style scoped></style>
