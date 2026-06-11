<template>
  <view class="tour">
    <view class="safe-top" />

    <view class="chrome-top">
      <text class="skip" @tap="confirmSkip">跳过</text>
      <view class="progress-wrap">
        <view class="progress-bar" :style="{ width: progressPct + '%' }" />
      </view>
      <text class="scene-counter">{{ scene + 1 }}/{{ SCENE_COUNT }}</text>
    </view>

    <text class="focus-line">{{ scenes[scene].focus }}</text>

    <view class="stage">
      <view :key="scene" class="slide-wrap">
        <view v-if="scene === 0" class="slide">
          <text class="slide-title">暖伴勤工</text>
          <text class="slide-sub">陪伴有温度 · 勤工有意义</text>
          <view class="chain">
            <view class="chain-node pulse">👵 老人</view>
            <text class="chain-arrow">↓</text>
            <view class="chain-node platform">🏢 平台撮合</view>
            <text class="chain-arrow">↓</text>
            <view class="chain-node pulse">🎓 学生</view>
          </view>
          <text class="caption">三端一条链 · 明码标价可追溯</text>
        </view>

        <view v-else-if="scene === 1" class="slide">
          <text class="scene-label">老人找陪护</text>
          <view class="hero-card">
            <view class="row">
              <text class="avatar">林</text>
              <view class="info">
                <text class="name">林同学 · 1.2km</text>
                <text class="meta">¥50/小时 · 服务 28 次</text>
              </view>
              <text class="cta blink">预约</text>
            </view>
          </view>
          <text class="caption">按距离选大学生 · 一键下单</text>
        </view>

        <view v-else-if="scene === 2" class="slide">
          <text class="scene-label">学生接单</text>
          <view class="hero-card">
            <text class="badge-new">新订单</text>
            <text class="card-title">聊天陪伴 · 张奶奶</text>
            <text class="meta block">明天 14:00 · ¥50</text>
            <view class="btn-row">
              <text class="btn-primary glow sole">立即接单</text>
            </view>
          </view>
          <text class="caption">待接单池滚动 · 附近老人可接</text>
        </view>

        <view v-else-if="scene === 3" class="slide">
          <text class="scene-label">家属代付</text>
          <view class="hero-card pay-card">
            <text class="pay-amt">¥50.00</text>
            <text class="pay-ok check-pop">✓ 支付成功</text>
          </view>
          <text class="caption">演示支付 · 订单进入待服务</text>
        </view>

        <view v-else-if="scene === 4" class="slide">
          <text class="scene-label">完成闭环</text>
          <view class="timeline compact">
            <view v-for="(s, i) in timeline" :key="s" class="tl-item" :class="'tl-' + i">
              <text class="tl-dot" />
              <text class="tl-text">{{ s }}</text>
            </view>
          </view>
          <view class="income-card">
            <text class="income-num">¥285</text>
            <text class="income-label">林同学本月收入</text>
          </view>
          <text class="last-hint">即将选择演示身份</text>
        </view>
      </view>
    </view>

    <view class="chrome-bottom">
      <view class="dots">
        <view
          v-for="(s, i) in scenes"
          :key="s.id"
          class="dot-item"
          :class="{ on: i === scene }"
          @tap="goScene(i)"
        />
      </view>
      <view class="actions">
        <text class="action" @tap="replay">↺ 重播</text>
        <text class="action primary" @tap="finishTour">进入体验 ›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onHide, onShow, onUnload } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { markTourSeen } from '../../utils/tour-onboarding';

const SCENE_COUNT = 5;
const TOTAL_MS = 15000;
const INTERVAL_MS = TOTAL_MS / SCENE_COUNT;

const scenes = [
  { id: 'intro', focus: '① 平台连接老人、学生与家属' },
  { id: 'elder', focus: '② 老人按距离找大学生陪护' },
  { id: 'student', focus: '③ 学生看待接单池并接单' },
  { id: 'pay', focus: '④ 家属代付 · 订单履约' },
  { id: 'done', focus: '⑤ 服务完成 · 收入结算' },
];

const scene = ref(0);
let sceneTimer: ReturnType<typeof setInterval> | null = null;
let maxTimer: ReturnType<typeof setTimeout> | null = null;
let tourFinished = false;

const timeline = ['接单', '签到', '服务', '确认', '结算'];

const progressPct = computed(() => ((scene.value + 1) / SCENE_COUNT) * 100);

function scheduleFromCurrentScene() {
  stopTimers();
  const remainingMs = (SCENE_COUNT - scene.value) * INTERVAL_MS;
  sceneTimer = setInterval(autoAdvance, INTERVAL_MS);
  maxTimer = setTimeout(finishTour, remainingMs);
}

function goScene(i: number) {
  scene.value = ((i % SCENE_COUNT) + SCENE_COUNT) % SCENE_COUNT;
  scheduleFromCurrentScene();
}

function finishTour() {
  if (tourFinished) return;
  tourFinished = true;
  stopTimers();
  markTourSeen();
  uni.reLaunch({ url: '/pages/common/guest-role-pick' });
}

function confirmSkip() {
  uni.showModal({
    title: '跳过动画',
    content: '可直接选择老人/家属/学生演示数据进入游客模式',
    confirmText: '跳过',
    cancelText: '继续观看',
    success: (res) => {
      if (res.confirm) finishTour();
    },
  });
}

function replay() {
  tourFinished = false;
  startTour(0);
}

function autoAdvance() {
  if (scene.value >= SCENE_COUNT - 1) {
    finishTour();
    return;
  }
  scene.value += 1;
}

function stopTimers() {
  if (sceneTimer) {
    clearInterval(sceneTimer);
    sceneTimer = null;
  }
  if (maxTimer) {
    clearTimeout(maxTimer);
    maxTimer = null;
  }
}

function startTour(from = 0) {
  tourFinished = false;
  scene.value = from;
  scheduleFromCurrentScene();
}

onShow(() => startTour(0));
onHide(stopTimers);
onUnload(stopTimers);
</script>

<style scoped>
.tour {
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: var(--nb-dark-gradient);
  color: var(--nb-dark-text);
  padding: 0 28rpx;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
}
.safe-top {
  height: env(safe-area-inset-top);
  flex-shrink: 0;
}
.chrome-top {
  display: grid;
  grid-template-columns: 80rpx 1fr 64rpx;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0 16rpx;
  flex-shrink: 0;
}
.skip {
  font-size: 26rpx;
  color: var(--nb-dark-text-muted);
  padding: 8rpx 0;
}
.progress-wrap {
  height: 8rpx;
  background: var(--nb-dark-surface-alt);
  border-radius: 8rpx;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: var(--nb-primary-gradient);
  border-radius: 8rpx;
  transition: width 0.65s cubic-bezier(0.4, 0, 0.2, 1);
}
.scene-counter {
  font-size: 22rpx;
  color: var(--nb-dark-text-muted);
  text-align: right;
}
.focus-line {
  display: block;
  flex-shrink: 0;
  margin-bottom: 20rpx;
  padding: 14rpx 20rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--nb-primary-light);
  background: rgba(232, 139, 74, 0.12);
  border-radius: 12rpx;
  border-left: 6rpx solid var(--nb-primary-light);
  line-height: 1.4;
}
.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
}
.slide-wrap {
  width: 100%;
  animation: sceneIn 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes sceneIn {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.slide {
  width: 100%;
  text-align: center;
}
.slide-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2rpx;
}
.slide-sub {
  display: block;
  margin: 12rpx 0 36rpx;
  font-size: 26rpx;
  color: var(--nb-dark-text-muted);
}
.scene-label {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 28rpx;
}
.chain {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  margin: 24rpx 0;
}
.chain-node {
  width: 72%;
  max-width: 480rpx;
  padding: 22rpx 28rpx;
  border-radius: var(--nb-radius-md);
  background: var(--nb-dark-surface);
  font-size: 30rpx;
  font-weight: 500;
}
.chain-node.platform {
  background: var(--nb-primary-gradient);
  color: #fff;
  box-shadow: 0 8rpx 28rpx rgba(196, 92, 38, 0.35);
}
.chain-arrow {
  font-size: 28rpx;
  color: var(--nb-primary-light);
  line-height: 1;
}
.pulse {
  animation: pulse 2.2s ease infinite;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}
.caption {
  display: block;
  margin-top: 28rpx;
  font-size: 24rpx;
  color: var(--nb-dark-text-muted);
  line-height: 1.5;
  padding: 0 16rpx;
}
.last-hint {
  display: block;
  margin-top: 20rpx;
  font-size: 24rpx;
  color: var(--nb-primary-light);
}
.hero-card {
  background: var(--nb-surface);
  color: var(--nb-text);
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  margin: 0 auto;
  max-width: 620rpx;
  text-align: left;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.2);
}
.row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.avatar {
  width: 72rpx;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  background: var(--nb-primary-gradient);
  color: #fff;
  border-radius: 50%;
  font-size: 32rpx;
  flex-shrink: 0;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}
.meta {
  display: block;
  font-size: 22rpx;
  color: var(--nb-text-muted);
  margin-top: 6rpx;
}
.meta.block {
  margin: 8rpx 0 20rpx;
}
.cta {
  color: var(--nb-primary);
  font-weight: 700;
  font-size: 28rpx;
  flex-shrink: 0;
}
.blink {
  animation: blink 1.2s ease infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
.badge-new {
  display: inline-block;
  background: var(--nb-cream-deep);
  color: var(--nb-primary);
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-bottom: 10rpx;
}
.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
}
.btn-row {
  margin-top: 8rpx;
}
.btn-primary {
  display: block;
  text-align: center;
  padding: 18rpx;
  background: var(--nb-primary-gradient);
  color: #fff;
  border-radius: var(--nb-radius-sm);
  font-size: 28rpx;
  font-weight: 600;
}
.btn-primary.sole {
  width: 100%;
}
.glow {
  animation: glow 1.5s ease infinite;
}
@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(196, 92, 38, 0);
  }
  50% {
    box-shadow: 0 0 20rpx rgba(196, 92, 38, 0.55);
  }
}
.pay-card {
  text-align: center;
  padding: 40rpx 32rpx;
}
.pay-amt {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  color: var(--nb-text);
}
.pay-ok {
  display: block;
  margin-top: 16rpx;
  color: #09bb07;
  font-size: 30rpx;
  font-weight: 600;
}
.check-pop {
  animation: checkPop 0.45s ease 0.6s both;
}
@keyframes checkPop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}
.timeline.compact {
  text-align: left;
  margin: 0 auto 24rpx;
  max-width: 360rpx;
}
.tl-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 12rpx;
  opacity: 0;
  animation: tlIn 0.35s ease forwards;
}
.tl-0 { animation-delay: 0.05s; }
.tl-1 { animation-delay: 0.15s; }
.tl-2 { animation-delay: 0.25s; }
.tl-3 { animation-delay: 0.35s; }
.tl-4 { animation-delay: 0.45s; }
@keyframes tlIn {
  from {
    opacity: 0;
    transform: translateX(-12rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.tl-dot {
  width: 12rpx;
  height: 12rpx;
  background: var(--nb-primary-light);
  border-radius: 50%;
  flex-shrink: 0;
}
.tl-text {
  font-size: 24rpx;
  color: var(--nb-dark-text-muted);
}
.income-card {
  background: var(--nb-primary-gradient);
  border-radius: var(--nb-radius-md);
  padding: 28rpx;
  margin: 0 auto;
  max-width: 400rpx;
  text-align: center;
}
.income-num {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
}
.income-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}
.chrome-bottom {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 100%;
  max-width: 430px;
  padding: 16rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, rgba(26, 26, 46, 0.92) 24%);
  box-sizing: border-box;
  z-index: 10;
}
.dots {
  display: flex;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.dot-item {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--nb-dark-surface-alt);
  transition: all 0.3s ease;
}
.dot-item.on {
  width: 36rpx;
  border-radius: 8rpx;
  background: var(--nb-primary-light);
}
.actions {
  display: flex;
  gap: 16rpx;
}
.action {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  color: var(--nb-dark-text-muted);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 44rpx;
}
.action.primary {
  flex: 1.4;
  color: #fff;
  font-weight: 600;
  background: var(--nb-primary-gradient);
}
</style>
