<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo">
        <h2>Nine Chronicles Marketplace</h2>
      </div>
      
      <div class="wallet-info">
        <div class="info-item">
          <span class="label">Network:</span>
          <span class="value network">{{ networkName }}</span>
        </div>
        <div class="info-item">
          <span class="label">Address:</span>
          <span class="value address">{{ formatAddress(walletAddress) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Balance:</span>
          <span class="value balance">{{ walletBalance }}</span>
        </div>
      </div>
      
      <div class="header-actions">
        <button v-if="isReadOnlyMode" @click="connect" class="btn btn-primary">
          Connect
        </button>
        <button v-else @click="disconnect" class="btn btn-outline">
          Disconnect
        </button>
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
}>()

function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function disconnect() {
  // Clear session storage
  sessionStorage.removeItem('walletData')
  sessionStorage.removeItem('readOnlyChain')
  
  // Reload the page to reset state
  window.location.reload()
}

function connect() {
  emit('connect')
}
</script>

<style scoped>
.app-header {
  background: #1a1f3a;
  border-bottom: 1px solid #2d3748;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo h2 {
  color: #e2e8f0;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.wallet-info {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 0.875rem;
  font-weight: 600;
}

.value.network {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.value.address {
  color: #cbd5e0;
  font-family: monospace;
}

.value.balance {
  color: #8b5cf6;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #3d4757;
  border-radius: 6px;
  background: #252b42;
  color: #cbd5e0;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #2d3748;
  border-color: #6366f1;
  color: #e2e8f0;
}

.btn-outline {
  border-color: #ef4444;
  color: #ef4444;
  background: transparent;
}

.btn-outline:hover {
  background: #ef4444;
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .wallet-info {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
  
  .info-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding: 0.5rem;
    background: #252b42;
    border-radius: 6px;
    border: 1px solid #2d3748;
  }

  .label {
    font-size: 0.7rem;
  }

  .value {
    font-size: 0.8rem;
  }

  .value.address {
    word-break: break-all;
    max-width: 60%;
    text-align: right;
  }
  
  .logo h2 {
    font-size: 1.25rem;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .logo h2 {
    font-size: 1.1rem;
  }

  .info-item {
    padding: 0.4rem;
  }

  .label {
    font-size: 0.65rem;
  }

  .value {
    font-size: 0.75rem;
  }

  .value.address {
    max-width: 55%;
  }
}
</style>
