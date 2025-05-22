//Home.vue
<template>
    <!-- 主布局容器 -->
    <el-container class="main-container">
        <!-- 顶部导航栏 -->
        <el-header class="header">
            <div class="header-content">
                <h1 class="title">作品管理系统</h1>
                <div class="user-info">
                    <span class="username">{{ userInfo?.student_id || '未获取学号' }}</span>
                    <el-button type="danger" @click="handleLogout" :icon="SwitchButton" size="small">
                        退出登录
                    </el-button>
                </div>
            </div>
        </el-header>

        <el-container>
            <!-- 左侧导航菜单 -->
            <el-aside width="200px" class="sidebar">
                <el-menu :default-active="activeMenu" class="menu" router @select="handleMenuSelect">
                    <el-menu-item index="/home/upload">
                        <template #title><span>作品提交</span></template>
                    </el-menu-item>
                    <el-menu-item index="/home/score">
                        <template #title><span>作品评分</span></template>
                    </el-menu-item>
                    <el-menu-item index="/home/analysis">
                        <template #title><span>逆序对</span></template>
                    </el-menu-item>
                    <el-menu-item v-if="isTeacher" index="/home/teacher">
                        <template #title><span>教师面板</span></template>
                    </el-menu-item>
                </el-menu>
            </el-aside>

            <!-- 主内容区域 -->
            <el-main class="main-area">
                <!-- 路由视图容器 -->
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>

import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'


const router = useRouter()
const route = useRoute()

//用户信息管理
const userInfo = ref({})
const loading = ref(true)


//当前激活菜单项
const activeMenu = computed(() => route.path)

//初始化用户数据
const loadUserInfo = async () => {
    try {
        // 从 sessionStorage 获取登录时保存的学号
        const studentId = sessionStorage.getItem('userName');
        if (!studentId) {
            throw new Error('未找到用户信息');
        }

        // 使用代理后的路径 /api/login
        const res = await axios.post('/api/login', {
            student_id: studentId // 传递真实学号
        });

        userInfo.value = {
            student_id: res.data.student_id,
            role: res.data.role || 'student' // 默认角色为学生
        };
    } catch (e) {
        console.error('用户信息加载失败', e);
    }
};

const isTeacher = computed(() => {
    return userInfo.value.student_id?.startsWith('T');
});

const handleLogout = async () => {
    sessionStorage.clear();
    router.push('/login');
};

// 菜单选择处理
const handleMenuSelect = (path) => {
    router.push(path)
}

onMounted(() => {
    loadUserInfo()
})
</script>

<style scoped>
.main-container {
    height: 100vh;
    background: white;
}

.header {
    border-bottom: 1px solid #dcdfe6;
    padding: 0 20px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
}

.title {
    margin: 0;
    font-size: 18px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.sidebar {
    border-right: 1px solid #dcdfe6;
}

.menu {
    border-right: none;
}

.main-area {
    padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>