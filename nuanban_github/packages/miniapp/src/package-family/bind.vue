<template>
  <view class="page">
    <view class="hero">
      <text class="title">绑定老人</text>
      <text class="sub">{{ isDemoMock ? '输入老人绑定码或从列表选择（零成本演示，无需付费扫码 SDK）' : '输入老人绑定码或从列表选择' }}</text>
    </view>

    <view class="segmented">
      <view class="seg" :class="{ active: mode === 'code' }" @tap="mode = 'code'">绑定码</view>
      <view class="seg" :class="{ active: mode === 'list' }" @tap="mode = 'list'">列表选择</view>
    </view>

    <template v-if="mode === 'code'">
      <view class="section-title">输入绑定码</view>
      <input v-model="codeInput" class="input" placeholder="NUANBAN:elder:elder-zhang" />
      <text class="hint">老人端「我的 → 家属绑定码」可复制；也可粘贴绑定链接</text>
      <view class="section-title">与老人关系</view>
      <input v-model="relation" class="input" placeholder="如：女儿、儿子" />
      <button class="btn" :loading="loading" @tap="submitByCode">确认绑定</button>
    </template>

    <template v-else>
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
      <button class="btn" :loading="loading" @tap="submitByList">确认绑定</button>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { bindElder } from '../api/family';
import { pbList } from '../api/pb';
import { useRoleStore } from '../store/role';
import { parseElderBindCode } from '../utils/bind-code';
import { pbErrorMessage } from '../utils/request';
import { isDemoMockEnabled } from '../utils/demo-mock';

const isDemoMock = isDemoMockEnabled();

interface ElderPick {
  id: string;
  name: string;
  orgName: string;
}

const roleStore = useRoleStore();
const mode = ref<'code' | 'list'>('code');
const elders = ref<ElderPick[]>([]);
const selectedId = ref('');
const codeInput = ref('');
const relation = ref('家属');
const loading = ref(false);

onLoad((q) => {
  const code = (q?.code as string) || '';
  if (code) {
    mode.value = 'code';
    codeInput.value = decodeURIComponent(code);
    const elderId = parseElderBindCode(codeInput.value);
    if (elderId) selectedId.value = elderId;
  }
});

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

async function doBind(elderId: string) {
  if (!roleStore.user?.id || !elderId) {
    uni.showToast({ title: '请先登录或检查绑定码', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await bindElder(roleStore.user.id, elderId, relation.value || '家属');
    uni.showToast({ title: '绑定成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 600);
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function submitByCode() {
  const elderId = parseElderBindCode(codeInput.value);
  if (!elderId) {
    uni.showToast({ title: '绑定码格式无效', icon: 'none' });
    return;
  }
  doBind(elderId);
}

function submitByList() {
  doBind(selectedId.value);
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
.segmented {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}
.seg {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  color: #666;
}
.seg.active {
  color: #c45c26;
  font-weight: 600;
  background: #fffaf5;
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
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #bbb;
}
</style>
