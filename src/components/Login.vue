<template>
    <div class="login-container">
        <el-form @submit.prevent="handleLogin">
            <el-form-item label="学号">
                <el-input v-model="studentId" placeholder="请输入学号" />
            </el-form-item>
            <el-button type="primary" native-type="submit">登录</el-button>
        </el-form>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const studentId = ref('')

const handleLogin = async () => {
    try {
        const response = await axios.post('/api/login', {
            student_id: studentId.value
        })

        // 存储用户信息
        sessionStorage.setItem('userRole', response.data.role)
        sessionStorage.setItem('userName', response.data.student_id)

        // 跳转前清除输入
        studentId.value = ''
        router.push('/home')
    } catch (error) {
        console.error('登录失败', error)
        ElMessage.error({
            message: error.response?.data?.message || '登录失败，请检查学号',
            duration: 3000
        })
    }
}
</script>

<style scoped>
.login-container {
    max-width: 400px;
    margin: 100px auto;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>