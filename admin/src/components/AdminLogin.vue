<script setup lang="ts">
import { ref } from 'vue';
import { CalendarDays, LockKeyhole, LoaderCircle } from '@lucide/vue';
import { Input } from './ui/input';
import { Button } from './ui/button';
defineProps<{ busy: boolean; error: string; configured: boolean }>();
const emit = defineEmits<{
  login: [username: string, password: string];
  retry: [];
}>();
const account = ref('admin');
const password = ref('');
const validationError = ref('');
function submit() {
  if (!account.value.trim() || !password.value) {
    validationError.value = '请输入管理员账号和密码。';
    return;
  }
  validationError.value = '';
  emit('login', account.value.trim(), password.value);
  password.value = '';
}
</script>
<template>
  <main class="login-screen">
    <div class="login-brand">
      <CalendarDays :size="26" /><strong>续订清单</strong><span>管理后台</span>
    </div>
    <section class="login-panel" aria-labelledby="login-title">
      <span class="login-lock"><LockKeyhole :size="22" /></span>
      <h1 id="login-title">登录管理后台</h1>
      <p class="login-description">使用管理员账号查看用户、订单与异常。</p>
      <p v-if="!configured" class="login-error" role="alert">
        管理员账号尚未初始化，请先完成账号配置。
      </p>
      <p v-if="error" class="login-error" role="alert">{{ error }}</p>
      <form novalidate @submit.prevent="submit">
        <p v-if="validationError" class="login-error" role="alert">
          {{ validationError }}
        </p>
        <label for="admin-account">管理员账号</label>
        <Input
          id="admin-account"
          v-model="account"
          autocomplete="username"
          required
          maxlength="64"
          :disabled="busy"
        />
        <label for="admin-password">密码</label>
        <Input
          id="admin-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          maxlength="1024"
          :disabled="busy"
        />
        <Button
          type="submit"
          :disabled="busy || !configured || !account.trim() || !password"
          class="login-submit"
          ><LoaderCircle v-if="busy" class="spinning" />{{
            busy ? '正在连接…' : '登录'
          }}</Button
        >
      </form>
      <Button
        v-if="error || !configured"
        variant="ghost"
        :disabled="busy"
        class="login-retry"
        @click="emit('retry')"
        >重新检查连接</Button
      >
      <p class="login-note">仅限管理员访问 · 登录有效期 8 小时</p>
    </section>
  </main>
</template>
