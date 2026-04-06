<template>
  <header class="app-header">
    <div class="header-glow"></div>
    <div class="header-content">
      <div class="logo">
        <div class="logo-icon">◈</div>
        <div class="logo-text">
          <span class="logo-nine">9C</span>
          <span class="logo-title">Marketplace</span>
        </div>
      </div>

      <div class="wallet-info">
        <div class="info-chip" v-if="networkName">
          <span class="chip-dot network-dot"></span>
          <span class="chip-label">{{ networkName }}</span>
        </div>
        <div class="info-chip" v-if="walletAddress">
          <span class="chip-icon">◉</span>
          <span class="chip-label mono">{{ formatAddress(walletAddress) }}</span>
        </div>
        <div class="info-chip balance-chip" v-if="walletBalance">
          <span class="chip-icon balance-icon">◆</span>
          <span class="chip-label balance-value">{{ walletBalance }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button v-if="isReadOnlyMode" @click="connect" class="btn btn-connect">
          <span class="btn-icon">⚡</span>
          Connect Wallet
        </button>
        <template v-else>
          <button @click="transfer" class="btn btn-transfer">
            <span class="btn-icon">⇄</span>
            Transfer NCG
          </button>
          <button @click="disconnect" class="btn btn-disconnect">
            Disconnect
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  networkName: string
  walletAddress: string
  walletBalance: string
  isReadOnlyMode?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  connect: []
  transfer: []
}>()

function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function disconnect() {
  sessionStorage.removeItem('walletData')
  sessionStorage.removeItem('readOnlyChain')
  window.location.reload()
}

function connect() {
  emit('connect')
}

function transfer() {
  emit('transfer')
}
</script>

<style scoped>
.app-header {
  background: rgba(14, 18, 42, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  box-shadow: 0 1px 0 rgba(99, 102, 241, 0.1), 0 4px 24px rgba(0, 0, 0, 0.4);
  position: sticky;
  top: 0;
  z-index: 100;
  overflow: hidden;
}

.header-glow {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 80px;
  background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.875rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 1.6rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.5));
  line-height: 1;
}

.logo-text {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.logo-nine {
  font-size: 1.4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.logo-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.3px;
}

/* Wallet Info */
.wallet-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.info-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #cbd5e0;
  transition: border-color 0.2s;
}

.info-chip:hover {
  border-color: rgba(99, 102, 241, 0.3);
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.network-dot {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
  animation: pulse-dot 2.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(16, 185, 129, 0.6); }
  50% { opacity: 0.7; box-shadow: 0 0 10px rgba(16, 185, 129, 0.9); }
}

.chip-icon {
  font-size: 0.7rem;
  color: #64748b;
}

.balance-chip {
  border-color: rgba(139, 92, 246, 0.25);
  background: rgba(139, 92, 246, 0.06);
}

.balance-icon {
  color: #8b5cf6 !important;
}

.balance-value {
  color: #a78bfa;
  font-weight: 600;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
}

/* Actions */
.header-actions {
  display: flex;
  gap: 0.625rem;
  flex-shrink: 0;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-icon {
  font-size: 0.9rem;
}

.btn-connect {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.3);
}

.btn-connect:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
}

.btn-transfer {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
}

.btn-transfer:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);
}

.btn-disconnect {
  background: transparent;
  color: #94a3b8;
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-disconnect:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

@media (max-width: 900px) {
  .header-content {
    flex-wrap: wrap;
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }

  .wallet-info {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .header-actions {
    order: 2;
  }
}

@media (max-width: 480px) {
  .logo-title { display: none; }
  .header-content { padding: 0.625rem 0.875rem; }
  .info-chip { font-size: 0.75rem; padding: 0.3rem 0.6rem; }
  .btn { padding: 0.4rem 0.75rem; font-size: 0.8rem; }
}
</style>
