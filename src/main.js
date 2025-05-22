import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'element-plus/dist/index.css'
import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            component: () => import('@/components/Login.vue')
        },
        {
            path: '/',
            component: () => import('@/components/Home.vue'),
            children: [
                { path: 'home', redirect: 'home/upload' },
                { path: 'home/upload', component: () => import('@/components/Sections/Upload.vue') },
                { path: 'home/score', component: () => import('@/components/Sections/Score.vue') },
                { path: 'home/analysis', component: () => import('@/components/Sections/Analysis.vue') },
                { path: 'home/teacher', component: () => import('@/components/Sections/Teacher.vue') }
            ]
        }
    ]
})

router.beforeEach((to, from) => {
    const role = sessionStorage.getItem('userRole')
    const isAuthenticated = !!role

    // 已登录用户访问登录页时重定向到主页
    if (isAuthenticated && to.path === '/login') {
        return '/home'
    }

    // 教师面板访问控制
    if (to.path.includes('/teacher') && role !== 'teacher') {
        return '/home/upload'
    }

    // 未登录访问非登录页时重定向
    if (!isAuthenticated && to.path !== '/login') {
        return '/login'
    }
})

const app = createApp(App)

// 配置axios实例
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true
})

// 挂载全局属性
app.config.globalProperties.$api = api

app.use(ElementPlus)
app.use(router)
app.mount('#app')