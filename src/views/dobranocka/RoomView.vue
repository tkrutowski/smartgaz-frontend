<script setup lang="ts">
import {useRoomStore} from "../../stores/rooms.ts";
import {useRoute} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import OfficeButton from "../../components/OfficeButton.vue";
import {useToast} from "primevue/usetoast";
import router from "../../router";
import type {AxiosError} from "axios";
import OfficeIconButton from "../../components/OfficeIconButton.vue";
import TheMenuDobranocka from "../../components/dobranocka/TheMenuDobranocka.vue";
import type {BedType, Room} from "../../types/Room.ts";
import {UtilsService} from "../../service/UtilsService.ts";

const roomStore = useRoomStore();
const route = useRoute();

const toast = useToast();
const room = ref<Room>({
  id: 0,
  name: "",
  color: "",
  beds: [],
  price: 0,
  info: "",
});

const singleBed = ref<number>(0)
const doubleBed = ref<number>(0)
const isBedChange = ref<boolean>(false)
const btnSaveDisabled = ref<boolean>(false);
const btnShowBusy = ref<boolean>(false);

watch([singleBed, doubleBed], () => {
  isBedChange.value = true;
});

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
    if (singleBed.value > 0) addBedToList("SINGLE", singleBed.value)
    if (doubleBed.value > 0) addBedToList("DOUBLE", doubleBed.value)
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
          summary: reason.message,
          detail: "Błąd podczas dodawania pokoju.",
          life: 3000,
        });
      }
    }).finally(() => {
      btnShowBusy.value = false;
    })
    submitted.value = false;
  }
}

function addBedToList(type: BedType, quantity: number) {
  for (let i = 0; i < quantity; i++) {
    room.value.beds.push(type)
  }
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
    if (isBedChange.value) {
      room.value.beds = []
      if (singleBed.value > 0) addBedToList("SINGLE", singleBed.value)
      if (doubleBed.value > 0) addBedToList("DOUBLE", doubleBed.value)
    }
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
          toast.add({
            severity: "error",
            summary: reason.message,
            detail: "Błąd podczas edycji pokoju.",
            life: 3000,
          });
        }).finally(() => {
          btnShowBusy.value = false;
        })
  }
  submitted.value = false;
}

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
            singleBed.value = room.value.beds.filter((typ: BedType) => typ === "SINGLE").length
            doubleBed.value = room.value.beds.filter((typ: BedType) => typ === "DOUBLE").length
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
    life: 3000,
  });
};
const isNotValid = () => {
  return (
      showErrorName() ||
      showErrorPrice()
  );
};
const showErrorName = () => {
  return submitted.value && room.value.name.length <= 0;
};
const showErrorPrice = () => {
  return submitted.value && room.value.price <= 0
}

</script>

<template>
  <TheMenuDobranocka/>
  <div class="m-4 max-w-6xl mx-auto">
    <form
        class="col-12 col-md-9 col-xl-6 align-self-center"
        @submit.stop.prevent="saveRoom"
    >
      <Panel>
        <template #header>
          <OfficeIconButton
              title="Powrót do listy pokoi"
              icon="pi pi-fw pi-list"
              @click="() => router.push({ name: 'Rooms' })"
          />
          <div class="w-full flex justify-center gap-4">
            <span class="text-2xl">
              {{ isEdit ? `Edycja danych pokoi` : "Nowy pokój" }}
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

        <!-- ROW-2 BEDS INVOICE NUMBER/YEAR  -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col">
            <label class="pl-2" for="single">Łóżko pojedyńcze</label>
            <InputNumber class=""
                         id="single"
                         v-model="singleBed"
                         mode="decimal"
                         show-buttons
                         :min="0"
                         :max="10"
                         fluid
            />
          </div>
          <div class="flex flex-col">
            <label class="pl-2" for="double">Łóżko podwójne</label>
            <InputNumber
                id="double"
                v-model="doubleBed"
                mode="decimal"
                :use-grouping="false"
                show-buttons
                :min="0"
                :max="10"
                fluid
            />
          </div>
        </div>

        <!-- ROW-3 PRICE  -->
        <div class="flex flex-col w-full  mt-4">
          <label class="ml-2" for="price">Cena netto / mc</label>
          <InputNumber
              id="price"
              v-model="room.price"
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              mode="currency"
              currency="PLN"
              locale="pl-PL"
              @focus="UtilsService.selectText"
              :invalid="showErrorPrice()"

          />
          <small class="text-red-500">{{
              showErrorPrice() ? 'Pole jest wymagane.' : '&nbsp;'
            }}</small>
        </div>

        <!-- ROW-4  OTHER INFO  -->
        <div class="row">
          <div class="flex flex-col mt-4 sm:mt-0">
            <label class="pl-2" for="input">Dodatkowe informacje:</label>
            <Textarea v-model="room.info" rows="4" cols="30"/>
          </div>
        </div>
        <!-- ROW-7  BTN SAVE -->
        <div class="flex mt-5 justify-center">
          <OfficeButton
              text="zapisz"
              btn-type="office-save"
              type="submit"
              :is-busy-icon="btnShowBusy"
              :btn-disabled="isSaveBtnDisabled"
          />
        </div>
      </Panel>
    </form>
  </div>
</template>
