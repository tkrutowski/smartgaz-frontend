<script setup lang="ts">
import {useRoomStore} from "@/stores/rooms.ts";
import {useRoute} from "vue-router";
import {computed, onMounted, ref} from "vue";
import OfficeButton from "@/components/OfficeButton.vue";
import {useToast} from "primevue/usetoast";
import router from "@/router";
import type {AxiosError} from "axios";
import OfficeIconButton from "@/components/OfficeIconButton.vue";
import TheMenuDobranocka from "@/components/dobranocka/TheMenuDobranocka.vue";
import type {Bed, Room} from "@/types/Room.ts";
import {BedStatus, BedType} from "@/types/Room.ts";
import {UtilsService} from "@/service/UtilsService.ts";
import type {DataTableCellEditCompleteEvent} from "primevue/datatable";
import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
import {RentService} from "@/service/RentService.ts";
import {TranslationService} from "@/service/TranslationService.ts";

const roomStore = useRoomStore();
const route = useRoute();

const toast = useToast();
const room = ref<Room>({
  id: 0,
  name: "",
  color: "fa0505",
  beds: [],
  info: "",
});

const bedToRemove = ref<Bed | null>(null);
const bed = ref<Bed>({
  id: 0,
  name: "",
  type: BedType.SINGLE,
  status: BedStatus.AVAILABLE,
  priceDay: 35,
  priceMonth: 700,
});


const btnSaveDisabled = ref<boolean>(false);
const btnShowBusy = ref<boolean>(false);

const isSaveBtnDisabled = computed(() => {
  return (
      roomStore.loadingRooms ||
      btnSaveDisabled.value
  );
});
//
//SAVE
//
function saveRoom() {
  submitted.value = true;
  if (isEdit.value) {
    editRoom();
  } else {
    newRoom();
  }
}

//
//---------------------------------------------------------NEW ROOM----------------------------------------------
//
async function newRoom() {
  console.log("newRoom()");
  if (isNotValid()) {
    showError("Uzupełnij brakujące elementy");
  } else {
    btnSaveDisabled.value = true;
    btnShowBusy.value = true;
    await roomStore.addRoomDb(room.value).then(() => {
      toast.add({
        severity: "success",
        summary: "Potwierdzenie",
        detail: "Zapisano pokój: " + room.value.name,
        life: 3000,
      });
      setTimeout(() => {
        btnSaveDisabled.value = false;
        router.push({name: "Rooms"});
      }, 2000);
    }).catch((reason: AxiosError) => {
      btnSaveDisabled.value = false
      if (reason.response?.status === 409) {
        toast.add({
          severity: 'warn',
          summary: reason.message,
          detail: 'Pokój o tej nazwię już istnieje w bazie danych.',
          life: 5000,
        })
      } else {
        toast.add({
          severity: "error",
          summary: "Błąd podczas dodawania pokoju.",
          detail: reason.message,
          life: 5000,
        });
      }
    }).finally(() => {
      btnShowBusy.value = false;
    })
    submitted.value = false;
  }
}

//
// ---------------------------------------------------------NEW BED---------------------------------------
//
function newBed() {
  bed.value.name = "nazwa";
  bed.value.type = BedType.SINGLE;
  bed.value.status = BedStatus.AVAILABLE;
  bed.value.priceDay = 35;
  bed.value.priceMonth = 700;

  room.value.beds.push({...bed.value})
}

//
//-----------------------------------------------------EDIT ROOM------------------------------------------------
//
const isEdit = ref<boolean>(false);

async function editRoom() {
  if (isNotValid()) {
    showError("Uzupełnij brakujące elementy");
  } else {
    btnSaveDisabled.value = true;
    btnShowBusy.value = true;
    await roomStore.updateRoomDb(room.value)
        .then(() => {
          toast.add({
            severity: "success",
            summary: "Potwierdzenie",
            detail: "Zaaktualizowano dane pokoju: " + room.value.name,
            life: 3000,
          });
          setTimeout(() => {
            btnSaveDisabled.value = false
            router.push({name: "Rooms"});
          }, 3000);
        }).catch((reason: AxiosError) => {
          btnSaveDisabled.value = false
          toast.add({
            severity: "error",
            summary: "Błąd podczas edycji pokoju.",
            detail: (reason?.response?.data as { message: string }).message,
            life: 5000,
          });
        }).finally(() => {
          btnShowBusy.value = false;
        })
  }
  submitted.value = false;
}

const onCellEditComplete = (event: DataTableCellEditCompleteEvent) => {
  let {data, newValue, field, originalEvent} = event;

  switch (field) {
    case 'priceDay':
    case 'priceMonth':
      if (UtilsService.isPositiveFloat(newValue)) data[field] = newValue;
      else originalEvent.preventDefault();
      break;
    case 'vat':
      data[field] = newValue;
      break;

    default:
      if (newValue.trim().length > 0) data[field] = newValue;
      else originalEvent.preventDefault();
      break;
  }
};
//
//------------------------------------------DELETE BED MODAL----------------------------------------------
//
const showDeleteConfirmationDialog = ref<boolean>(false);
const bedDeleteItemIndex = ref<number>(-1);
const confirmDeleteItem = (item: Bed, index: number) => {
  bedToRemove.value = item;
  bedDeleteItemIndex.value = index;
  showDeleteConfirmationDialog.value = true;
};

const deleteConfirmationMessage = computed(() => {
  if (bedToRemove.value)
    return `Czy chcesz usunąc łóżko <b>${bedToRemove.value.name}</b>?`;
  return "No message";
});


const submitDelete = async () => {
  console.log("submitDelete()",bedDeleteItemIndex.value, room.value.beds);
  if (room.value) {
    if (bedDeleteItemIndex.value !== -1)
      room.value.beds.splice(bedDeleteItemIndex.value, 1);
  }
  showDeleteConfirmationDialog.value = false;
};


//
//-----------------------------------------------------MOUNTED-------------------------------------------------------
//
onMounted(async () => {
  console.log("onMounted EDIT", route.params);
  btnSaveDisabled.value = true;
  isEdit.value = route.params.isEdit === "true";
  if (!isEdit.value) {
    console.log("onMounted NEW ROOM");
  } else {
    console.log("onMounted EDIT ROOM");
    const roomId = Number(route.params.roomId as string);
    roomStore
        .getRoomFromDb(roomId)
        .then((data: Room | null) => {
          if (data) {
            room.value = data;
          }
        })
        .catch((error: AxiosError) => {
          console.error("Błąd podczas pobierania pokoju:", error);
        });
  }
  btnSaveDisabled.value = false;
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
      showErrorName()
  );
};
const showErrorName = () => {
  return submitted.value && room.value.name.length <= 0;
};

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
  <div class="m-4 max-w-6xl mx-auto">
    <form
        class="col-12 col-md-9 col-xl-6 align-self-center"
        @submit.stop.prevent="saveRoom"
    >
      <Panel>
        <template #header>
          <OfficeIconButton
              class="text-primary-500"
              title="Powrót do listy pokoi"
              icon="pi pi-fw pi-table"
              @click="() => router.push({ name: 'Rooms' })"
          />
          <div class="w-full flex justify-center gap-4">
            <span class="text-2xl">
              {{ isEdit ? `Edycja danych` : "Nowy pokój" }}
            </span>
            <div v-if="roomStore.loadingRooms">
              <ProgressSpinner
                  class="ml-3"
                  style="width: 30px; height: 30px"
                  stroke-width="5"
              />
            </div>
          </div>
        </template>


        <!-- ROW-1   NAME / COLOR -->
        <div class="flex flex-col w-full">
          <label class="pl-2" for="input">Nazwa
            <ColorPicker class="pb-1" id="colorCompleted" v-model="room.color" format="hex"/>
          </label>
          <InputText
              id="input"
              v-model="room.name"
              maxlength="100"
              :invalid="showErrorName()"

          />
          <small class="text-red-500">{{
              showErrorName() ? "Pole jest wymagane." : "&nbsp;"
            }}</small>
        </div>

        <!-- TABLE BEDS -->
        <Panel class="max-w-full">
          <template #header>
            <div class="flex w-full justify-between">
              <p class="">Łóżka</p>
              <OfficeButton
                  title="Podaj nowe łóżko."
                  text="Dodaj"
                  btn-type="office-regular"
                  type="button"
                  @click="newBed"
              />
            </div>
          </template>
          <DataTable :value="room.beds" size="small"
                     editMode="cell" dataKey="id" @cell-edit-complete="onCellEditComplete">
            <!-- NAME -->
            <Column field="name" header="Nazwa"
                    class="min-w-32 hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
              <template #editor="{ data, field }">
                <InputText v-model="data[field]" fluid @focus="UtilsService.selectText"/>
              </template>
            </Column>

            <!-- BED TYPE -->
            <Column field="type" header="Rodzaj"
                    class="hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
              <template #body="{ data }">
                {{ TranslationService.translateEnum("BedType", data.type) }}
              </template>
              <template #editor="{ data, field }">
                <Select v-model="data[field]" :options="RentService.getBedTypeOption()"
                        option-label="label"
                        option-value="value"
                        placeholder="Wybierz..." fluid/>
              </template>
            </Column>


            <!-- AMOUNT DAY-->
            <Column field="priceDay" header="Cena/dzień"
                    class="min-w-16 hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
              <template #body="{ data }">
                <div style="text-align: center">
                  {{ UtilsService.formatCurrency(data.priceDay) }}
                </div>
              </template>
              <template #editor="{ data, field }">
                <InputNumber v-model="data[field]" mode="currency" currency="PLN" locale="pl-PL" fluid @focus="UtilsService.selectText"/>
              </template>
            </Column>

            <!-- AMOUNT MONTH-->
            <Column field="priceMonth" header="Cena/mc"
                    class="min-w-16 hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
              <template #body="{ data }">
                <div style="text-align: center">
                  {{ UtilsService.formatCurrency(data.priceMonth) }}
                </div>
              </template>
              <template #editor="{ data, field }">
                <InputNumber v-model="data[field]" mode="currency" currency="PLN" locale="pl-PL" fluid @focus="UtilsService.selectText"/>
              </template>
            </Column>

            <!-- BED STATUS -->
            <Column field="status" header="Stan"
                    class="hover:cursor-pointer dark:hover:bg-green-950 hover:bg-green-100">
              <template #body="{ data }">
                {{ TranslationService.translateEnum("BedStatus", data.status) }}
              </template>
              <template #editor="{ data, field }">
                <Select v-model="data[field]" :options="  RentService.getBedStatusOption()"
                        option-label="label"
                        option-value="value"
                        placeholder="Wybierz..." fluid/>
              </template>
            </Column>

            <template #empty>
              <span class="text-red-500">Uzupełnij dane..</span>
            </template>

            <!--                EDIT, DELETE-->
            <Column
                header="Akcja"
                :exportable="false"
            >
              <template #body="slotProps">
                <OfficeIconButton
                    title="Usuń łóżko."
                    icon="pi pi-trash"
                    class="text-red-500"
                    @click="
                        confirmDeleteItem(slotProps.data, slotProps.index)
                      "
                />
              </template>
            </Column>
          </DataTable>
        </Panel>

        <!-- ROW-3  OTHER INFO  -->
          <div class="flex flex-col mt-4">
            <label class="pl-2" for="input">Dodatkowe informacje:</label>
            <Textarea v-model="room.info" rows="4" cols="30"/>
          </div>

        <!-- ROW-4  BTN SAVE -->
        <div class="flex mt-5 justify-center">
          <OfficeButton
              text="zapisz"
              btn-type="office-save"
              type="submit"
              :loading="btnShowBusy"
              :btn-disabled="isSaveBtnDisabled"
          />
        </div>
      </Panel>
    </form>
  </div>
</template>
