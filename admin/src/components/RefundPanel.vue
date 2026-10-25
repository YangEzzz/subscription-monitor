<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  AdminUnauthorizedError,
  adminPost,
  defaultAddress,
  getJson,
  type Row,
} from '../lib/data';
type Refund = {
  refundId: string;
  status: string;
  amount: number;
  reason: string;
  operator: string;
  createdAt: string;
  updatedAt: string;
  errorCode: string | null;
};
type Quote = {
  eligible: boolean;
  reason: string;
  amount: number;
  currency: string;
  refund: Refund | null;
};
const props = defineProps<{ order: Row }>();
const emit = defineEmits<{ changed: []; unauthorized: [] }>();
const quote = ref<Quote>(),
  busy = ref(false),
  error = ref(''),
  reason = ref(''),
  reasonCode = ref('3'),
  confirming = ref(false);
const confirmation = ref<HTMLElement>();
const statuses: Record<string, string> = {
  submitting: '正在提交',
  processing: '平台处理中',
  unknown: '结果待核实',
  succeeded: '退款完成',
  failed: '退款失败',
};
const controller = new AbortController();
const endpoint = `refunds/${encodeURIComponent(String(props.order.id))}`;
const amount = () => ((quote.value?.amount || 0) / 100).toFixed(2);
function failure(e: unknown) {
  if (controller.signal.aborted) return;
  if (e instanceof AdminUnauthorizedError) emit('unauthorized');
  else
    error.value =
      e instanceof Error ? e.message : '操作暂未完成，请重新读取退款状态。';
}
async function load() {
  busy.value = true;
  error.value = '';
  try {
    const data = await getJson<Quote>(
      defaultAddress(),
      endpoint,
      controller.signal,
    );
    if (
      !data ||
      typeof data.eligible !== 'boolean' ||
      !Number.isInteger(data.amount) ||
      typeof data.reason !== 'string'
    )
      throw Error('退款信息响应不正确，请重试。');
    quote.value = data;
  } catch (e) {
    failure(e);
  } finally {
    busy.value = false;
  }
}
async function submit() {
  if (!quote.value?.eligible || busy.value) return;
  if (reason.value.trim().length < 2) {
    error.value = '请填写至少 2 个字的退款原因。';
    return;
  }
  if (!confirming.value) {
    error.value = '';
    confirming.value = true;
    await nextTick();
    confirmation.value?.focus();
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    const refund = await adminPost<Refund>(
      defaultAddress(),
      endpoint,
      {
        reason: reason.value.trim(),
        reasonCode: reasonCode.value,
        amount: quote.value.amount,
        confirmOrderId: String(props.order.id),
      },
      controller.signal,
    );
    quote.value = { ...quote.value, eligible: false, refund };
    confirming.value = false;
    emit('changed');
  } catch (e) {
    failure(e);
    if (
      !(e instanceof AdminUnauthorizedError) &&
      quote.value &&
      !controller.signal.aborted
    ) {
      quote.value = {
        ...quote.value,
        eligible: false,
        reason: '请先重新读取退款状态，核实原退款单后再操作。',
      };
      confirming.value = false;
    }
  } finally {
    busy.value = false;
  }
}
async function check() {
  busy.value = true;
  error.value = '';
  try {
    const refund = await adminPost<Refund>(
      defaultAddress(),
      endpoint + '/check',
      {},
      controller.signal,
    );
    if (quote.value) quote.value = { ...quote.value, refund };
    emit('changed');
  } catch (e) {
    failure(e);
  } finally {
    busy.value = false;
  }
}
onMounted(load);
onBeforeUnmount(() => controller.abort());
</script>
<template>
  <section
    class="refund-panel"
    aria-labelledby="refund-heading"
    :aria-busy="busy"
  >
    <h3 id="refund-heading">退款处理</h3>
    <p v-if="!quote && busy" role="status">正在检查订单退款条件…</p>
    <div v-if="error" class="refund-error" role="alert">
      <p>{{ error }}</p>
      <Button variant="outline" size="sm" :disabled="busy" @click="load"
        >重新读取退款状态</Button
      >
    </div>
    <template v-if="quote">
      <template v-if="quote.refund">
        <p class="refund-state" role="status">
          {{ statuses[quote.refund.status] || quote.refund.status }} · ¥{{
            (quote.refund.amount / 100).toFixed(2)
          }}
        </p>
        <dl class="refund-record">
          <dt>退款单号</dt>
          <dd>{{ quote.refund.refundId }}</dd>
          <dt>处理人</dt>
          <dd>{{ quote.refund.operator }}</dd>
          <dt>原因</dt>
          <dd>{{ quote.refund.reason }}</dd>
        </dl>
        <p v-if="quote.refund.status === 'unknown'">
          提交结果暂未确认。请查询原退款单，不要在其他平台重复发起。
        </p>
        <p v-else-if="quote.refund.status === 'failed'">
          平台返回退款失败。请按退款单号到微信平台核查，不会自动重复退款。
        </p>
        <p v-else-if="quote.refund.status === 'succeeded'">
          平台已确认退款完成，已同步此订单对应的会员权益。
        </p>
        <p v-else>已保留退款记录，等待平台确认完成后再同步会员权益。</p>
        <Button
          v-if="!['succeeded', 'failed'].includes(quote.refund.status)"
          variant="outline"
          :disabled="busy"
          @click="check"
          >{{ busy ? '正在查询…' : '查询退款进度' }}</Button
        >
      </template>
      <form v-else-if="quote.eligible" novalidate @submit.prevent="submit">
        <template v-if="!confirming"
          ><p>
            可全额退款 <strong>¥{{ amount() }}</strong
            >。确认完成后撤销此订单发放的会员，其他订单或来源的权益不受影响。
          </p>
          <label for="refund-reason-code">退款类别</label
          ><select
            id="refund-reason-code"
            v-model="reasonCode"
            :disabled="busy"
          >
            <option value="3">用户主动申请</option>
            <option value="1">产品问题</option>
            <option value="2">售后问题</option>
            <option value="4">价格问题</option>
            <option value="5">其他原因</option></select
          ><label for="refund-reason">退款原因</label
          ><Input
            id="refund-reason"
            v-model="reason"
            placeholder="填写本次退款的具体原因"
            :maxlength="200"
            :disabled="busy"
          /><Button type="submit" variant="outline" :disabled="busy"
            >核对并退款</Button
          ></template
        >
        <template v-else
          ><h4 ref="confirmation" tabindex="-1">
            确认向原付款账户退款 ¥{{ amount() }}？
          </h4>
          <p class="refund-order-id">订单 {{ order.id }}</p>
          <p>原因：{{ reason }}</p>
          <p>
            这是实际退款操作，提交后不能在后台撤销。平台受理不代表退款完成。
          </p>
          <div class="refund-actions">
            <Button
              type="button"
              variant="outline"
              :disabled="busy"
              @click="confirming = false"
              >返回修改</Button
            ><Button type="submit" :disabled="busy">{{
              busy ? '正在提交…' : `确认退款 ¥${amount()}`
            }}</Button>
          </div></template
        >
      </form>
      <p v-else>{{ quote.reason }}</p>
    </template>
  </section>
</template>
<style scoped>
.refund-panel {
  border-top: 1px solid var(--border);
  padding-top: 20px;
  margin-top: 20px;
  display: grid;
  gap: 14px;
  font-size: 13px;
  line-height: 1.7;
  min-width: 0;
}
.refund-panel h3,
.refund-panel h4 {
  font-weight: 600;
  font-size: 15px;
}
.refund-panel > p,
.refund-panel form > p {
  color: var(--muted-foreground);
}
.refund-panel form {
  display: grid;
  gap: 12px;
}
.refund-panel form > button {
  justify-self: start;
  margin-top: 4px;
}
.refund-panel label {
  font-weight: 500;
}
.refund-panel select {
  border: 1px solid var(--input);
  border-radius: var(--control-radius);
  padding: 8px 10px;
  background: var(--card);
  color: var(--foreground);
  width: 100%;
  font: inherit;
  min-height: 36px;
}
.refund-panel select:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.refund-state {
  font-weight: 600;
}
.refund-record {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  gap: 8px 12px;
}
.refund-record dt {
  color: var(--muted-foreground);
}
.refund-record dd,
.refund-order-id {
  overflow-wrap: anywhere;
}
.refund-error {
  color: var(--destructive);
  display: grid;
  gap: 10px;
  justify-items: start;
}
.refund-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}
</style>
