<template>
    <div class="teacher-panel">
        <h2>教师管理</h2>
        <div class="teacher-controls">
            <el-button type="primary" @click="handleOpenSecondRound">
                开启第二轮互评
            </el-button>

            <!-- 添加更多管理功能 -->
            <el-button @click="showDeadlineDialog = true">
                修改截止时间
            </el-button>
        </div>

        <el-dialog v-model="showDeadlineDialog" title="设置截止时间">
            <el-date-picker v-model="newDeadline" type="datetime" placeholder="选择截止时间" />
            <template #footer>
                <el-button @click="showDeadlineDialog = false">取消</el-button>
                <el-button type="primary" @click="updateDeadline">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const showDeadlineDialog = ref(false)
const newDeadline = ref('')

const handleOpenSecondRound = async () => {
    try {
        await axios.post('/open_second_round')
        ElMessage.success('第二轮互评已开启')
    } catch (error) {
        ElMessage.error('操作失败: ' + (error.response?.data?.error || '未知错误'))
    }
}

const updateDeadline = async () => {
    try {
        await axios.post('/update_deadline', {
            deadline: newDeadline.value
        })
        ElMessage.success('截止时间已更新')
        showDeadlineDialog.value = false
    } catch (error) {
        ElMessage.error('更新失败: ' + (error.response?.data?.error || '未知错误'))
    }
}
</script>