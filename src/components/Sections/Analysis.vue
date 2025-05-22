<template v-if="activeMenu === '3'">
    <div class="analysis-container">
        <el-card shadow="never">
            <!-- 数据加载状态 -->
            <el-skeleton v-if="loading" :rows="10" animated />

            <!-- 主表格 -->
            <el-table v-else :data="processedData" border stripe size="small" style="width: 100%" height="600px">
                <!-- 固定列：作品对 -->
                <el-table-column prop="pair" label="作品对" width="180" fixed>
                    <template #default="{ row }">
                        <span class="pair-label">
                            {{ formatPair(row.pair) }}
                        </span>
                    </template>
                </el-table-column>

                <!-- 动态列：评审人 -->
                <el-table-column v-for="reviewer in reviewers" :key="reviewer" :prop="reviewer"
                    :label="`评审人 ${reviewer}`" min-width="160">
                    <template #default="{ row }">
                        <div class="comparison-cell">
                            <el-tag :type="getComparisonType(row[reviewer])" size="small" effect="light">
                                <el-icon :size="14" class="icon">
                                    <component :is="getComparisonIcon(row[reviewer])" />
                                </el-icon>
                                {{ formatComparison(row[reviewer]) }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import {
    CaretTop,
    CaretBottom,
    Minus
} from '@element-plus/icons-vue'

// 状态管理
const loading = ref(true)
const rawData = ref({ reviewers: [], data: [] })

// 获取数据
const fetchAnalysisData = async () => {
    try {
        loading.value = true
        const response = await axios.get('/api/analysis')
        rawData.value = response.data
    } catch (error) {
        ElMessage.error('数据加载失败')
        console.error('Analysis fetch error:', error)
    } finally {
        loading.value = false
    }
}

// 处理后的数据格式
const processedData = computed(() => {
    return rawData.value.data.map(item => ({
        ...item,
        pair: item.pair.sort((a, b) => a - b) // 确保作品对有序
    }))
})

// 获取评审人列表
const reviewers = computed(() => rawData.value.reviewers)

// 辅助方法
const formatPair = (pair) => `作品 ${pair[0]} vs 作品 ${pair[1]}`

const getComparisonType = (str) => {
    if (str.includes('>')) return 'success'
    if (str.includes('<')) return 'danger'
    return 'info'
}

const getComparisonIcon = (str) => {
    if (str.includes('>')) return CaretTop
    if (str.includes('<')) return CaretBottom
    return Minus
}

const formatComparison = (str) => {
    const [a, op, b] = str.split(/(>|<|=)/)
    return `${a} ${op} ${b}`
}

// 生命周期
onMounted(() => {
    fetchAnalysisData()

    // 每5分钟自动刷新
    setInterval(fetchAnalysisData, 300000)
})
</script>

<style scoped>
.analysis-container {
    padding: 20px;
    background: #fff;
}

.pair-label {
    font-weight: 500;
    color: #606266;
}

.comparison-cell {
    display: flex;
    justify-content: center;

    .el-tag {
        padding: 0 8px;
        border-radius: 4px;
        transition: all 0.2s;

        .icon {
            margin-right: 4px;
            position: relative;
            top: 1px;
        }
    }
}

:deep(.el-table__body-wrapper) {
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 transparent;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}
</style>