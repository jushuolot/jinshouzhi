<template>
  <view class="tour">
    <view class="top-bar">
      <text class="tag">动画演示 · 自动播放</text>
      <view class="controls">
        <text class="ctrl" @tap="togglePlay">{{ playing ? '⏸' : '▶' }}</text>
        <text class="ctrl" @tap="prevScene">‹</text>
        <text class="ctrl" @tap="nextScene">›</text>
      </view>
    </view>

    <view class="stage" :class="'scene-' + scene">
      <!-- 场景 0：总览 -->
      <view v-if="scene === 0" class="slide fade-in">
        <text class="slide-title">暖伴勤工</text>
        <text class="slide-sub">附近中老年 ↔ 在校女大学生</text>
        <view class="orbit">
          <view class="node elder pulse">👵 张奶奶</view>
          <view class="link-line draw" />
          <view class="node platform">🏢 平台撮合</view>
          <view class="link-line draw delay" />
          <view class="node student pulse">👩‍🎓 林同学</view>
        </view>
        <text class="caption">有偿陪护 · 明码标价 · 平台管理匹配</text>
      </view>

      <!-- 场景 1：老人找同学 -->
      <view v-else-if="scene === 1" class="slide fade-in">
        <text class="scene-label">路径 ② 老人找同学</text>
        <view class="card anim-up">
          <text class="card-title">找陪护 · 5km 内</text>
          <view class="row">
            <text class="avatar">林</text>
            <view class="info">
              <text class="name">林同学 · 示范大学</text>
              <text class="meta">距您 1.2km · 服务 28 次 · ¥50/小时</text>
            </view>
            <text class="cta blink">预约</text>
          </view>
        </view>
        <view class="map-dots">
          <view v-for="i in 5" :key="i" class="dot" :class="'d' + i" />
        </view>
        <text class="caption">老人按距离浏览女大学生志愿者并下单</text>
      </view>

      <!-- 场景 2：学生接单 -->
      <view v-else-if="scene === 2" class="slide fade-in">
        <text class="scene-label">路径 ③ 同学找需求</text>
        <view class="card anim-up">
          <text class="badge-new">新订单</text>
          <text class="card-title">聊天陪伴 · 张奶奶</text>
          <text class="meta">明天 14:00 · 60 分钟 · ¥50</text>
          <view class="btn-row">
            <text class="btn-ghost">拒绝</text>
            <text class="btn-primary glow">立即接单</text>
          </view>
        </view>
        <view class="pool-hint">
          <text>待接单池</text>
          <text class="count-up">10</text>
          <text>单滚动可接</text>
        </view>
        <text class="caption">学生看待接单池或附近 8 位老人</text>
      </view>

      <!-- 场景 3：家属代付 -->
      <view v-else-if="scene === 3" class="slide fade-in">
        <text class="scene-label">有偿闭环 · 家属代付</text>
        <view class="pay-card anim-up">
          <text class="pay-logo">微信支付</text>
          <text class="pay-amt">¥50.00</text>
          <view class="spinner" />
          <text class="pay-ok check-pop">✓ 支付成功</text>
        </view>
        <text class="caption">演示 mock 支付 · 订单进入待服务</text>
      </view>

      <!-- 场景 4：完成撮合 -->
      <view v-else-if="scene === 4" class="slide fade-in">
        <text class="scene-label">服务完成 · 收入到账</text>
        <view class="timeline">
          <view v-for="(s, i) in timeline" :key="s" class="tl-item" :class="'tl-' + i">
            <text class="tl-dot" />
            <text class="tl-text">{{ s }}</text>
          </view>
        </view>
        <view class="income-card pop">
          <text class="income-label">林同学本月收入</text>
          <text class="income-num">¥285.00</text>
        </view>
        <text class="caption">平台记录结算 · 三端可追溯</text>
      </view>
    </view>

    <view class="dots">
      <view
        v-for="(_, i) in SCENE_COUNT"
        :key="i"
        class="dot-item"
        :class="{ on: i === scene }"
        @tap="goScene(i)"
      />
    </view>

    <view class="foot">
      <button class="btn" @tap="goLogin">亲自体验演示</button>
      <button class="btn-outline" @tap="goGodView">上帝视角 KPI</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onHide, onShow, onUnload } from '@dcloudio/uni-app';
import { ref } from 'vue';

const SCENE_COUNT = 5;
const INTERVAL_MS = 4500;

const scene = ref(0);
const playing = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;

const timeline = ['接单', '到场签到', '服务中', '完成确认', '收入结算'];

function goScene(i: number) {
  scene.value = i % SCENE_COUNT;
}

function nextScene() {
  goScene(scene.value + 1);
}

function prevScene() {
  goScene(scene.value + SCENE_COUNT - 1);
}

function startAuto() {
  stopAuto();
  if (!playing.value) return;
  timer = setInterval(() => nextScene(), INTERVAL_MS);
}

function stopAuto() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function togglePlay() {
  playing.value = !playing.value;
  if (playing.value) startAuto();
  else stopAuto();
}

onShow(() => {
  playing.value = true;
  startAuto();
});

onHide(stopAuto);
onUnload(stopAuto);

function goLogin() {
  uni.navigateTo({ url: '/pages/common/login' });
}

function goGodView() {
  uni.navigateTo({ url: '/pages/common/god-view' });
}
</script>

<style scoped>
.tour {
  min-height: 100vh;
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #eee;
  padding: 24rpx;
  padding-bottom: 48rpx;
  box-sizing: border-box;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.tag {
  font-size: 22rpx;
  color: #e88b4a;
}
.controls {
  display: flex;
  gap: 24rpx;
  font-size: 36rpx;
}
.ctrl {
  padding: 8rpx 16rpx;
}
.stage {
  min-height: 720rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.slide {
  width: 100%;
  text-align: center;
}
.fade-in {
  animation: fadeIn 0.6s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.slide-title {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  color: #fff;
}
.slide-sub {
  display: block;
  margin: 16rpx 0 48rpx;
  font-size: 28rpx;
  color: #aaa;
}
.scene-label {
  display: block;
  font-size: 24rpx;
  color: #e88b4a;
  margin-bottom: 32rpx;
}
.orbit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  flex-wrap: wrap;
  margin: 32rpx 0;
}
.node {
  background: #16213e;
  padding: 20rpx 28rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
}
.node.platform {
  background: #c45c26;
  color: #fff;
}
.link-line {
  width: 48rpx;
  height: 4rpx;
  background: #e88b4a;
  animation: drawLine 1s ease infinite alternate;
}
.link-line.delay {
  animation-delay: 0.5s;
}
@keyframes drawLine {
  from {
    width: 24rpx;
    opacity: 0.4;
  }
  to {
    width: 64rpx;
    opacity: 1;
  }
}
.pulse {
  animation: pulse 2s ease infinite;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
.caption {
  display: block;
  margin-top: 40rpx;
  font-size: 24rpx;
  color: #888;
}
.card {
  background: #fff;
  color: #333;
  border-radius: 20rpx;
  padding: 32rpx;
  margin: 0 16rpx;
  text-align: left;
}
.anim-up {
  animation: slideUp 0.5s ease;
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
}
.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
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
  background: #c45c26;
  color: #fff;
  border-radius: 50%;
  font-size: 32rpx;
}
.info {
  flex: 1;
}
.name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}
.meta {
  display: block;
  font-size: 22rpx;
  color: #888;
  margin-top: 6rpx;
}
.cta {
  color: #c45c26;
  font-weight: 600;
  font-size: 28rpx;
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
    opacity: 0.4;
  }
}
.map-dots {
  position: relative;
  height: 120rpx;
  margin: 32rpx 48rpx;
}
.dot {
  position: absolute;
  width: 16rpx;
  height: 16rpx;
  background: #e88b4a;
  border-radius: 50%;
  animation: dotPulse 2s ease infinite;
}
.d1 {
  left: 10%;
  top: 20%;
}
.d2 {
  left: 30%;
  top: 60%;
  animation-delay: 0.3s;
}
.d3 {
  left: 50%;
  top: 30%;
  animation-delay: 0.6s;
}
.d4 {
  left: 70%;
  top: 70%;
  animation-delay: 0.9s;
}
.d5 {
  left: 85%;
  top: 40%;
  animation-delay: 1.2s;
}
@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.8);
    opacity: 1;
  }
}
.badge-new {
  display: inline-block;
  background: #ffe8dc;
  color: #c45c26;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}
.btn-row {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.btn-ghost {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border: 1rpx solid #ddd;
  border-radius: 12rpx;
  font-size: 26rpx;
}
.btn-primary {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
  font-size: 26rpx;
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
    box-shadow: 0 0 24rpx rgba(196, 92, 38, 0.6);
  }
}
.pool-hint {
  margin-top: 32rpx;
  font-size: 26rpx;
  color: #aaa;
}
.count-up {
  color: #e88b4a;
  font-size: 40rpx;
  font-weight: 700;
  margin: 0 8rpx;
}
.pay-card {
  background: #fff;
  color: #333;
  border-radius: 20rpx;
  padding: 48rpx;
  margin: 0 32rpx;
}
.pay-logo {
  display: block;
  font-size: 32rpx;
  color: #09bb07;
  font-weight: 600;
}
.pay-amt {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  margin: 24rpx 0;
}
.spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #eee;
  border-top-color: #09bb07;
  border-radius: 50%;
  margin: 24rpx auto;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.pay-ok {
  display: block;
  color: #09bb07;
  font-size: 32rpx;
  font-weight: 600;
}
.check-pop {
  animation: checkPop 0.5s ease 1.2s both;
}
@keyframes checkPop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
}
.timeline {
  text-align: left;
  margin: 0 48rpx 32rpx;
}
.tl-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
  opacity: 0;
  animation: tlIn 0.4s ease forwards;
}
.tl-0 {
  animation-delay: 0.1s;
}
.tl-1 {
  animation-delay: 0.3s;
}
.tl-2 {
  animation-delay: 0.5s;
}
.tl-3 {
  animation-delay: 0.7s;
}
.tl-4 {
  animation-delay: 0.9s;
}
@keyframes tlIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
  from {
    opacity: 0;
    transform: translateX(-20rpx);
  }
}
.tl-dot {
  width: 16rpx;
  height: 16rpx;
  background: #e88b4a;
  border-radius: 50%;
}
.tl-text {
  font-size: 26rpx;
  color: #ccc;
}
.income-card {
  background: linear-gradient(135deg, #c45c26, #e88b4a);
  border-radius: 16rpx;
  padding: 32rpx;
  margin: 0 32rpx;
}
.pop {
  animation: pop 0.5s ease 1s both;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
}
.income-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}
.income-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  margin-top: 8rpx;
}
.dots {
  display: flex;
  justify-content: center;
  gap: 12rpx;
  margin: 32rpx 0;
}
.dot-item {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #444;
}
.dot-item.on {
  background: #e88b4a;
  width: 32rpx;
  border-radius: 8rpx;
}
.foot {
  margin-top: 16rpx;
}
.btn {
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
.btn-outline {
  margin-top: 16rpx;
  background: transparent;
  color: #e88b4a;
  border: 1rpx solid #e88b4a;
  border-radius: 12rpx;
}
</style>
