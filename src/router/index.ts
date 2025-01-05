import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/MainHomeView.vue'
import LoginView from '../views/LoginView.vue'
import Error503View from '../views/Error503View.vue'
import RefreshComponent from '../components/RefreshComponent.vue'
import { useAuthorizationStore } from '../stores/authorization'


//ADMIN
import PrivilegesView from '../views/PrivilegesView.vue'
import LogsView from '../views/LogsView.vue'

//DOBRANOCKA
import DobranockaHomeView from "../views/dobranocka/DobranockaHomeView.vue";
import CustomerView from "../views/dobranocka/CustomerView.vue"
import CustomersView from "../views/dobranocka/CustomersView.vue"
import Error403View from "../views/Error403View.vue";

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/error503',
    name: 'Error503',
    component: Error503View,
  },
  {
    path: '/error403',
    name: 'Error403',
    component: Error403View,
  },
  {
    path: '/refresh',
    name: 'refresh',
    component: RefreshComponent,
    props: true,
  },
  //----------------------------------------------ADMIN--------------------------------------------
  {
    path: '/admin/privileges',
    name: 'Privileges',
    component: PrivilegesView,
  },
  {
    path: '/admin/logs',
    name: 'Logs',
    component: LogsView,
  },
  //---------------------------------------------- DOBRANOCKA_CUSTOMER--------------------------------------------
  {
    path: '/dobranocka/home',
    name: 'DobranockaHome',
    component: DobranockaHomeView,
  },
  {
    path: '/dobranocka/customer/all',
    name: 'Customers',
    component: CustomersView,
  },
  {
    path: '/dobranocka/customer/:isEdit/:customerId',
    name: 'Customer',
    component: CustomerView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})
router.beforeEach((to, from, next) => {
  const authStore = useAuthorizationStore()
  console.log('ROUTE to: ', to, ', from: ', from)
  if (to.path) {
    const history = JSON.parse(localStorage.getItem('navigationHistory') || '[]')
    history.push(to.path)
    localStorage.setItem('navigationHistory', JSON.stringify(history))
  }
  const refreshToken = localStorage.getItem('refreshToken') || null
  if (
    to.name !== 'login' &&
    to.name !== 'Error503' &&
    !authStore.isAuthenticated &&
    refreshToken === null
  ) {
    next({ name: 'login' })
  } else {
    next()
  }
})
export default router
