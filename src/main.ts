import PrimeVue from 'primevue/config'
import { createApp, markRaw } from 'vue'
import './style.css'
import './assets/tailwind.css'
import App from './App.vue'
import 'primeicons/primeicons.css'
import type { Router } from 'vue-router'
import router from './router'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import ToastService from 'primevue/toastservice'
import {createPinia} from "pinia";
// import {FilterService} from 'primevue/api';
//
// FilterService.filters.customFilter = (rowValue, filterValue) => {
//     console.log(rowValue, filterValue);
//     return rowValue?.id === filterValue?.id;
// };

declare module 'pinia' {
    export interface PiniaCustomProperties {
        router: Router
    }
}

const pinia = createPinia()

pinia.use(({ store }) => {
    store.router = markRaw(router)
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    theme: 'none',
    locale: {
        accept: 'Tak',
        addRule: 'Dodaj regułę',
        am: 'AM',
        apply: 'Zastosuj',
        cancel: 'Anuluj',
        choose: 'Wybierz',
        chooseDate: 'Wybierz datę',
        chooseMonth: 'Wybierz miesiąc',
        chooseYear: 'Wybierz rok',
        clear: 'Wyczyść',
        completed: 'Ukończone',
        contains: 'Zawiera',
        custom: 'Zwyczaj',
        dateAfter: 'Po',
        dateBefore: 'Przed',
        dateFormat: 'dd.mm.yy',
        dateIs: 'Równa',
        dateIsNot: 'Nierówna',
        dayNames: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
        dayNamesMin: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'],
        dayNamesShort: ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'],
        emptyFilterMessage: 'Brak wyników wyszukiwania',
        emptyMessage: 'Brak danych',
        emptySearchMessage: 'Nie znaleziono wyników',
        emptySelectionMessage: 'Brak wybranego elementu',
        endsWith: 'Kończy się na',
        equals: 'Równe',
        fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        filter: 'Filtr',
        firstDayOfWeek: 1,
        gt: 'Większe od',
        gte: 'Większe lub równe',
        lt: 'Mniejsze od',
        lte: 'Mniejsze lub równe',
        matchAll: 'Dopasuj wszystko',
        matchAny: 'Dopasuj dowolne',
        medium: 'Średni',
        monthNames: [
            'Styczeń',
            'Luty',
            'Marzec',
            'Kwiecień',
            'Maj',
            'Czerwiec',
            'Lipiec',
            'Sierpień',
            'Wrzesień',
            'Październik',
            'Listopad',
            'Grudzień',
        ],
        monthNamesShort: [
            'Sty',
            'Lut',
            'Mar',
            'Kwi',
            'Maj',
            'Cze',
            'Lip',
            'Sie',
            'Wrz',
            'Paź',
            'Lis',
            'Gru',
        ],
        nextDecade: 'Następna dekada',
        nextHour: 'Następna godzina',
        nextMinute: 'Następna minuta',
        nextMonth: 'Następny miesiąc',
        nextSecond: 'Następna sekunda',
        nextYear: 'Następny rok',
        noFilter: 'Wyczyść filtr',
        notContains: 'Nie zawiera',
        notEquals: 'Nierówne',
        now: 'Teraz',
        passwordPrompt: 'Wprowadź hasło',
        pending: 'Oczekuje',
        pm: 'PM',
        prevDecade: 'Poprzednia dekada',
        prevHour: 'Poprzednia godzina',
        prevMinute: 'Poprzednia minuta',
        prevMonth: 'Poprzedni miesiąc',
        prevSecond: 'Poprzednia sekunda',
        prevYear: 'Poprzedni rok',
        quarterNames: ['I Kwartał', 'II Kwartał', 'III Kwartał', 'IV Kwartał'],
        quarterNamesShort: ['I Kw', 'II Kw', 'III Kw', 'IV Kw'],
        reject: 'Nie',
        removeRule: 'Usuń regułę',
        searchMessage: 'Dostępnych jest {0} wyników',
        selectionMessage: 'Wybrano {0} elementów',
        showMonthAfterYear: false,
        startsWith: 'Zaczyna się od',
        strong: 'Silny',
        today: 'Dzisiaj',
        upload: 'Wgraj',
        weak: 'Słaby',
        weekHeader: 'Tydzień',
        aria: {
            cancelEdit: 'Anuluj edycję',
            close: 'Zamknij',
            collapseLabel: 'Zawalić się',
            collapseRow: 'Zwinięty wiersz',
            editRow: 'Edycja wiersza',
            expandLabel: 'Zwiększać',
            expandRow: 'Wiersz rozwinięty',
            falseLabel: 'Fałsz',
            filterConstraint: 'Ograniczenie filtra',
            filterOperator: 'Operator filtra',
            firstPageLabel: 'Pierwsza strona',
            gridView: 'Widok siatki',
            hideFilterMenu: 'Ukryj menu filtrów',
            jumpToPageDropdownLabel: 'Przejdź do menu rozwijanego strony',
            jumpToPageInputLabel: 'Przejdź do wprowadzania strony',
            lastPageLabel: 'Ostatnia strona',
            listView: 'Widok listy',
            moveAllToSource: 'Przenieś wszystko do źródła',
            moveAllToTarget: 'Przenieś wszystko do celu',
            moveBottom: 'Przesuń w dół',
            moveDown: 'Położyć',
            moveTop: 'Przesuń do góry',
            moveToSource: 'Przenieś do źródła',
            moveToTarget: 'Przenieś do celu',
            moveUp: 'Podnieść',
            navigation: 'Nawigacja',
            next: 'Następny',
            nextPageLabel: 'Następna strona',
            nullLabel: 'Nie zaznaczone',
            otpLabel: 'Proszę wprowadzić znak hasła jednorazowego {0}',
            pageLabel: 'Strona {page}',
            passwordHide: 'Ukryj hasło',
            passwordShow: 'Pokaż hasło',
            previous: 'Poprzedni',
            previousPageLabel: 'Poprzednia strona',
            rotateLeft: 'Obróć w lewo',
            rotateRight: 'Obróć w prawo',
            rowsPerPageLabel: 'Wierszy na stronę',
            saveEdit: 'Zapisz edycję',
            scrollTop: 'Przewiń do góry',
            selectAll: 'Wszystkie elementy zaznaczone',
            selectLabel: 'Wybierać',
            selectRow: 'Wiersz zaznaczony',
            showFilterMenu: 'Pokaż menu filtrów',
            slide: 'Slajd',
            slideNumber: '{slideNumber}',
            star: '1 gwiazdka',
            stars: '{star} gwiazdek',
            trueLabel: 'Prawda',
            unselectAll: 'Wszystkie elementy odznaczone',
            unselectLabel: 'Odznacz',
            unselectRow: 'Wiersz odznaczony',
            zoomImage: 'Powiększ obraz',
            zoomIn: 'Przybliż',
            zoomOut: 'Oddal',
        },
    },
})
app.use(ConfirmationService)
app.use(ToastService)
app.use(DialogService)
app.mount('#app')