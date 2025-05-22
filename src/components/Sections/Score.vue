<template v-if="activeMenu === '2'">
    <div class="score-container">
        <!-- 信息区 -->
        <div class="info-section">
            <el-row :gutter="20">
                <el-col :span="8">
                    <div class="info-item">
                        <span class="info-label">我的小组：</span>
                        <span class="info-value">{{ state.currentGroup || '未分组' }}</span>
                    </div>
                </el-col>

                <el-col :span="8">
                    <div class="info-item">
                        <span class="info-label">当前轮次：</span>
                        <span class="info-value">
                            {{ state.currentSubmitTimes < 1 ? '第一轮' : '第二轮' }} </span>
                    </div>
                </el-col>

                <el-col :span="8">
                    <div class="info-item">
                        <span class="info-label">截止时间：</span>
                        <span class="info-value deadline">{{ state.config.deadline || '2025-05-25 23:59:59' }}</span>
                    </div>
                </el-col>
            </el-row>
        </div>

        <!-- 待评分作品 -->
        <h4 class="table-title">待评分作品</h4>

        <!-- 作品评分表格 -->
        <div class="works-table">
            <div class="table-header">
                <div class="th name">作品ID</div>
                <div class="th url">作品链接</div>
                <div class="th innovation">创新性</div>
                <div class="th professional">专业性</div>
                <div class="th total">综合得分</div>
            </div>

            <div class="table-body">
                <div v-for="(work, index) in state.works" :key="work.student_id" class="tr">
                    <div class="td name">{{ work.student_id }}</div>
                    <div class="td url">
                        <a v-if="work.preview_url" :href="work.preview_url" target="_blank">查看作品</a>
                        <span v-else>未提交</span>
                    </div>

                    <div class="td innovation">
                        <el-select v-model="work.innovation" @change="updateTotalScore(work)" placeholder="请选择">
                            <el-option v-for="grade in 5" :key="grade" :value="grade" :label="getLetterGrade(grade)" />
                        </el-select>
                    </div>

                    <div class="td professional">
                        <el-select v-model="work.professional" @change="updateTotalScore(work)" placeholder="请选择">
                            <el-option v-for="grade in 5" :key="grade" :value="grade" :label="getLetterGrade(grade)" />
                        </el-select>
                    </div>

                    <div class="td total">
                        <span class="total-preview">
                            {{ work.total_score || '待计算' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <el-button type="primary" @click="submitAllScores" :disabled="!canSubmit" :loading="submitting">
            {{ submitting ? '提交中...' : `提交第${state.currentSubmitTimes + 1}次评分` }}
        </el-button>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'

axios.defaults.withCredentials = true
const router = useRouter()

// 状态管理
const state = reactive({
    config: {
        maxSubmits: 2,
        deadline: '2025-05-25 23:59:59'
    },
    works: [],
    currentGroup: '未分组',
    currentSubmitTimes: Number(localStorage.getItem('submitTimes')) || 0 // 从本地存储初始化
})


// 评分映射
const GRADE_MAP = ['E', 'D', 'C', 'B', 'A']
const submitting = ref(false)

// 计算属性
const canSubmit = computed(() => {
    return state.currentSubmitTimes < state.config.maxSubmits &&
        state.works.every(w =>
            w.innovation > 0 &&
            w.professional > 0 &&
            w.total_score !== null
        )
})

// 核心方法
const getLetterGrade = (score) => GRADE_MAP[score - 1] || 'E'

const calculateTotal = (work) => {
    const P = work.professional
    const I = work.innovation
    const coefficient = (P - 1) / 4
    return ((1 - coefficient) * P + coefficient * I).toFixed(2)
}

const updateTotalScore = (work) => {
    if (work.professional && work.innovation) {
        work.total_score = calculateTotal(work)
    }
}

// 加载评分作品
const fetchTargetWorks = async () => {
    try {
        const response = await axios.get('/api/target')
        state.works = response.data.map(work => ({
            student_id: work.student_id,
            preview_url: work.preview_url,
            innovation: null,
            professional: null,
            total_score: null
        }))
    } catch (error) {
        ElMessage.error('加载失败: ' + (error.response?.data?.error || '网络错误'))
    }
}

// 提交评分
const submitAllScores = async () => {
    submitting.value = true
    try {
        // 确定当前轮次
        const round = state.currentSubmitTimes === 0 ? 'first' : 'second'

        // 构建评分数据
        const ratings = {}
        state.works.forEach(work => {
            if (!work.preview_url) return
            ratings[work.student_id] = {
                innovation: GRADE_MAP[work.innovation - 1],
                professional: GRADE_MAP[work.professional - 1]
            }
        })

        // 提交到对应轮次接口
        await axios.post(`/api/rate/${round}`, ratings)

        // 更新提交状态
        state.currentSubmitTimes += 1
        localStorage.setItem('submitTimes', state.currentSubmitTimes)

        ElMessage.success(`成功提交第${state.currentSubmitTimes}次评分（${round}轮）`)
    } catch (error) {
        const errMsg = error.response?.data?.error
        if (/repeat submmit/i.test(errMsg)) {
            ElMessage.warning('该轮次评分已提交过')
        } else {
            ElMessage.error('提交失败: ' + (errMsg || '网络错误'))
        }
    } finally {
        submitting.value = false
    }
}

// 初始化
onMounted(async () => {
    await fetchTargetWorks()
    // 定时刷新数据
    setInterval(() => {
        if (document.visibilityState === 'visible') fetchTargetWorks()
    }, 120000)
})
</script>


<style scoped>
.score-container {
    padding: 20px;
    background: #fff;
}

.info-section {
    margin-bottom: 25px;
    padding: 15px;
    border: 1px solid #ebeef5;
    border-radius: 4px;

    .info-item {
        display: flex;
        align-items: center;
        height: 32px;
        font-size: 14px;

        .info-label {
            color: #606266;
            margin-right: 8px;
        }

        .info-value {
            color: #303133;

            &.deadline {
                color: #f56c6c;
            }
        }

        .times-remaining {
            color: #909399;
            margin-left: 8px;
            font-size: 12px;
        }
    }
}

.table-title {
    margin: 0 0 15px 0;
    color: #303133;
    font-weight: 500;
}

.works-table {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
}

.table-header,
.tr {
    display: grid;
    grid-template-columns: 1.5fr 1.5fr 1.5fr 1.5fr 1fr;
    align-items: center;
    padding: 12px 20px;
}

.table-body {
    background: white;
}


.td,
.th {
    min-width: 80px;
    overflow: visible;
    white-space: nowrap;
}

.work-link {
    color: #409eff;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

.score-btn {
    padding: 8px 16px;
    background: #66a9e0;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
        background: #85ce61;
    }
}

.my-score {
    color: #67c23a;
    font-weight: 500;
}

.score-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
}

.dialog-content {
    background: white;
    padding: 24px;
    border-radius: 8px;
    width: 500px;
}

.work-title {
    margin: 0 0 20px 0;
    color: #303133;
}

.score-dimensions {
    margin-bottom: 24px;
}

.dimension {
    margin-bottom: 20px;
}

.dimension-label {
    display: block;
    margin-bottom: 12px;
    color: #606266;
}

.grade-btns {
    display: flex;
    gap: 10px;
}

.grade-btn {
    width: 40px;
    height: 40px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    cursor: pointer;

    &.active {
        background: #409eff;
        color: white;
        border-color: #409eff;
    }
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.cancel-btn {
    padding: 10px 20px;
    background: white;
    border: 1px solid #dcdfe6;
    color: #606266;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
        border-color: #409eff;
        color: #409eff;
    }
}

.confirm-btn {
    padding: 10px 20px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
        background: #66b1ff;
    }
}

.th.total,
.td.total {
    width: 120px;
    text-align: center;
    color: #67c23a;
    font-weight: 500;
}

.total-preview {
    display: inline-block;
    min-width: 60px;
}

.submit-btn {
    margin-top: 25px;
    width: 200px;
}

.el-select {
    width: 100%;
}

.no-submit {
    color: #999;
    font-size: 12px;
}
</style>