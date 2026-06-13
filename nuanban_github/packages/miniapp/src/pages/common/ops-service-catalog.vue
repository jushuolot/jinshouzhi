<template>
  <view class="page nb-page">
    <text class="title">服务类目配置</text>
    <text class="sub">维护平台服务类目与定价 · 老人/家属下单与派单引用</text>

    <view class="form-card nb-card">
      <text class="form-title">新增类目</text>
      <input v-model="newCategoryName" class="input nb-input" placeholder="如：陪伴聊天" />
      <button class="btn-add" :loading="addingCategory" @tap="addCategory">添加类目</button>
    </view>

    <view class="form-card nb-card">
      <text class="form-title">{{ editingItemId ? '编辑服务项' : '新增服务项' }}</text>
      <text class="label">所属类目</text>
      <picker
        :range="categoryNames"
        :value="itemCategoryIdx"
        :disabled="!allCategories.length"
        @change="onCategoryPick"
      >
        <view class="picker nb-input">{{ categoryNames[itemCategoryIdx] || '请先添加类目' }}</view>
      </picker>
      <text class="label">服务名称</text>
      <input v-model="itemName" class="input nb-input" placeholder="如：聊天陪伴" />
      <text class="label">价格（元）</text>
      <input v-model="itemPriceYuan" class="input nb-input" type="digit" placeholder="如：50" />
      <text class="label">时长（分钟）</text>
      <input v-model="itemDuration" class="input nb-input" type="number" placeholder="默认 60" />
      <view class="switch-row">
        <text class="switch-label">需外出审批</text>
        <switch :checked="itemOutdoor" color="#c45c26" @change="itemOutdoor = $event.detail.value" />
      </view>
      <view v-if="editingItemId" class="switch-row">
        <text class="switch-label">启用</text>
        <switch :checked="itemEnabled" color="#c45c26" @change="itemEnabled = $event.detail.value" />
      </view>
      <view class="btn-row">
        <button v-if="editingItemId" class="btn-cancel" @tap="cancelEdit">取消</button>
        <button class="btn-add" :loading="savingItem" :disabled="!allCategories.length" @tap="saveItem">
          {{ editingItemId ? '保存修改' : '添加服务项' }}
        </button>
      </view>
    </view>

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!catalog?.categories.length && !catalog?.uncategorized.length" class="empty">
      暂无服务配置。添加类目与服务项后，正式环境下单将引用此处定价。
    </view>

    <view v-for="cat in catalog?.categories ?? []" :key="cat.id" class="group-card nb-card">
      <text class="cat-name">{{ cat.name }}</text>
      <view v-if="!cat.items.length" class="no-item">暂无服务项</view>
      <view v-for="item in cat.items" :key="item.id" class="item-row">
        <view class="item-main">
          <text class="item-name">{{ item.name }}</text>
          <text class="item-meta">
            ¥{{ item.priceYuan }} · {{ item.durationMinutes }} 分钟
            <text v-if="item.requiresOutdoorApproval"> · 外出审批</text>
          </text>
        </view>
        <view class="item-actions">
          <text class="enabled-tag" :class="{ off: !item.enabled }">
            {{ item.enabled ? '启用' : '停用' }}
          </text>
          <text class="action" @tap="toggleEnabled(item)">{{ item.enabled ? '停用' : '启用' }}</text>
          <text class="action" @tap="startEdit(item)">编辑</text>
        </view>
      </view>
    </view>

    <view v-if="catalog?.uncategorized.length" class="group-card nb-card">
      <text class="cat-name">未分类</text>
      <view v-for="item in catalog.uncategorized" :key="item.id" class="item-row">
        <view class="item-main">
          <text class="item-name">{{ item.name }}</text>
          <text class="item-meta">¥{{ item.priceYuan }} · {{ item.durationMinutes }} 分钟</text>
        </view>
        <view class="item-actions">
          <text class="enabled-tag" :class="{ off: !item.enabled }">
            {{ item.enabled ? '启用' : '停用' }}
          </text>
          <text class="action" @tap="toggleEnabled(item)">{{ item.enabled ? '停用' : '启用' }}</text>
          <text class="action" @tap="startEdit(item)">编辑</text>
        </view>
      </view>
    </view>

    <view v-if="catalog" class="hint">
      共 {{ catalog.totalItems }} 项服务 · {{ catalog.enabledCount }} 项已启用
    </view>

    <OpsTabBar current="/pages/common/ops-service-catalog" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import OpsTabBar from '../../components/OpsTabBar.vue';
import {
  createServiceCategory,
  createServiceItem,
  fetchServiceCatalog,
  updateServiceItem,
  type ServiceCatalog,
  type ServiceCatalogItem,
} from '../../api/platform';
import { requireOpsSession } from '../../utils/ops-mode';
import { pbErrorMessage } from '../../utils/request';

const catalog = ref<ServiceCatalog | null>(null);
const loading = ref(false);
const addingCategory = ref(false);
const savingItem = ref(false);

const newCategoryName = ref('');

const editingItemId = ref('');
const itemCategoryIdx = ref(0);
const itemName = ref('');
const itemPriceYuan = ref('');
const itemDuration = ref('60');
const itemOutdoor = ref(false);
const itemEnabled = ref(true);

const allCategories = computed(() => catalog.value?.categories ?? []);
const categoryNames = computed(() => allCategories.value.map((c) => c.name || '未命名类目'));

function resetItemForm() {
  editingItemId.value = '';
  itemCategoryIdx.value = 0;
  itemName.value = '';
  itemPriceYuan.value = '';
  itemDuration.value = '60';
  itemOutdoor.value = false;
  itemEnabled.value = true;
}

function onCategoryPick(e: { detail: { value: string } }) {
  itemCategoryIdx.value = Number(e.detail.value);
}

function parsePriceCents(yuan: string): number | null {
  const n = parseFloat(yuan.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

async function reload() {
  loading.value = true;
  try {
    catalog.value = await fetchServiceCatalog();
    if (itemCategoryIdx.value >= (catalog.value?.categories.length ?? 0)) {
      itemCategoryIdx.value = 0;
    }
  } catch (e) {
    catalog.value = null;
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!requireOpsSession()) return;
  void reload();
});

async function addCategory() {
  const name = newCategoryName.value.trim();
  if (!name) {
    uni.showToast({ title: '请输入类目名称', icon: 'none' });
    return;
  }
  addingCategory.value = true;
  try {
    await createServiceCategory(name);
    newCategoryName.value = '';
    uni.showToast({ title: '已添加', icon: 'success' });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    addingCategory.value = false;
  }
}

function startEdit(item: ServiceCatalogItem) {
  editingItemId.value = item.id;
  itemName.value = item.name;
  itemPriceYuan.value = item.priceYuan;
  itemDuration.value = String(item.durationMinutes || 60);
  itemOutdoor.value = item.requiresOutdoorApproval;
  itemEnabled.value = item.enabled;
  const idx = allCategories.value.findIndex((c) => c.id === item.categoryId);
  itemCategoryIdx.value = idx >= 0 ? idx : 0;
}

function cancelEdit() {
  resetItemForm();
}

async function saveItem() {
  const cat = allCategories.value[itemCategoryIdx.value];
  if (!cat) {
    uni.showToast({ title: '请先添加类目', icon: 'none' });
    return;
  }
  const name = itemName.value.trim();
  if (!name) {
    uni.showToast({ title: '请输入服务名称', icon: 'none' });
    return;
  }
  const priceCents = parsePriceCents(itemPriceYuan.value);
  if (priceCents == null) {
    uni.showToast({ title: '请填写有效价格', icon: 'none' });
    return;
  }
  const durationMinutes = parseInt(itemDuration.value, 10) || 60;
  savingItem.value = true;
  try {
    const payload = {
      categoryId: cat.id,
      name,
      priceCents,
      durationMinutes,
      requiresOutdoorApproval: itemOutdoor.value,
      enabled: itemEnabled.value,
    };
    if (editingItemId.value) {
      await updateServiceItem(editingItemId.value, payload);
      uni.showToast({ title: '已保存', icon: 'success' });
    } else {
      await createServiceItem(payload);
      uni.showToast({ title: '已添加', icon: 'success' });
    }
    resetItemForm();
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    savingItem.value = false;
  }
}

async function toggleEnabled(item: ServiceCatalogItem) {
  try {
    await updateServiceItem(item.id, { enabled: !item.enabled });
    uni.showToast({ title: item.enabled ? '已停用' : '已启用', icon: 'success' });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
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
}
.form-card {
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.form-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.label {
  display: block;
  margin: 16rpx 0 8rpx;
  font-size: 24rpx;
  color: #666;
}
.input,
.picker {
  width: 100%;
  box-sizing: border-box;
}
.picker {
  padding: 20rpx 24rpx;
}
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
}
.switch-label {
  font-size: 26rpx;
  color: #333;
}
.btn-row {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.btn-add {
  flex: 1;
  background: var(--nb-primary, #c45c26);
  color: #fff;
  border-radius: 12rpx;
}
.btn-cancel {
  flex: 0 0 auto;
  background: #f5f5f5;
  color: #666;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.group-card {
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.cat-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.item-row:last-child {
  border-bottom: none;
}
.item-main {
  flex: 1;
  min-width: 0;
}
.item-name {
  display: block;
  font-size: 26rpx;
  color: #333;
}
.item-meta {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #999;
}
.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
  flex-shrink: 0;
}
.enabled-tag {
  font-size: 20rpx;
  color: #2e7d32;
  background: #e8f5e9;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
.enabled-tag.off {
  color: #999;
  background: #f0f0f0;
}
.action {
  font-size: 24rpx;
  color: #c45c26;
}
.no-item {
  font-size: 24rpx;
  color: #999;
}
.state,
.empty {
  text-align: center;
  color: #999;
  padding: 48rpx 24rpx;
  font-size: 26rpx;
  line-height: 1.5;
}
.hint {
  margin-top: 16rpx;
  padding: 20rpx;
  font-size: 24rpx;
  color: #888;
  background: #fff;
  border-radius: 12rpx;
  line-height: 1.5;
}
</style>
