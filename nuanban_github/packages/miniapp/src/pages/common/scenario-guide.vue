<template>
  <view class="page">
    <text class="title">深度验收向导</text>
    <text class="sub">按步骤走完三角色闭环 · 约 15 分钟 · 进度本地保存</text>

    <view class="progress-bar-wrap">
      <view class="progress-bar" :style="{ width: progressPct + '%' }" />
      <text class="progress-text">{{ doneCount }}/{{ steps.length }} 已完成</text>
    </view>

    <view v-if="allDone" class="complete-banner">
      <text class="complete-icon">🎉</text>
      <view>
        <text class="complete-title">验收闭环已完成</text>
        <text class="complete-desc">三角色主流程已走通，可分享链接给验收人</text>
      </view>
      <button class="btn-share" size="mini" @tap="goShare">去分享</button>
    </view>

    <view v-for="(step, idx) in steps" :key="step.id" class="step-card" :class="{ done: isDone(step.id) }">
      <view class="step-head">
        <text class="step-num">{{ idx + 1 }}</text>
        <view class="step-main">
          <text class="step-title">{{ step.title }}</text>
          <text class="step-desc">{{ step.desc }}</text>
          <view class="account-row">
            <text class="step-account">{{ step.account }}</text>
            <text
              v-if="isPhoneAccount(step.account)"
              class="copy-phone"
              @tap.stop="copyPhone(step.account)"
            >复制</text>
          </view>
        </view>
        <text v-if="isDone(step.id)" class="check">✓</text>
      </view>
      <view class="step-actions">
        <button class="btn-go" size="mini" @tap="go(step.url)">去完成</button>
        <button
          class="btn-done"
          size="mini"
          :class="{ active: isDone(step.id) }"
          @tap="toggleDone(step.id)"
        >
          {{ isDone(step.id) ? '取消标记' : '标记完成' }}
        </button>
      </view>
    </view>

    <view class="footer-actions">
      <button class="btn-reset-progress" @tap="resetProgress">清除进度</button>
      <button class="btn-back" @tap="goBack">返回</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getSecureJson, removeSecure, setSecureJson } from '../../utils/secure-storage';

const STORAGE_KEY = 'nuanban_scenario_v1';

const steps = [
  {
    id: 'tour',
    title: '观看动画演示',
    desc: '22 秒了解三种撮合路径与支付闭环',
    account: '无需登录',
    url: '/pages/common/demo-tour',
  },
  {
    id: 'student-accept',
    title: '学生接单',
    desc: '看待接单池 → 接受一单 → 到场签到',
    account: '13800000001',
    url: '/package-student/order/pending',
  },
  {
    id: 'student-complete',
    title: '学生完成服务',
    desc: '服务中 → 完成服务 → 等待家属确认',
    account: '13800000001',
    url: '/package-student/order/active',
  },
  {
    id: 'family-pay',
    title: '家属代付',
    desc: '待支付订单 → 储值卡或微信支付（演示）',
    account: '13800000004',
    url: '/package-family/order/list',
  },
  {
    id: 'family-confirm',
    title: '家属确认完成',
    desc: '待确认服务 → 确认并付款 → 查看服务记录',
    account: '13800000004',
    url: '/package-family/service/log',
  },
  {
    id: 'outdoor-seed',
    title: '外出陪同演示',
    desc: '运营演示注入外出单 → 家属审批',
    account: '运营演示页操作',
    url: '/pages/common/admin-hub',
  },
  {
    id: 'elder-sos',
    title: '老人一键求助',
    desc: '老人端发起 SOS → 家属/学生确认',
    account: '13800000005',
    url: '/package-elder/home',
  },
  {
    id: 'admin-kpi',
    title: '运营 KPI 与动态',
    desc: '查看撮合数据、服务归档与撮合动态',
    account: '登录页 → 更多 → 运营演示',
    url: '/pages/common/admin-hub',
  },
  {
    id: 'share',
    title: '分享验收链接',
    desc: '复制深链给验收人 · 零安装',
    account: '无需登录',
    url: '/pages/common/share-demo',
  },
];

const completed = ref<string[]>([]);

function loadProgress() {
  const raw = getSecureJson<{ completed?: string[] }>(STORAGE_KEY, { completed: [] });
  completed.value = Array.isArray(raw.completed) ? raw.completed : [];
}

function saveProgress() {
  setSecureJson(STORAGE_KEY, { completed: completed.value });
}

const doneCount = computed(() => completed.value.length);
const progressPct = computed(() => Math.round((doneCount.value / steps.length) * 100));
const allDone = computed(() => doneCount.value >= steps.length);

function isPhoneAccount(account: string) {
  return /^1\d{10}$/.test(account.trim());
}

function copyPhone(phone: string) {
  uni.setClipboardData({
    data: phone.trim(),
    success: () => uni.showToast({ title: '已复制手机号', icon: 'success' }),
  });
}

function goShare() {
  uni.navigateTo({ url: '/pages/common/share-demo' });
}

function isDone(id: string) {
  return completed.value.includes(id);
}

function toggleDone(id: string) {
  if (isDone(id)) {
    completed.value = completed.value.filter((x) => x !== id);
  } else {
    completed.value = [...completed.value, id];
  }
  saveProgress();
}

function go(url: string) {
  uni.navigateTo({ url });
}

function resetProgress() {
  uni.showModal({
    title: '清除进度',
    content: '将清空本向导的完成标记，是否继续？',
    success: (res) => {
      if (res.confirm) {
        completed.value = [];
        removeSecure(STORAGE_KEY);
        uni.showToast({ title: '已清除', icon: 'success' });
      }
    },
  });
}

function goBack() {
  uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/common/login' }) });
}

onShow(loadProgress);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 48rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 24rpx;
  font-size: 24rpx;
  color: #888;
  line-height: 1.5;
}
.progress-bar-wrap {
  position: relative;
  height: 16rpx;
  background: #e8e0d8;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #c45c26, #e8924f);
  border-radius: 8rpx;
  transition: width 0.3s;
}
.progress-text {
  display: block;
  margin-bottom: 20rpx;
  font-size: 22rpx;
  color: #666;
}
.complete-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: linear-gradient(135deg, #fff8f0, #fff);
  border: 2rpx solid #c8e6c9;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.complete-icon {
  font-size: 40rpx;
}
.complete-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #2e7d32;
}
.complete-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #666;
}
.btn-share {
  margin-left: auto;
  background: #c45c26;
  color: #fff;
  flex-shrink: 0;
}
.account-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 6rpx;
}
.copy-phone {
  font-size: 22rpx;
  color: #c45c26;
  padding: 2rpx 12rpx;
  border: 1rpx solid #e8c4a8;
  border-radius: 8rpx;
}
.step-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
}
.step-card.done {
  border-color: #c8e6c9;
  background: #fafffa;
}
.step-head {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}
.step-num {
  width: 44rpx;
  height: 44rpx;
  line-height: 44rpx;
  text-align: center;
  background: #fff5eb;
  color: #c45c26;
  border-radius: 50%;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.step-main {
  flex: 1;
}
.step-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.step-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #666;
  line-height: 1.45;
}
.step-account {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #c45c26;
}
.check {
  color: #2e7d32;
  font-size: 32rpx;
  font-weight: 600;
}
.step-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  padding-left: 60rpx;
}
.btn-go {
  background: #c45c26;
  color: #fff;
}
.btn-done {
  background: #f0f0f0;
  color: #666;
}
.btn-done.active {
  background: #e8f5e9;
  color: #2e7d32;
}
.footer-actions {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.btn-reset-progress {
  background: #fff;
  color: #888;
  border: 1rpx solid #ddd;
}
.btn-back {
  background: transparent;
  color: #c45c26;
}
</style>
