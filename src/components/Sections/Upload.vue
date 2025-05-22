//Upload.vue
<template v-if="activeMenu === '1'">
    <div class="upload-container">
        <!-- 标题区 -->
        <div class="section-header">
            <h3>作品提交</h3>
            <span class="sub-title">上传Zip文件</span>
        </div>

        <!-- 文件操作区 -->
        <el-row :gutter="20" class="file-operate">
            <el-col :span="18">
                <div class="file-select">
                    <span class="label">作品压缩包：</span>
                    <el-upload action="#" :auto-upload="false" :show-file-list="false" :limit="1"
                        :on-exceed="handleExceed" :on-change="handleFileChange" ref="uploadRef">
                        <template #trigger>
                            <el-button type="primary" plain>选择文件</el-button>
                        </template>
                    </el-upload>
                    <span class="file-name">{{ selectedFile ? selectedFile.name : '未选择任何文件' }}</span>
                </div>

                <!-- 实时进度条 -->
                <div class="progress-section" v-show="uploadProgress > 0">
                    <span class="tip-text">上传进度 {{ uploadProgress }}%</span>
                    <el-progress :percentage="uploadProgress" :stroke-width="16" :status="uploadStatus"
                        :color="customColors" />
                </div>

                <!-- 上传操作区 -->
                <div class="upload-action">
                    <el-button type="primary" :loading="isUploading" @click="handleUpload" :disabled="!selectedFile">
                        {{ isUploading ? '上传中...' : '开始上传' }}
                    </el-button>
                    <span class="deadline">截止时间：{{ formattedDeadline }}</span>
                </div>
            </el-col>

            <!-- 配置说明 -->
            <el-col :span="6" class="config-tip">
                <div class="tip-box">
                    <p class="description">（说明）</p>
                    <p>1. 文件大小不超过50MB</p>
                    <p>2. 仅支持ZIP格式</p>
                    <p>3. 需包含完整项目文件</p>
                </div>
            </el-col>
        </el-row>

        <!-- 历史记录 -->
        <div class="submit-history" v-if="state.history.status">
            <h4>提交历史</h4>
            <el-descriptions border>
                <el-descriptions-item label="学号">{{ state.history.student_id }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="state.history.status === '已提交' ? 'success' : 'danger'">
                        {{ state.history.status }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="作品链接" v-if="state.history.preview_url">
                    <a :href="state.history.preview_url" target="_blank">预览链接</a>
                </el-descriptions-item>
            </el-descriptions>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 组件状态
const uploadRef = ref()
const selectedFile = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const customColors = ref([
    { color: '#f56c6c', percentage: 20 },
    { color: '#e6a23c', percentage: 40 },
    { color: '#5cb87a', percentage: 60 },
    { color: '#1989fa', percentage: 80 },
    { color: '#6f7ad3', percentage: 100 }]) // 颜色配置保持不变
const rawDeadline = '2025-05-25T23:59:59' // 与app.py配置保持一致
const formattedDeadline = ref('')

// 系统配置和记录
const state = reactive({
    history: {
        student_id: '',
        status: '',
        preview_url: ''
    }
})


const formatDate = () => {
    try {
        const dateObj = new Date(rawDeadline)
        // 中文格式示例：2025年5月25日 23:59:59
        formattedDeadline.value = dateObj.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/\//g, '-')
    } catch (e) {
        console.error('日期格式错误', e)
        formattedDeadline.value = '2025-05-25 23:59:59' // 保底显示
    }
}
// 文件验证
const validateFile = (file) => {
    const allowedTypes = ['zip'] // 固定允许类型
    const maxSizeMB = 50         // 固定最大尺寸

    const fileExtension = file.name.split('.').pop().toLowerCase()
    const isValidType = allowedTypes.includes(fileExtension)
    const isValidSize = file.size <= maxSizeMB * 1024 * 1024

    if (!isValidType) {
        ElMessage.error('仅支持ZIP格式')
        return false
    }
    if (!isValidSize) {
        ElMessage.error(`文件大小不能超过${maxSizeMB}MB`)
        return false
    }
    return true
}


// 加载提交历史
const loadHistory = async () => {
    try {
        const res = await axios.get('/api/submit/history')
        state.history = {
            ...res.data,
            status: decodeUnicode(res.data.status)
        }
    } catch (e) {
        ElMessage.error('历史记录加载失败')
        state.history = {}
    }
}

const decodeUnicode = (str) => {
    return str.replace(/\\u(\w{4})/gi, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16))
    })
}


// 文件变更处理
const handleFileChange = (uploadFile) => {
    if (!validateFile(uploadFile.raw)) {
        uploadRef.value.clearFiles()
        return false
    }
    selectedFile.value = uploadFile.raw
    return true
}

// 处理文件上传
const handleUpload = async () => {
    if (!selectedFile.value) return

    isUploading.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('file', selectedFile.value)

    try {
        const res = await axios.post('/api/submit', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: progressEvent => {
                uploadProgress.value = Math.round(
                    (progressEvent.loaded / progressEvent.total) * 100
                )
            }
        })

        state.history = {
            time: new Date().toLocaleString(),
            url: res.data.preview_url || ''
        }

        ElMessage.success('上传成功')
    } catch (error) {
        const errorMsg = error.response?.data?.error || '上传失败'
        ElMessage.error(`[${error.response?.status}] ${errorMsg}`)
        state.history = {}
    } finally {
        isUploading.value = false
        selectedFile.value = null
        uploadRef.value.clearFiles()
        setTimeout(() => uploadProgress.value = 0, 2000)
    }
}

// 处理文件超出限制
const handleExceed = () => {
    ElMessage.warning('每次只能上传一个文件，请先移除当前文件')
}

onMounted(() => {
    formatDate()
    loadHistory()
})
</script>

<style scoped>
.upload-container {
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
}

.section-header {
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid #dcdfe6;

    h3 {
        margin: 0;
        font-size: 18px;
    }

    .sub-title {
        color: #909399;
        font-size: 12px;
    }
}

.file-operate {
    margin-bottom: 30px;

    .file-select {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;

        .label {
            margin-right: 10px;
            min-width: 80px;
        }

        .file-name {
            color: #409eff;
            font-weight: 500;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.progress-section {
    margin: 25px 0;
    transition: all 0.3s ease;

    .tip-text {
        margin-bottom: 8px;
        display: block;
        color: #606266;
        font-size: 13px;
    }
}

.upload-action {
    margin-top: 25px;
    display: flex;
    align-items: center;
    gap: 30px;

    .deadline {
        color: #F56C6C;
        font-weight: 500;
    }
}

.config-tip {
    border-left: 1px solid #ebeef5;
    padding-left: 20px;

    .tip-box {
        color: #606266;

        .description {
            margin: 8px 0;
            color: #909399;
        }
    }
}

.submit-history {
    margin-top: 30px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;

    h4 {
        margin: 0 0 15px 0;
        color: #303133;
        font-size: 16px;
    }

    a {
        color: #409eff;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>