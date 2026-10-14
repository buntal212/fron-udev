<template>
  <q-form class="login-form" @submit="handleSubmit">
    <div class="form-heading">
      <h1>Masuk ke akun Anda</h1>
      <p>
        Kelola aplikasi, pelanggan, tagihan, dan pembayaran UDEV secara
        terpusat.
      </p>
    </div>

    <div class="credentials q-gutter-y-md">
      <q-input
        v-model.trim="store.form.username"
        dark
        outlined
        dense
        label="Username"
        autocomplete="username"
        :rules="usernameRules"
        hide-bottom-space
      >
        <template #prepend>
          <q-icon name="person_outline" size="18px" />
        </template>
      </q-input>

      <q-input
        v-model="store.form.password"
        dark
        outlined
        dense
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        autocomplete="current-password"
        :rules="passwordRules"
        hide-bottom-space
      >
        <template #prepend>
          <q-icon name="lock_outline" size="18px" />
        </template>
        <template #append>
          <q-btn
            flat
            round
            dense
            :icon="showPassword ? 'visibility_off' : 'visibility'"
            :aria-label="
              showPassword ? 'Sembunyikan password' : 'Tampilkan password'
            "
            @click="showPassword = !showPassword"
          />
        </template>
      </q-input>
    </div>

    <div class="form-options">
      <q-checkbox
        v-model="store.form.remember"
        dense
        dark
        color="amber-5"
        label="Ingat saya"
      />
      <a href="#lupa-password" @click.prevent> Lupa password? </a>
    </div>

    <q-btn
      class="login-button full-width"
      unelevated
      type="submit"
      label="Masuk"
      icon-right="arrow_forward"
      :loading="store.loading"
      no-caps
    />

    <q-banner v-if="store.error" class="login-feedback login-error" rounded>
      {{ store.error }}
    </q-banner>
    <q-banner v-else-if="store.submitted" class="login-feedback" rounded>
      Login berhasil diproses.
    </q-banner>
  </q-form>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginStore } from '@/stores/login'

const store = useLoginStore()
const router = useRouter()
const route = useRoute()
const showPassword = ref(false)
const usernameRules = [value => !!value || 'Username wajib diisi']
const passwordRules = [value => !!value || 'Password wajib diisi']

async function handleSubmit() {
  await store.submit()

  if (store.submitted) {
    const redirect = route.query.redirect
    const target =
      typeof redirect === 'string' &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//')
        ? redirect
        : '/'

    await router.push(target)
  }
}
</script>

<style scoped lang="scss">
.login-form {
  width: 100%;
}

.form-heading {
  margin-bottom: 28px;
  animation: content-enter 500ms 340ms ease-out both;

  h1 {
    margin: 0 0 8px;
    color: #fff;
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    color: #aeb9c5;
    font-size: 0.82rem;
    line-height: 1.5;
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 17px 0 20px;
  color: #c2cbd5;
  font-size: 0.75rem;
  animation: content-enter 500ms 500ms ease-out both;

  :deep(.q-checkbox__label) {
    font-size: 0.75rem;
  }

  a {
    color: #ffd052;
    font-weight: 600;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      color: #ffe49b;
      text-decoration: underline;
    }
  }
}

.login-button {
  min-height: 43px;
  border-radius: 7px;
  background: #ffcf4f;
  color: #1b2430;
  font-size: 0.85rem;
  font-weight: 700;
  animation: content-enter 500ms 580ms ease-out both;
  transition:
    box-shadow 180ms ease,
    transform 180ms ease,
    background-color 180ms ease;

  &:hover:not(.disabled) {
    background: #ffda6b;
    box-shadow: 0 9px 22px rgba(255, 207, 79, 0.2);
    transform: translateY(-1px);
  }

  :deep(.q-icon) {
    font-size: 1rem;
  }
}

.login-feedback {
  margin-top: 16px;
  background: rgba(255, 207, 79, 0.12);
  border: 1px solid rgba(255, 207, 79, 0.28);
  color: #ffe49b;
  font-size: 0.75rem;
  line-height: 1.4;
}

.login-error {
  background: rgba(231, 91, 91, 0.12);
  border-color: rgba(231, 91, 91, 0.3);
  color: #ffc1c1;
}

.credentials :deep(.q-field) {
  animation: content-enter 500ms ease-out both;
}

.credentials :deep(.q-field:nth-child(1)) {
  animation-delay: 400ms;
}

.credentials :deep(.q-field:nth-child(2)) {
  animation-delay: 460ms;
}

:deep(.q-field--dark .q-field__control:before) {
  border-color: rgba(207, 217, 227, 0.2);
}

:deep(.q-field--dark.q-field--highlighted .q-field__control:after) {
  border-color: #ffcf4f;
}

:deep(.q-field__label),
:deep(.q-field__native),
:deep(.q-field__prepend),
:deep(.q-field__append) {
  color: #d7dfe8;
}

@keyframes content-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }
}
</style>
