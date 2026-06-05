<template>
  <view class="page">
    <view class="hero">
      <text class="title">绑定老人</text>
      <text class="sub">演示环境：从列表选择老人并建立家属关系</text>
    </view>

    <view class="section-title">选择老人</view>
    <view
      v-for="e in elders"
      :key="e.id"
      class="elder-pick"
      :class="{ selected: selectedId === e.id }"
      @tap="selectedId = e.id"
    >
      <text class="name">{{ e.name }}</text>
      <text class="org">{{ e.orgName }}</text>
    </view>

    <view class="section-title">与老人关系</view>
    <input v-model="relation" class="input" placeholder="如：女儿、儿子" />

    <button class="btn" :loading="loading" @tap="submit">确认绑定</button>
    <text class="hint">正式版将支持扫码绑定；当前写入 family_elder_bindings</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { bindElder } from '../api/family';
import { pbList } from '../api/pb';
import { useRoleStore } from '../store/role';
import { pbErrorMessage } from '../utils/request';

interface ElderPick {
  id: string;
  name: string;
  orgName: string;
}

const roleStore = useRoleStore();
const elders = ref<ElderPick[]>([]);
const selectedId = ref('');
const relation = ref('家属');
const loading = ref(false);

onShow(async () => {
  try {
    const res = await pbList<{ id: string; name: string; expand?: { org?: { name: string } } }>(
      'elders',
      { filter: 'enabled = true', expand: 'org', perPage: 20 },
    );
    elders.value = res.items.map((e) => ({
      id: e.id,
      name: e.name,
      orgName: e.expand?.org?.name || '养老院',
    }));
    if (elders.value.length && !selectedId.value) selectedId.value = elders.value[0].id;
  } catch {
    elders.value = [];
  }
});

async function submit() {
  if (!roleStore.user?.id || !selectedId.value) return;
  loading.value = true;
  try {
    await bindElder(roleStore.user.id, selectedId.value, relation.value || '家属');
    uni.showToast({ title: '绑定成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 600);
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
.hero {
  background: #fff;
  padding: 32rpx 28rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #888;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin: 24rpx 0 12rpx;
}
.elder-pick {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  border: 2rpx solid transparent;
}
.elder-pick.selected {
  border-color: #c45c26;
  background: #fffaf5;
}
.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.org {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #888;
}
.input {
  background: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.btn {
  margin-top: 32rpx;
  background: #c45c26;
  color: #fff;
  border-radius: 12rpx;
}
.hint {
  display: block;
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #bbb;
  text-align: center;
}
</style>
