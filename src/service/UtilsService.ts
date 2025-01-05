import moment from 'moment'

export const UtilsService = {
    formatCurrency(value: number | undefined) {
        // console.log("FORMAT_CURRENCY: ", value);
        if (value !== undefined && !Number.isNaN(value))
            return value.toLocaleString('pl-PL', {
                style: 'currency',
                currency: 'PLN',
            })
    },

    formatDateToString(value: Date | string | undefined): string {
        if (value) {
            const date = moment(value).format('YYYY-MM-DD')
            return date === '0001-01-01' ? '' : date
        }
        return ''
    },

    formatDate(value: Date | string | undefined): Date | undefined {
        if (value) {
            const date = moment(value).format('YYYY-MM-DD')
            return date === '0001-01-01' ? undefined : new Date(date)
        }
    },

    //zaznacza tekst po kliknięciu
    selectText(event: Event) {
        if (event.target && event.target instanceof HTMLInputElement) {
            event.target.select()
        }
    },

    findPatternInString(inputString: string, pattern: string, split: string) {
        // Dzielimy string na elementy według separatora ";;"
        const elements = inputString.split(split)

        // Filtrujemy elementy, które zawierają wzorzec (pattern)
        const matchedElements = elements.filter((element) => element.includes(pattern))

        return matchedElements
    },

}
