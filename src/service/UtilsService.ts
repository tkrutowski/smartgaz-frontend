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

    isPositiveInteger(value: string) {
        // console.log('isPositiveInteger',value)
        let str = String(value);
        if (!str) {
            return false;
        }
        str = str.replace(/^0+/, '') || '0';
        const n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str && n >= 0;
    },

    isPositiveFloat(value: string): boolean {
        console.log('isPositiveFloat', value);
        let str: string = String(value);
        str = str.trim();
        if (!str) {
            return false;
        }
        const num: number = Number(str);
        return !isNaN(num) && num > 0 && str === String(num);
    },

    mapVatToEnum(vat: { viewValue: string; numberValue: number; multiplier: number }): string {
        if (!vat) {
            return "VAT_0"; // Domyślna wartość, jeśli `vat` jest null lub undefined
        }

        if (vat.viewValue === "8%") return "VAT_8";
        if (vat.viewValue === "23%") return "VAT_23";

        // Dodaj inne mapowania w zależności od wymagań
        return "VAT_0"; // Domyślna wartość
    },

    getEnumValueByKey<T>(enumObject: T, key: keyof T): T[keyof T] | undefined {
        return enumObject[key];
    },

    getEnumKeyByValue<T>(enumObject: T, value: string): keyof T | undefined {
        console.log("getEnumKeyByValue - enumObject", enumObject, "value", value);
        const result = Object.keys(enumObject).find((key) => {
            const enumValue = enumObject[key as keyof T];
            console.log(`Comparing enumValue: ${enumValue} with value: ${value}`);
            return enumValue === value;
        }) as keyof T | undefined;

        console.log("getEnumKeyByValue - result", result);
        return result;
    // }






        // console.log("getEnumKeyByValue", enumObject, value);
        // const result =  Object.keys(enumObject).find(
        //     (key) => enumObject[key as keyof T] === value
        // ) as keyof T | undefined;
        //
        // console.log("getEnumKeyByValue - result", result);
        // return result
    },
}
