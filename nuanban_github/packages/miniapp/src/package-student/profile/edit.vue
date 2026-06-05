<template>
  <view class="page">
    <text class="section">显示名称</text>
    <input v-model="displayName" class="input" placeholder="如：林同学" />
    <text class="section">学校</text>
    <picker :range="schools" :value="schoolIdx" @change="onSchoolPick">
      <view class="picker">{{ schools[schoolIdx] }}</view>
    </picker>
    <text class="hint">切换学校后，「发现」页学校合作筛选结果会变化</text>
    <button class="btn" :loading="loading" @tap="save">保存</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { fetchStudentProfile } from '../../api/student';
import { request } from '../../utils/request';
import { DEMO_SCHOOLS } from '../../utils/demo-rich-data';
import { pbErrorMessage } from '../../utils/request';

const schools = [...DEMO_SCHOOLS];
const displayName = ref('');
const schoolIdx = ref(0);
const loading = ref(false);

onShow(async () => {
  try {
    const p = await fetchStudentProfile();
    displayName.value = p.displayName || p.nickname;
    const idx = schools.indexOf(p.schoolName as (typeof schools)[number]);
    schoolIdx.value = idx >= 0 ? idx : 0;
  } catch {
    /* ignore */
  }
});

function onSchoolPick(e: { detail: { value: string } }) {
  schoolIdx.value = Number(e.detail.value);
}

async function save() {
  loading.value = true;
  try {
    await request({
      url: '/nuanban/student/profile',
      method: 'PATCH',
      data: {
        displayName: displayName.value,
        schoolName: schools[schoolIdx.value],
      },
    });
    uni.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}
.section {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin: 24rpx 0 12rpx;
}
.input,
.picker {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.hint {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #bbb;
}
.btn {
  margin-top: 40rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
</style>
