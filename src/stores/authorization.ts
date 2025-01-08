import {defineStore} from 'pinia'
import httpCommon from '../config/http-common'
import jwt_decode from 'jwt-decode'
import moment from 'moment'
import type {CustomJwtPayload} from "../types/User.ts";
import router from '../router'
import {useCustomerStore} from './customers.ts'

export const useAuthorizationStore = defineStore('authorization', {
    state: () => ({
        accessToken: localStorage.getItem('accessToken') || null,
        refreshToken: localStorage.getItem('refreshToken') || null,
        loginError: false,
        btnDisabled: false,
        isAuthenticated: false,
        loading: false,
        username: localStorage.getItem('username') || '',
        userPrivileges: [] as string[],
    }),

    //getters = computed
    getters: {
        hasAccessAdmin(): boolean {
            try {
                if (this.accessToken) {
                    // console.log("token : ", this.token);
                    const decoded = jwt_decode<CustomJwtPayload>(this.accessToken)
                    return decoded.authorities.includes('ROLE_ADMIN')
                } else {
                    return false
                }
            } catch (error) {
                console.log('hasAccessFinance() ERROR', error)
                return false
            }
        },
        isAuthenticatedOrToken(): boolean {
            try {
            if (this.accessToken) {
                const decoded = jwt_decode<CustomJwtPayload>(this.accessToken)
                return this.isAuthenticated || moment.unix(decoded.exp).isAfter(moment())
            }
            return this.isAuthenticated
            } catch (error) {
                console.log('isAuthenticatedOrToken() ERROR', error)
                return false
            }
        },
        hasAccessDobranocka(): boolean {
            console.log('hasAccessDobranocka()')
            try {
                if (this.accessToken) {
                    // console.log("token : ", this.token);
                    const decoded = jwt_decode<CustomJwtPayload>(this.accessToken)
                    // console.log("token decoded: ", decoded);
                    return (
                        decoded.authorities.includes('ROLE_DOBRANOCKA') || decoded.authorities.includes('ROLE_ADMIN')
                    )
                } else {
                    return false
                }
            } catch (error) {
                console.log('hasAccessDobranocka() ERROR', error)
                return false
            }
        },
        hasAccessSmartgaz(): boolean {
            console.log('hasAccessSmartgaz()')
            try {
                if (this.accessToken) {
                    // console.log("token : ", this.token);
                    const decoded = jwt_decode<CustomJwtPayload>(this.accessToken)
                    // console.log("token decoded: ", decoded);
                    return (
                        decoded.authorities.includes('ROLE_SMARTGAZ') || decoded.authorities.includes('ROLE_ADMIN')
                    )
                } else {
                    return false
                }
            } catch (error) {
                console.log('hasAccessSmartgaz() ERROR', error)
                return false
            }
        },
        hasAccessDobranockaCustomer(): boolean {
            console.log('hasAccessDobranockaCustomer()')
            try {
                if (this.accessToken) {
                    // console.log("token : ", this.token);
                    const decoded = jwt_decode<CustomJwtPayload>(this.accessToken)
                    // console.log("token decoded: ", decoded);
                    return (
                        decoded.authorities.includes('ROLE_DOBRANOCKA_CUSTOMER') || decoded.authorities.includes('ROLE_ADMIN')
                    )
                } else {
                    return false
                }
            } catch (error) {
                console.log('hasAccessDobranockaCustomer() ERROR', error)
                return false
            }
        },
        hasAccessDobranockaInvoice(): boolean {
            console.log('hasAccessDobranockaInvoice()')
            try {
                if (this.accessToken) {
                    // console.log("token : ", this.token);
                    const decoded = jwt_decode<CustomJwtPayload>(this.accessToken)
                    // console.log("token decoded: ", decoded);
                    return (
                        decoded.authorities.includes('ROLE_DOBRANOCKA_INVOICE') || decoded.authorities.includes('ROLE_ADMIN')
                    )
                } else {
                    return false
                }
            } catch (error) {
                console.log('hasAccessDobranockaInvoice() ERROR', error)
                return false
            }
        },
        hasAccessDobranockaCompany(): boolean {
            console.log('hasAccessDobranockaCompany()')
            try {
                if (this.accessToken) {
                    // console.log("token : ", this.token);
                    const decoded = jwt_decode<CustomJwtPayload>(this.accessToken)
                    // console.log("token decoded: ", decoded);
                    return (
                        decoded.authorities.includes('ROLE_DOBRANOCKA_COMPANY') || decoded.authorities.includes('ROLE_ADMIN')
                    )
                } else {
                    return false
                }
            } catch (error) {
                console.log('hasAccessDobranockaCompany' +
                    '() ERROR', error)
                return false
            }
        },
    },

    //actions = metody w komponentach
    actions: {
        logUser(token: string, refreshToken: string) {
            console.log("logUser: accessToken: ",token, ", refresh token: ", refreshToken)
            this.accessToken = token
            localStorage.setItem('accessToken', token)
            this.isAuthenticated = true
            const decoded = jwt_decode<CustomJwtPayload>(this.accessToken)
            if (decoded.sub) {
                this.username = decoded.sub
                localStorage.setItem('username', decoded.sub)
            }
            this.refreshToken = refreshToken
            localStorage.setItem('refreshToken', refreshToken)
        },
        //
        //LOGIN
        //
        async login(username: string, password: string) {
            console.log('START - login()')
            this.loading = true
            this.btnDisabled = true
            const res = await httpCommon.post('/v1/auth/login', {
                username: username,
                password: password,
            })

            console.log("login res: ", res)
            this.logUser(res.data.accessToken, res.data.refreshToken)


            this.loading = false
            this.btnDisabled = false
            this.loginError = false
            console.log('END - login()')
            return true
        },
        //
        //LOGOUT
        //
        logout(): void {
            console.log('START - logout()')
            const customerStore = useCustomerStore()
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('username')
            this.$reset() //store reset
            customerStore.customers = []
            console.log('router',router)
            router.replace({name: 'login'})
        },
        //
        //REFRESH
        //
        async refresh() {
            console.log('START - refresh()')
            const refreshToken = localStorage.getItem('refreshToken') || null
            console.log('refreshToken', refreshToken)
            const response = await httpCommon.post('/v1/auth/refresh', {
                refreshToken: refreshToken,
            })
            if (response.status === 200) {
                console.log('refresh() - success - update tokens...', response)
                this.logUser(response.data.accessToken, response.data.refreshToken)
            }
            console.log('END - refresh()')
            return response
        },

        //
        // TEST PING
        //
        async testPing() {
            console.log('START - testPing()')
            return await httpCommon.get('/v1/auth/test')
        },


    },
})
