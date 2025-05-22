<template>
    <div class="teacher-panel">
        <h2>教师管理</h2>
        <el-table :data="tableData" border>
            <el-table-column prop="pair" label="作品对">
                <template #default="{ row }">
                    {{ row.pair[0] }} vs {{ row.pair[1] }}
                </template>
            </el-table-column>

            <el-table-column v-for="reviewer in reviewers" :key="reviewer" :prop="reviewer" :label="'评审 ' + reviewer" />
        </el-table>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const reviewers = ref([])
const tableData = ref([])

const loadAnalysis = async () => {
    try {
        const res = await api.get('/analysis')
        reviewers.value = res.data.reviewers
        tableData.value = res.data.data.map(d => ({
            pair: d.pair,
            ...d
        }))
    } catch (e) {
        console.error('加载分析数据失败', e)
    }
}

onMounted(() => {
    loadAnalysis()
})
</script>