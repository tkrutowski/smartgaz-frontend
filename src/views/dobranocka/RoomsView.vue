<script setup lang="ts">
import {useRoomStore} from "../../stores/rooms.ts";
import RoomDisplay from "../../components/dobranocka/RoomDisplay.vue";
import type {Room} from "../../types/Room"
import {computed, onMounted, ref} from "vue";
import TheMenuDobranocka from "../../components/dobranocka/TheMenuDobranocka.vue";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";
import type {AxiosError} from "axios";
import {useToast} from "primevue/usetoast";
const roomStore = useRoomStore();
const toast = useToast()

onMounted(() => roomStore.getRooms())

const showDeleteConfirmationDialog = ref<boolean>(false)
const roomToRemove = ref<Room | null>(null)
const confirmDelete = (room: Room) => {
  roomToRemove.value = room
  showDeleteConfirmationDialog.value = true
}
const deleteConfirmationMessage = computed(() => {
  if (roomToRemove.value)
    return `Czy chcesz usunąc pokój: <b>${roomToRemove.value.name}</b>?`
  return 'No message'
})
const submitDelete = async () => {
  console.log('submitDelete()')
  showDeleteConfirmationDialog.value = false
  if (roomToRemove.value) {
    await roomStore.deleteRoomDb(roomToRemove.value.id).then(() => {
      toast.add({
        severity: 'success',
        summary: 'Potwierdzenie',
        detail: 'Usunięto pokój: ' + roomToRemove.value?.name,
        life: 3000,
      })
    }).catch((reason: AxiosError) => {
      toast.add({
        severity: 'error',
        summary: 'Błąd podczas usuwania pokoju: ' + roomToRemove.value?.name,
        detail: (reason?.response?.data as { message: string }).message,
        life: 5000,
      })
    })
  }
}
</script>

<template>
  <TheMenuDobranocka/>
  <ConfirmationDialog
      v-model:visible="showDeleteConfirmationDialog"
      :msg="deleteConfirmationMessage"
      label="Usuń"
      @save="submitDelete"
      @cancel="showDeleteConfirmationDialog = false"
  />
  <div class="flex flex-col md:flex-row flex-wrap justify-center p-2 gap-4">
    <div v-for="room in roomStore.rooms" :key="room.id">
      <RoomDisplay class="md:max-w-[335px]" :room="room" @delete="confirmDelete"/>
    </div>
  </div>

</template>
