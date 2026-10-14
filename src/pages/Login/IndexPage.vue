<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="login-page">
        <main class="login-shell" aria-labelledby="login-title">
          <section class="login-card">
            <div class="brand-block">
              <div class="brand-mark" aria-hidden="true">
                <q-icon name="account_balance_wallet" />
              </div>
              <div>
                <p class="brand-name">UDEV</p>
                <p class="brand-product">Centralized Billing</p>
              </div>
            </div>

            <p id="login-title" class="tagline"
              >Billing &amp; subscription management</p
            >

            <LoginForm />

            <footer>
              <span>© 2026 UDEV Centralized Billing</span>
              <span>Panel administrasi internal Udumbara</span>
            </footer>
          </section>
        </main>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import LoginForm from './comp/LoginForm.vue'
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 83% 16%,
      rgba(38, 78, 118, 0.35),
      transparent 30%
    ),
    radial-gradient(
      circle at 12% 89%,
      rgba(247, 193, 56, 0.08),
      transparent 24%
    ),
    #091017;

  &::before {
    position: absolute;
    z-index: -1;
    top: 12%;
    left: -11rem;
    width: 21rem;
    height: 21rem;
    border-radius: 50%;
    background: rgba(255, 207, 79, 0.055);
    content: '';
    filter: blur(12px);
    animation: background-drift 13s ease-in-out infinite alternate;
  }
}

.login-shell {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px 16px;
}

.login-card {
  position: relative;
  width: min(100%, 414px);
  overflow: hidden;
  padding: 37px 28px 18px;
  border: 1px solid rgba(173, 193, 210, 0.14);
  border-radius: 12px;
  background:
    linear-gradient(140deg, rgba(24, 36, 47, 0.97), rgba(12, 19, 27, 0.98)),
    #111b25;
  box-shadow: 0 28px 65px rgba(0, 0, 0, 0.48);
  animation: card-enter 620ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &::after {
    position: absolute;
    top: -100px;
    right: -80px;
    width: 250px;
    height: 250px;
    border-radius: 50%;
    background: rgba(88, 135, 181, 0.08);
    content: '';
    pointer-events: none;
    animation: ambient-pulse 6s ease-in-out infinite;
  }
}

.brand-block {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: content-enter 500ms 180ms ease-out both;
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 8px;
  background: #ffcf4f;
  color: #17212d;
  font-size: 24px;
  animation: logo-float 4s ease-in-out 700ms infinite;
}

.brand-name,
.brand-product,
.tagline {
  margin: 0;
}

.brand-name {
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.15;
}

.brand-product {
  margin-top: 2px;
  color: #ffcf4f;
  font-size: 0.71rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tagline {
  margin: 11px 0 32px;
  color: #b7c1cc;
  font-size: 0.78rem;
  animation: content-enter 500ms 260ms ease-out both;
}

footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 28px;
  color: #8e9aa7;
  font-size: 0.61rem;
  line-height: 1.45;
  text-align: center;
  animation: content-enter 500ms 620ms ease-out both;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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

@keyframes logo-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }
}

@keyframes ambient-pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes background-drift {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(5rem, 3rem, 0);
  }
}

@media (min-width: 600px) {
  .login-card {
    padding: 42px 38px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
</style>
