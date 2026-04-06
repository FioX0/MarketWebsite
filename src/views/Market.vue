<template>
  <div class="market-page">
    <AppHeader 
      :network-name="walletData.currentNetworkName"
      :wallet-address="walletData.walletAddress"
      :wallet-balance="walletData.walletBalance"
      :is-read-only-mode="isReadOnlyMode"
      @connect="handleConnectFromHeader"
      @transfer="openTransferModal"
    />
    
    <!-- Login Modal -->
    <div v-if="showLoginModal" class="modal-overlay" @click.self="closeLoginModal">
      <div class="modal-content login-modal">
        <div class="modal-header">
          <h2>Connect to Marketplace</h2>
        </div>
        <div class="modal-body">
          <p>Please connect your Chrono wallet or use read-only mode to browse the marketplace.</p>
          
          <div v-if="!showChainSelector" class="login-options">
            <button @click="connectWithChrono" class="btn btn-primary" :disabled="!walletAvailable || isConnecting">
              {{ isConnecting ? 'Connecting...' : 'Login with Chrono' }}
            </button>
            <button @click="showChainSelector = true" class="btn btn-secondary">
              Read Only
            </button>
            <button @click="goToChronoSetup" class="btn btn-outline">
              How to Setup Chrono
            </button>
          </div>
          
          <div v-else class="chain-selector">
            <h3>Select Chain</h3>
            <p v-if="currentReadOnlyChain" class="current-chain-hint">
              Current: {{ currentReadOnlyChain.charAt(0).toUpperCase() + currentReadOnlyChain.slice(1) }}
            </p>
            <div class="chain-options">
              <button 
                @click="selectReadOnlyChain('heimdall')" 
                class="btn btn-primary"
                :class="{ 'btn-active': currentReadOnlyChain === 'heimdall' }"
              >
                Heimdall
              </button>
              <button 
                @click="selectReadOnlyChain('odin')" 
                class="btn btn-primary"
                :class="{ 'btn-active': currentReadOnlyChain === 'odin' }"
              >
                Odin
              </button>
              <button
                class="btn btn-primary"
                disabled
                title="Thor network is currently unavailable"
                style="opacity: 0.4; cursor: not-allowed;"
              >
                Thor <span style="font-size: 0.7em; margin-left: 4px;">(Unavailable)</span>
              </button>
            </div>
            <button @click="showChainSelector = false" class="btn btn-outline" style="margin-top: 1rem;">
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Avatar Selection Modal -->
    <div v-if="avatarSelectionVisible" class="modal-overlay" @click.self="closeAvatarSelection">
      <div class="modal-content login-modal">
        <div class="modal-header">
          <h2>Select Avatar</h2>
        </div>
        <div class="modal-body">
          <p>Multiple avatars found. Please select which avatar should make this purchase:</p>
          
          <div class="avatar-list" style="margin: 1.5rem 0;">
            <div
              v-for="avatar in availableAvatars"
              :key="avatar.address"
              class="avatar-option"
              :class="{ 'selected': selectedAvatarAddress === avatar.address }"
              @click="selectedAvatarAddress = avatar.address"
              style="
                padding: 1rem;
                margin: 0.5rem 0;
                border: 2px solid #2d3748;
                border-radius: 8px;
                cursor: pointer;
                background: #1a202c;
                transition: all 0.2s;
              "
            >
              <div style="font-weight: 600; color: #e2e8f0; margin-bottom: 0.25rem;">
                {{ avatar.name }}
              </div>
              <div style="font-size: 0.85rem; color: #a0aec0; font-family: monospace;">
                {{ avatar.address }}
              </div>
            </div>
          </div>
          
          <div class="modal-actions" style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button @click="closeAvatarSelection" class="btn btn-outline" style="flex: 1;">
              Cancel
            </button>
            <button @click="selectAvatarAndProceed" class="btn btn-primary" style="flex: 1;" :disabled="!selectedAvatarAddress">
              Proceed with Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- NCG Transfer Modal -->
    <div v-if="transferModalVisible" class="modal-overlay" @click.self="closeTransferModal">
      <div class="modal-content login-modal">
        <div class="modal-header">
          <h2>Transfer NCG</h2>
        </div>
        <div class="modal-body">
          <p>
            Transfer NCG from the current network
            <strong>{{ walletData.currentNetworkName || 'Unknown' }}</strong>
            to another network.
          </p>
          
          <div style="text-align:left; margin: 1rem 0;">
            <label style="display:block; margin-bottom:0.5rem; color:#cbd5e0;">Select target network:</label>
            <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
              <label v-for="opt in transferTargetOptions" :key="opt" style="display:flex; align-items:center; gap:0.5rem;">
                <input type="radio" :value="opt" v-model="transferTarget" />
                <span style="color:#e2e8f0;">{{ opt.charAt(0).toUpperCase() + opt.slice(1) }}</span>
              </label>
            </div>
          </div>
          
          <div style="text-align:left; margin: 1rem 0;">
            <label for="transfer-amount" style="display:block; margin-bottom:0.5rem; color:#cbd5e0;">Amount (NCG):</label>
            <input
              id="transfer-amount"
              type="number"
              min="0"
              step="0.01"
              v-model="transferAmount"
              placeholder="e.g. 1.00"
              class="search-input"
              style="max-width: 240px;"
            />
            <div style="margin-top:0.5rem; color:#94a3b8; font-size:0.85rem;">
              Bridge Transfers may take a minute ot two to process.
            </div>
          </div>
          
          <div class="modal-actions" style="display:flex; gap: 1rem; margin-top:1.5rem;">
            <button @click="closeTransferModal" class="btn btn-outline" style="flex:1;">
              Cancel
            </button>
            <button @click="submitTransfer" class="btn btn-primary" style="flex:1;" :disabled="!canSubmitTransfer">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <main class="market-content">
      <div class="container">
        <!-- Category Selector -->
        <div class="category-selector">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectCategory(category.id)"
            :class="['category-btn', { 'active': selectedCategory === category.id }]"
          >
            {{ category.name }}
          </button>
        </div>

        <!-- Elemental Filter -->
        <div class="elemental-selector">
          <label>Elemental Type:</label>
          <div class="elemental-buttons">
            <button
              v-for="elemental in elementalTypes"
              :key="elemental.id === null ? 'all' : elemental.id"
              @click="selectElementalType(elemental.id)"
              :class="['elemental-btn', { 'active': selectedElementalType === elemental.id }]"
            >
              {{ elemental.name }}
            </button>
          </div>
        </div>

        <!-- Spell Filter -->
        <div class="spell-selector">
          <label for="spell-select">Spell:</label>
          <select
            id="spell-select"
            v-model="selectedSpellId"
            @change="selectSpell"
            class="order-select spell-select"
            :disabled="spellsLoading"
          >
            <option :value="null">All Spells</option>
            <option
              v-for="spell in availableSpellsForCategory"
              :key="spell.id"
              :value="spell.id"
            >
              {{ spell.name }}
            </option>
          </select>
          <span v-if="spellsLoading" class="spell-loading-hint">Loading spells...</span>
        </div>

        <!-- Ordering Selector -->
        <div class="ordering-selector">
          <label for="order-select">Sort by:</label>
          <select
            id="order-select"
            v-model="selectedOrder"
            @change="onOrderChange"
            class="order-select"
          >
            <option
              v-for="option in orderOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <!-- Free text search -->
          <div class="search-box">
            <input
              type="text"
              v-model="searchQuery"
              @input="onSearchChange"
              placeholder="Search item name..."
              class="search-input"
            />
          </div>
        </div>

        <!-- Top Pagination -->
        <div v-if="!loading && !error && items && items.length > 0" class="pagination top">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="btn btn-outline"
          >
            Previous
          </button>

          <div class="page-info">
            Page <strong>{{ currentPage }}</strong>
          </div>

          <button
            @click="nextPage"
            :disabled="items.length < itemsPerPage"
            class="btn btn-outline"
          >
            Next
          </button>
        </div>

        <div v-if="loading || itemDataLoading" class="loading">
          <div class="spinner"></div>
          <p>{{ itemDataLoading ? 'Loading item data...' : `Loading ${currentCategoryName.toLowerCase()}...` }}</p>
        </div>

        <div v-else-if="error" class="error">
          <div class="error-icon">⚠️</div>
          <h3>Error Loading {{ currentCategoryName }}</h3>
          <p>{{ error }}</p>
          <button @click="loadItems" class="btn btn-primary">
            Try Again
          </button>
        </div>

        <div v-else class="items-grid">
          <!-- @ts-ignore: Vue template loop variable -->
          <div
            v-for="(item, index) in items"
            :key="item?.productId || index"
            :class="['item-card', item?.grade ? `card-grade-${item.grade}` : '']"
          >
            <div class="item-image" :class="item?.grade ? `img-grade-${item.grade}` : ''">
              <img
                v-if="item && item.iconId"
                :src="`https://raw.githubusercontent.com/planetarium/NineChronicles/development/nekoyume/Assets/Resources/UI/Icons/Item/${item.iconId}.png`"
                :alt="itemNames.get(item.itemId) || (item.itemId ? `Item ${item.itemId}` : 'Item')"
                class="item-icon"
                @error="handleImageError"
              />
              <div v-if="item && item.grade" class="item-grade" :class="`grade-${item.grade}`">
                Grade {{ item.grade }}
              </div>
              <div v-if="item && item.level" class="item-level">Lv.{{ item.level }}</div>
            </div>
            
            <div class="item-info">
              <div class="item-header">
                <h3 class="item-name">
                  <span v-if="item && item.itemId && itemNames.has(item.itemId)">
                    {{ itemNames.get(item.itemId) }}
                  </span>
                  <span v-else class="loading-name">
                    Loading...
                  </span>
                </h3>
                    <div class="product-id" v-if="item && item.productId">
                      Product ID: {{ item.productId }}
                    </div>
                    <div class="seller-line" v-if="item && item.sellerAvatarAddress">
                      <span class="seller-label">Seller:</span>
                      <span class="seller-name" :title="item.sellerAvatarAddress">
                        {{ avatarNames[item.sellerAvatarAddress] || shortAddress(item.sellerAvatarAddress) }}
                      </span>
                    </div>

                <!-- Star Rating -->
                <div class="item-rating" v-if="getItemRating(item).totalStars > 0">
                  <template v-for="n in getItemRating(item).totalStars" :key="`star-${n}`">
                    <span
                      class="star"
                      :class="{
                        'star-yellow': n <= getItemRating(item).yellowStars,
                        'star-purple': n > getItemRating(item).yellowStars && n <= getItemRating(item).yellowStars + getItemRating(item).purpleStars
                      }"
                    >
                      ★
                    </span>
                  </template>
                </div>
              </div>
              
              <div class="item-stats">
                <div v-if="item && item.combatPoint !== undefined" class="stat">
                  <span class="stat-label">Combat Power:</span>
                  <span class="stat-value">{{ formatNumber(item.combatPoint) }}</span>
                </div>
                <div v-if="item && item.elementalType !== undefined" class="stat">
                  <span class="stat-label">Elemental Type:</span>
                  <span class="stat-value">{{ getElementalTypeName(item.elementalType) }}</span>
                </div>
                
                <!-- Item Stats -->
                <div v-if="item.statModels && item.statModels.length > 0" class="item-stat-models">
                  <div class="stat-model" v-for="(statModel, index) in getValidStatModels(item.statModels)" :key="`stat-${index}`">
                    <span class="stat-model-label">
                      {{ getStatTypeName(statModel.type) }}
                      <span v-if="statModel.additional" class="additional-indicator">+</span>
                    </span>
                    <span class="stat-model-value">
                      {{ formatNumber(statModel.value) }}
                      <span
                        class="stat-quality"
                        :class="{ unavailable: statQualities[qualityKey(item, index)] === undefined }"
                        :title="statQualities[qualityKey(item, index)] === undefined ? 'Quality N/A (no matching sub-recipe or range)' : 'Min/Max Quality'"
                      >
                        (
                        {{ statQualities[qualityKey(item, index)] !== undefined
                          ? statQualities[qualityKey(item, index)] + '%'
                          : 'N/A' }}
                        )
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="item-skills">
                <div v-if="item && item.skillModels && item.skillModels.length > 0">
                  <div class="skill" v-for="skill in getValidSkillModels(item.skillModels)" :key="skill.skillId">
                    <span
                      class="skill-name"
                      :title="skillDescriptions.get(skill.skillId) || 'Loading skill description...'"
                    >
                      <span v-if="skillNames.has(skill.skillId)">
                        {{ skillNames.get(skill.skillId) }}
                      </span>
                      <span v-else class="loading-name">
                        Loading...
                      </span>
                    </span>
                    <span class="skill-power" v-if="skill.power !== undefined || skill.statPowerRatio !== undefined">
                      {{ skill.power > 0 ? skill.power : (skill.statPowerRatio || 0) }}
                    </span>
                  </div>
                </div>
                <div v-else class="no-skills">
                  <span class="no-skills-text">No Skills</span>
                </div>
              </div>
            </div>
            
            <div class="item-price" v-if="item && item.price !== undefined">
              <div class="price-main">
                <span class="price-value">{{ item.price }}</span>
                <span class="price-currency">NCG</span>
              </div>
              <div class="price-details" v-if="item.crystal !== undefined || item.crystalPerPrice !== undefined">
                <div class="crystal-price" v-if="item.crystal !== undefined">
                  {{ formatNumber(item.crystal) }} Crystal
                </div>
                <div class="crystal-per-price" v-if="item.crystalPerPrice !== undefined">
                  {{ formatNumber(item.crystalPerPrice) }} Crystal/NCG
                </div>
              </div>
              <button v-if="!isReadOnlyMode" class="btn btn-buy" @click="onBuy(item)">
                Buy Now
              </button>
              <button class="btn btn-outline" style="margin-top: 0.5rem;" @click="onHistory(item)">
                History
              </button>
            </div>
          </div>
        </div>

        <div v-if="!loading && !error && items && items.length > 0" class="pagination bottom">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="btn btn-outline"
          >
            Previous
          </button>

          <div class="page-info">
            Page <strong>{{ currentPage }}</strong>
          </div>

          <button
            @click="nextPage"
            :disabled="items.length < itemsPerPage"
            class="btn btn-outline"
          >
            Next
          </button>
        </div>

        <!-- History Modal -->
        <div v-if="historyVisible" class="modal-backdrop" @click.self="closeHistory">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">
                <div class="title-top">
                  <h3>Trade History</h3>
                  <span v-if="historySelectedItem" class="badge">Lv. {{ historySelectedItem.level }}</span>
                  <span v-if="historySelectedItem" class="badge grade">Grade {{ historySelectedItem.grade }}</span>
                </div>
                <div v-if="historySelectedItem" class="subtitle">
                  <span class="name">{{ itemNames.get(historySelectedItem.itemId) || `Item ${historySelectedItem.itemId}` }}</span>
                  <span class="divider">•</span>
                  <span class="mono small">Product: {{ historySelectedItem.productId }}</span>
                </div>
              </div>
              <button class="modal-close" @click="closeHistory">×</button>
            </div>
            <div class="modal-body">
              <div v-if="historyLoading" class="loading">
                <div class="spinner"></div>
                <p>Loading history...</p>
              </div>
              <div v-else-if="historyError" class="error">
                <div class="error-icon">⚠️</div>
                <p>{{ historyError }}</p>
              </div>
              <div v-else>
                <div v-if="historyRows.length === 0" class="no-skills-text" style="text-align:center; padding: 1rem 0;">No history found</div>
                <div v-else class="history-table-wrapper">
                  <table class="history-table">
                    <thead>
                      <tr>
                        <th>List Block</th>
                        <th>Buy Block</th>
                        <th>List Avatar</th>
                        <th>Buy Avatar</th>
                        <th>Price</th>
                        <th>Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(h, i) in historyRows" :key="i">
                        <td>{{ h.listblock }}</td>
                        <td>{{ h.buyblock }}</td>
                        <td>
                          <div class="avatar-cell">
                            <div class="avatar-name" :title="h.listavatar">{{ avatarNames[h.listavatar] || '...' }}</div>
                            <div class="avatar-addr mono small">{{ h.listavatar }}</div>
                          </div>
                        </td>
                        <td>
                          <div class="avatar-cell">
                            <div class="avatar-name" :title="h.buyavatar">{{ avatarNames[h.buyavatar] || '...' }}</div>
                            <div class="avatar-addr mono small">{{ h.buyavatar }}</div>
                          </div>
                        </td>
                        <td>{{ formatNumber(h.price) }}</td>
                        <td>{{ h.level }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" @click="closeHistory">Close</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { preloadItemData, getItemName, getSkillName, getSkillDescription, getElementalTypeName, getStatTypeName, findIconIdsByName, getStatQualityPercentForItemStat, inferAdditionalStatType } from '../services/itemDataService'
import { getChronoSdk } from '@planetarium/chrono-sdk'
import { useRouter } from 'vue-router'

// ── Security helpers ──────────────────────────────────────────────────────────

/** Returns true only for a valid 40-char hex address (with or without 0x prefix). */
function isValidAddress(address: unknown): boolean {
  if (typeof address !== 'string' || !address) return false
  const raw = address.startsWith('0x') || address.startsWith('0X') ? address.slice(2) : address
  return /^[0-9a-fA-F]{40}$/.test(raw)
}

/**
 * Ensures an address has the 0x prefix.
 * Throws if the address is not a valid 40-char hex string.
 */
function ensureHexPrefix(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address format: "${address}"`)
  }
  return address.startsWith('0x') || address.startsWith('0X') ? address : ('0x' + address)
}

/** Strips a hex-encoded payload from its 0x prefix and validates it is pure hex. */
function normalizeHex(raw: string): string {
  const trimmed = raw.trim()
  const stripped = (trimmed.startsWith('0x') || trimmed.startsWith('0X')) ? trimmed.slice(2) : trimmed
  if (!/^[0-9a-fA-F]+$/.test(stripped)) {
    throw new Error('Value is not a valid hex string')
  }
  return stripped
}

/**
 * Extracts and validates a transaction signature returned by Chrono's
 * signWithPlainValue().  Throws if the signature is empty or obviously malformed.
 */
function extractSignatureHex(signed: unknown): string {
  const toHex = (u8: Uint8Array) =>
    Array.from(u8).map(b => b.toString(16).padStart(2, '0')).join('')

  let hex = ''
  if (typeof signed === 'string') {
    hex = signed
  } else if (signed instanceof Uint8Array) {
    hex = toHex(signed)
  } else if (signed && typeof signed === 'object') {
    const s = signed as Record<string, unknown>
    if (typeof s.signature === 'string') hex = s.signature
    else if (typeof s.hex === 'string')  hex = s.hex
    else if (typeof s.payload === 'string') hex = s.payload
    else if (s.data instanceof Uint8Array) hex = toHex(s.data)
  }

  hex = hex.trim()
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2)

  if (!hex) {
    throw new Error('Wallet returned an empty signature')
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('Wallet returned a non-hex signature')
  }
  // A valid Libplanet signed tx is at least a few hundred bytes; guard against trivially small values.
  if (hex.length < 64) {
    throw new Error(`Signature is too short (${hex.length} hex chars) — possible wallet error`)
  }
  return hex
}

/**
 * Validates the wallet data object read from sessionStorage.
 * Returns the validated data or null if the data is malformed.
 */
function parseStoredWalletData(raw: string): { walletAddress: string; walletBalance: string; currentNetworkName: string } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const d = parsed as Record<string, unknown>

  // walletAddress must be a valid 40-char address if present
  const walletAddress = typeof d.walletAddress === 'string' ? d.walletAddress : ''
  if (walletAddress && !isValidAddress(walletAddress)) return null

  const walletBalance = typeof d.walletBalance === 'string' ? d.walletBalance.slice(0, 64) : ''
  const ALLOWED_NETWORKS = new Set(['Odin', 'Heimdall', 'Thor', 'Unknown', ''])
  const currentNetworkName = typeof d.currentNetworkName === 'string' ? d.currentNetworkName : ''
  // Accept any casing variant of the known networks
  const normalised = currentNetworkName.charAt(0).toUpperCase() + currentNetworkName.slice(1).toLowerCase()
  const safeNetwork = ALLOWED_NETWORKS.has(normalised) ? (d.currentNetworkName as string) : ''

  return { walletAddress, walletBalance, currentNetworkName: safeNetwork }
}

// ─────────────────────────────────────────────────────────────────────────────

interface ItemProduct {
  productId: string
  sellerAgentAddress: string
  sellerAvatarAddress: string
  price: number
  quantity: number
  registeredBlockIndex: number
  exist: boolean
  legacy: boolean
  itemId: number
  iconId: number
  grade: number
  itemType: number
  itemSubType: number
  elementalType: number
  tradableId: string
  setId: number
  combatPoint: number
  level: number
  skillModels: Array<{
    skillId: number
    elementalType: number
    skillCategory: number
    hitCount: number
    cooldown: number
    power: number
    statPowerRatio: number
    chance: number
    referencedStatType: number
  }> | null
  statModels: Array<{
    value: number
    type: number
    additional: boolean
  }> | null
  optionCountFromCombination: number
  unitPrice: number
  crystal: number
  crystalPerPrice: number
  byCustomCraft: boolean
  hasRandomOnlyIcon: boolean
}

interface MarketResponse {
  totalCount: number
  limit: number
  offset: number
  itemProducts: ItemProduct[]
  fungibleAssetValueProducts: any[]
}

interface HistoryRecord {
  listblock: number
  buyblock: number
  listavatar: string
  buyavatar: string
  price: number
  level: number
}

// Login modal and mode state
const showLoginModal = ref(false)
const showChainSelector = ref(false)
const isReadOnlyMode = ref(false)
const walletAvailable = ref(false)
const isConnecting = ref(false)
const readOnlyChain = ref<'heimdall' | 'odin' | 'thor' | null>(null)

const items = ref<ItemProduct[]>([])
const loading = ref(false)
const itemDataLoading = ref(false)
const error = ref('')
const currentPage = ref(1)
const itemsPerPage = 28
const router = useRouter()

// Categories data
const categories = [
  { id: 6, name: 'Weapons' },
  { id: 7, name: 'Armor' },
  { id: 8, name: 'Belts' },
  { id: 9, name: 'Necklaces' },
  { id: 10, name: 'Rings' }
]

const selectedCategory = ref(6) // Start with Weapons

// Elemental type filter
const selectedElementalType = ref<number | null>(null) // null = all elements

// Spell filter - spells shown are derived from equipment in current category
const selectedSpellId = ref<number | null>(null) // null = all spells
const availableSpellsForCategory = ref<Array<{ id: number; name: string }>>([])
const spellsLoading = ref(false)

// Spell API base URL - in development, use localhost. Switch to https://api.9capi.com when deployed.
const SPELL_API_BASE = 'https://api.9capi.com'

// Elemental types (matching itemDataService.ts)
const elementalTypes = [
  { id: null, name: 'All Elements' },
  { id: 0, name: 'None' },
  { id: 1, name: 'Fire' },
  { id: 2, name: 'Water' },
  { id: 3, name: 'Earth' },
  { id: 4, name: 'Wind' }
]

// Ordering options
const orderOptions = [
  { value: 'cp_desc', label: 'Combat Power (High to Low)' },
  { value: 'cp', label: 'Combat Power (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
  { value: 'price', label: 'Price (Low to High)' },
  { value: 'grade_desc', label: 'Grade (High to Low)' },
  { value: 'grade', label: 'Grade (Low to High)' },
  { value: 'crystal_per_price_desc', label: 'Crystal/NCG (High to Low)' },
  { value: 'crystal_per_price', label: 'Crystal/NCG (Low to High)' },
  { value: 'crystal_desc', label: 'Crystal (High to Low)' },
  { value: 'crystal', label: 'Crystal (Low to High)' },
  { value: 'level_desc', label: 'Level (High to Low)' },
  { value: 'level', label: 'Level (Low to High)' },
  { value: 'opt_count_desc', label: 'Option Count (High to Low)' },
  { value: 'opt_count', label: 'Option Count (Low to High)' },
  { value: 'unit_price_desc', label: 'Unit Price (High to Low)' },
  { value: 'unit_price', label: 'Unit Price (Low to High)' }
]

const selectedOrder = ref('cp_desc') // Default to combat power descending

// Search query
const searchQuery = ref('')
let searchDebounce: ReturnType<typeof setTimeout> | null = null

// Store resolved item names for display
const itemNames = ref<Map<number, string>>(new Map())
const skillNames = ref<Map<number, string>>(new Map())
const skillDescriptions = ref<Map<number, string>>(new Map())
const statQualities = ref<Record<string, number>>({})

// Get current category name
const currentCategoryName = computed(() => {
  const category = categories.find(c => c.id === selectedCategory.value)
  return category ? category.name : 'Items'
})

// Get wallet data from session storage
const walletData = ref({
  walletAddress: '',
  walletBalance: '',
  currentNetworkName: ''
})

const currentNetworkKey = computed<'odin' | 'heimdall' | 'thor'>(() => {
  if (isReadOnlyMode.value) {
    // In read-only mode, use the reactive readOnlyChain ref
    return readOnlyChain.value || 'heimdall'
  }
  const n = (walletData.value.currentNetworkName || '').toLowerCase()
  if (n.includes('heimdall')) return 'heimdall'
  if (n.includes('thor')) return 'thor'
  return 'odin'
})

const currentReadOnlyChain = computed<'heimdall' | 'odin' | 'thor' | null>(() => {
  if (isReadOnlyMode.value) {
    return readOnlyChain.value
  }
  return null
})

// Helper to reliably open a URL in a new tab even if popup blockers are aggressive
function openInNewTab(url: string) {
  try {
    const win = window.open(url, '_blank', 'noopener')
    if (win) return
  } catch { /* fall through to anchor method */ }
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Transfer modal state
const transferModalVisible = ref(false)
const transferTarget = ref<'odin' | 'heimdall' | 'thor' | ''>('')
const transferAmount = ref<string>('')
const transferTargetOptions = computed<Array<'odin' | 'heimdall' | 'thor'>>(() => {
  const cur = currentNetworkKey.value
  const allowed: Record<'odin' | 'heimdall' | 'thor', Array<'odin' | 'heimdall' | 'thor'>> = {
    odin: ['heimdall', 'thor'],
    heimdall: ['odin'],
    thor: ['odin'],
  }
  return allowed[cur]
})
const canSubmitTransfer = computed(() => {
  if (!walletData.value.walletAddress) return false
  if (!transferTarget.value) return false
  const amt = Number(transferAmount.value)
  return Number.isFinite(amt) && amt > 0
})

function openTransferModal() {
  if (!walletData.value.walletAddress) {
    alert('Connect your wallet first.')
    return
  }
  transferModalVisible.value = true
  // default to first available target
  const opts = transferTargetOptions.value
  transferTarget.value = (opts[0] || '') as any
  transferAmount.value = ''
}

function closeTransferModal() {
  transferModalVisible.value = false
  transferTarget.value = '' as any
  transferAmount.value = ''
}

// No longer using 9CAPI for bridge; we query GraphQL directly for transferAsset

async function submitTransfer() {
  try {
    const source = currentNetworkKey.value
    const target = transferTarget.value as 'odin' | 'heimdall' | 'thor'
    const amountNCG = Number(transferAmount.value)
    if (!walletInstance.value) {
      walletInstance.value = getChronoSdk()
    }
    if (!walletInstance.value) {
      alert('Chrono wallet not detected.')
      return
    }
    if (!walletData.value.walletAddress) {
      alert('Wallet not connected.')
      return
    }
    if (!target || target === source) {
      alert('Please select a different target network.')
      return
    }
    if (!Number.isFinite(amountNCG) || amountNCG <= 0) {
      alert('Enter a valid amount.')
      return
    }

    // Determine bridge recipient by route
    const recipientsByRoute: Record<string, string> = {
      // Odin -> X
      'odin:heimdall': '1c2ae97380cfb4f732049e454f6d9a25d4967c6f',
      'odin:thor': '3e498a6a5cdbe027769f9502026c37cb8613186e',
      // X -> Odin (use same bridge recipients by chain)
      'heimdall:odin': '1c2ae97380cfb4f732049e454f6d9a25d4967c6f',
      'thor:odin': '3e498a6a5cdbe027769f9502026c37cb8613186e',
    }
    const recipient = recipientsByRoute[`${source}:${target}`]
    if (!recipient) return alert('Unsupported bridge route.')

    // Build actionQuery.transferAsset on the current network's GraphQL
    // (ensureHexPrefix is the module-level validated version)
    // Amount must be string; format to at most 2 decimals
    const amountStr = amountNCG.toFixed(2).replace(/\.?0+$/,'') // trim trailing zeros but keep integer when possible
    const gql = `
      query($sender: Address!, $recipient: Address!, $memo: String!, $amount: String!) {
        actionQuery {
          transferAsset(sender: $sender, recipient: $recipient, memo: $memo, amount: $amount, currency: NCG)
        }
      }
    `
    // Sender/memo are the connected agent address; recipient is the bridge account for the route.
    const variables = {
      sender: ensureHexPrefix(walletData.value.walletAddress),
      // Pass recipient as provided (no 0x) per example; if schema requires, add 0x; otherwise leave as-is.
      recipient: recipient,
      memo: ensureHexPrefix(walletData.value.walletAddress),
      amount: amountStr,
    }
    const { json: transferResp, endpointUsed } = await postGraphqlWithFailover(source, {
      query: gql,
      variables
    })
    if (import.meta.env.DEV) console.log('[Bridge] transferAsset endpoint:', endpointUsed)
    if (transferResp?.errors && transferResp.errors.length) {
      throw new Error(transferResp.errors[0]?.message || 'GraphQL error during transferAsset')
    }
    const rawPlainvalue = transferResp?.data?.actionQuery?.transferAsset
    if (typeof rawPlainvalue !== 'string' || rawPlainvalue.length === 0) {
      throw new Error('Invalid transferAsset response')
    }
    // Strip surrounding quotes if the server double-encoded the value
    const unquoted = rawPlainvalue.trim().replace(/^"|"$/g, '')
    if (unquoted.length > 200_000) {
      throw new Error('transferAsset response is unexpectedly large')
    }
    const plainvalueHex = normalizeHex(unquoted)

    if (import.meta.env.DEV) console.log('[Bridge] Signing plainvalue...')
    const signed = await walletInstance.value.signWithPlainValue(
      walletData.value.walletAddress,
      plainvalueHex
    )
    const payloadHex = extractSignatureHex(signed)

    const txId = await broadcastTransaction(payloadHex, source)
    const explorer = source === 'odin'
      ? `https://9cscan.com/tx/${txId}`
      : (source === 'heimdall'
        ? `https://heimdall.9cscan.com/tx/${txId}`
        : `https://thor.9cscan.com/tx/${txId}`)
    openInNewTab(explorer)
    alert(`Transfer submitted!\nTx: ${txId}\nOpen: ${explorer}`)
    closeTransferModal()
  } catch (err: any) {
    console.error('[Bridge] Transfer failed:', err)
    alert(`Transfer failed: ${err?.message || err}`)
  }
}
// RPC endpoints per network (ordered by priority; Odin includes fallbacks)
const RPC_ENDPOINTS: Record<'odin' | 'heimdall' | 'thor', string[]> = {
  odin: [
    'https://odin-rpc-1.nine-chronicles.com/graphql',
    'https://odin-rpc-2.nine-chronicles.com/graphql',
    'https://odin-rpc-3.nine-chronicles.com/graphql',
  ],
  heimdall: [
    'https://heimdall-rpc-1.nine-chronicles.com/graphql',
    'https://heimdall-rpc-2.nine-chronicles.com/graphql',
    'https://heimdall-rpc-3.nine-chronicles.com/graphql',
  ],
  thor: [
    'https://thor-rpc-1.nine-chronicles.com/graphql',
  ],
}

const RETRY_STATUS_CODES = new Set<number>([
  408, // Request Timeout
  429, // Too Many Requests (often transient)
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  520, 521, 522, 523, 524, 525, 526, // Cloudflare-style errors
])

function getRpcEndpoints(networkKey: 'odin' | 'heimdall' | 'thor'): string[] {
  return RPC_ENDPOINTS[networkKey] || []
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Posts a GraphQL request to the network's RPC with endpoint failover and timeout.
 * Returns { json, endpointUsed }.
 */
async function postGraphqlWithFailover(
  networkKey: 'odin' | 'heimdall' | 'thor',
  body: any,
  timeoutMs = 10000
): Promise<{ json: any, endpointUsed: string }> {
  const endpoints = getRpcEndpoints(networkKey)
  let lastError: any = null
  for (const endpoint of endpoints) {
    try {
      const resp = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, timeoutMs)
      if (!resp.ok) {
        // Retry only on transient/server-side statuses
        if (RETRY_STATUS_CODES.has(resp.status)) {
          const errText = await resp.text().catch(() => '')
          console.warn(`[RPC] Non-OK (${resp.status}) from ${endpoint}, will try next. Body:`, errText)
          lastError = new Error(`HTTP ${resp.status} ${resp.statusText}`)
          continue
        }
        // For non-retryable statuses, throw immediately
        const errText = await resp.text().catch(() => '')
        throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${errText}`)
      }
      const json = await resp.json()
      return { json, endpointUsed: endpoint }
    } catch (e: any) {
      // Network/timeout/abort: try next endpoint
      console.warn(`[RPC] Request error for ${endpoint}:`, e?.message || e)
      lastError = e
      continue
    }
  }
  throw (lastError || new Error('All RPC endpoints failed'))
}

onMounted(async () => {
  // Check if wallet is available
  await checkWalletAvailability()
  
  // Check if user is already connected or in read-only mode
  const stored = sessionStorage.getItem('walletData')
  const storedReadOnlyChain = sessionStorage.getItem('readOnlyChain')
  
  if (stored) {
    // User has wallet data, load it
    loadWalletData()
    isReadOnlyMode.value = false
    readOnlyChain.value = null // Clear read-only chain when connected
    // Initialize wallet instance locally for signing
    try {
      walletInstance.value = getChronoSdk()
    } catch (e) {
      console.error('Chrono SDK init failed in Market view:', e)
    }
    // Fallback: refresh network name from Chrono if missing/Unknown
    try {
      await refreshNetworkFromChrono()
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[onMounted] refreshNetworkFromChrono failed:', e)
    }
  } else if (storedReadOnlyChain) {
    // User is in read-only mode
    isReadOnlyMode.value = true
    const chain = (storedReadOnlyChain === 'heimdall' || storedReadOnlyChain === 'odin' || storedReadOnlyChain === 'thor') ? storedReadOnlyChain : 'heimdall'
    readOnlyChain.value = chain
    walletData.value.currentNetworkName = chain.charAt(0).toUpperCase() + chain.slice(1)
  } else {
    // No connection, show login modal
    showLoginModal.value = true
  }
  
  // Preload item data in the background
  itemDataLoading.value = true
  try {
    await preloadItemData()
  } catch (error) {
    console.error('Failed to preload item data:', error)
  } finally {
    itemDataLoading.value = false
  }
  
  // Only load items if we have a connection or read-only mode
  if (stored || storedReadOnlyChain) {
    loadSkillsForCategory()
    loadItems()
  }
})

function loadWalletData() {
  const stored = sessionStorage.getItem('walletData')
  if (!stored) return
  const data = parseStoredWalletData(stored)
  if (!data) {
    console.warn('[loadWalletData] sessionStorage contained invalid wallet data — clearing')
    sessionStorage.removeItem('walletData')
    return
  }
  walletData.value = data
}

async function checkWalletAvailability() {
  try {
    const wallet = getChronoSdk()
    if (wallet) {
      walletAvailable.value = true
    } else {
      walletAvailable.value = false
    }
  } catch (error: any) {
    console.error('Error checking wallet availability:', error)
    walletAvailable.value = false
  }
}

async function connectWithChrono() {
  if (!walletAvailable.value) {
    alert('Chrono wallet not detected. Please install the Chrono extension.')
    return
  }
  
  try {
    isConnecting.value = true
    const wallet = getChronoSdk()
    if (!wallet) {
      throw new Error('Chrono wallet not available')
    }
    
    const accounts = await wallet.connect()
    if (import.meta.env.DEV) console.log('Connect result:', accounts)
    
    if (accounts && accounts.length > 0) {
      const walletAddress = accounts[0]
      
      // Get network and balance
      const currentNetwork = await wallet.getCurrentNetwork()
      let chainName: string
      
      if (currentNetwork.id === '0x000000000001') {
        chainName = 'Heimdall'
      } else if (currentNetwork.id === '0x000000000000') {
        chainName = 'Odin'
      } else if (currentNetwork.id === '0x000000000002') {
        chainName = 'Thor'
      } else {
        chainName = 'Unknown'
      }
      
      // Get balance
      let walletBalance = '-'
      try {
        const networkKeyForBalance: 'odin' | 'heimdall' | 'thor' =
          currentNetwork.id === '0x000000000001' ? 'heimdall'
          : (currentNetwork.id === '0x000000000002' ? 'thor' : 'odin')
        
        const query = `
          query($addr: Address!) {
            stateQuery {
              agent(address: $addr) {
                gold
              }
            }
          }
        `
        
        const { json: data, endpointUsed } = await postGraphqlWithFailover(networkKeyForBalance, {
          query,
          variables: { addr: walletAddress }
        })
        if (import.meta.env.DEV) console.log('[Balance] Queried via:', endpointUsed)
        if (data.data?.stateQuery?.agent?.gold !== undefined) {
          walletBalance = `${data.data.stateQuery.agent.gold} NCG`
        }
      } catch (e) {
        console.error('Error fetching balance:', e)
      }
      
      // Store wallet data
      walletData.value = {
        walletAddress,
        walletBalance,
        currentNetworkName: chainName
      }
      
      sessionStorage.setItem('walletData', JSON.stringify(walletData.value))
      sessionStorage.removeItem('readOnlyChain') // Clear read-only mode
      
      isReadOnlyMode.value = false
      walletInstance.value = wallet
      showLoginModal.value = false
      showChainSelector.value = false
      
      // Load items for the connected network
      loadItems()
    } else {
      throw new Error('No accounts returned from wallet')
    }
  } catch (error: any) {
    console.error('Connection failed:', error)
    alert(`Connection failed: ${error.message}`)
  } finally {
    isConnecting.value = false
  }
}

function selectReadOnlyChain(chain: 'heimdall' | 'odin' | 'thor') {
  const previousChain = readOnlyChain.value
  const isNetworkSwitch = previousChain && previousChain !== chain
  
  isReadOnlyMode.value = true
  readOnlyChain.value = chain // Update reactive ref first
  sessionStorage.setItem('readOnlyChain', chain)
  sessionStorage.removeItem('walletData') // Clear wallet data
  walletData.value = {
    walletAddress: '',
    walletBalance: '',
    currentNetworkName: chain.charAt(0).toUpperCase() + chain.slice(1)
  }
  showLoginModal.value = false
  showChainSelector.value = false
  
  // If switching networks, reset page and clear search
  if (isNetworkSwitch) {
    currentPage.value = 1
    // Clear search query and debounce
    if (searchDebounce) {
      clearTimeout(searchDebounce)
      searchDebounce = null
    }
    searchQuery.value = ''
    // Clear old data before loading new network
    clearItemData()
  }
  
  // Load spells for current category (network-specific) and items
  loadSkillsForCategory()
  loadItems()
}

function closeLoginModal() {
  // Don't allow closing if not connected and not in read-only mode
  const stored = sessionStorage.getItem('walletData')
  const storedReadOnlyChain = sessionStorage.getItem('readOnlyChain')
  if (!stored && !storedReadOnlyChain) {
    return
  }
  showLoginModal.value = false
}

function handleConnectFromHeader() {
  // Show the login modal to allow connecting
  showLoginModal.value = true
  showChainSelector.value = false
}

function goToChronoSetup() {
  showLoginModal.value = false
  router.push('/chrono-setup')
}

async function refreshNetworkFromChrono() {
  if (!walletInstance.value) return
  try {
    const net = await walletInstance.value.getCurrentNetwork()
    if (net && net.id) {
      const name = net.id === '0x000000000001' ? 'Heimdall' : (net.id === '0x000000000000' ? 'Odin' : (net.id === '0x000000000002' ? 'Thor' : walletData.value.currentNetworkName))
      if (!walletData.value.currentNetworkName || walletData.value.currentNetworkName.toLowerCase() === 'unknown') {
        walletData.value.currentNetworkName = name
        // update session storage so header reflects it on reload
        const stored = sessionStorage.getItem('walletData')
        const base = stored ? JSON.parse(stored) : {}
        sessionStorage.setItem('walletData', JSON.stringify({
          walletAddress: walletData.value.walletAddress || base.walletAddress || '',
          walletBalance: walletData.value.walletBalance || base.walletBalance || '',
          currentNetworkName: walletData.value.currentNetworkName
        }))
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[refreshNetworkFromChrono] failed:', e)
  }
}

// Wallet instance for signing (Method 1)
const walletInstance = ref<any>(null)

// History modal state
const historyVisible = ref(false)
const historyLoading = ref(false)
const historyError = ref('')
const historyRows = ref<HistoryRecord[]>([])
const historyForProductId = ref<string>('')
const historySelectedItem = ref<ItemProduct | null>(null)

// Cache for avatar address -> name
const avatarNames = ref<Record<string, string>>({})

// Avatar selection modal state
const avatarSelectionVisible = ref(false)
const availableAvatars = ref<Array<{ address: string; name: string }>>([])
const selectedAvatarAddress = ref<string>('')
const pendingPurchaseItem = ref<ItemProduct | null>(null)

/**
 * Fetches avatar states for the given agent address
 * @param agentAddress - The agent address to query
 * @param networkKey - The network key ('odin' | 'heimdall' | 'thor')
 * @returns Promise<Array<{ address: string; name: string }>> - Array of avatar states
 */
async function fetchAvatarStates(agentAddress: string, networkKey: 'odin' | 'heimdall' | 'thor'): Promise<Array<{ address: string; name: string }>> {
  try {
    const query = `
      query($addr: Address!) {
        stateQuery {
          agent(address: $addr) {
            avatarStates {
              address
              name
            }
          }
        }
      }
    `

    const { json: data, endpointUsed } = await postGraphqlWithFailover(networkKey, {
      query,
      variables: { addr: agentAddress }
    })
    if (import.meta.env.DEV) console.log('[Avatar] Queried via:', endpointUsed)

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL error occurred')
    }

    const avatarStates = data.data?.stateQuery?.agent?.avatarStates || []
    return avatarStates.map((avatar: any) => ({
      address: avatar.address,
      name: avatar.name
    }))
  } catch (err: any) {
    console.error('[Avatar] Failed to fetch avatar states:', err)
    throw err
  }
}

/**
 * Broadcasts a signed transaction to the Nine Chronicles network using stageTx mutation
 * @param signedPayload - The signed transaction payload (hex string)
 * @param networkKey - The network key ('odin' | 'heimdall' | 'thor')
 * @returns Promise<string> - Transaction ID
 */
async function broadcastTransaction(signedPayload: string, networkKey: 'odin' | 'heimdall' | 'thor'): Promise<string> {
  try {
    // Remove 0x prefix if present - payload should NOT have 0x prefix
    let payloadHex = signedPayload
    if (payloadHex.startsWith('0x')) {
      payloadHex = payloadHex.substring(2)
    }

    const mutation = `
      mutation($payload: String!) {
        stageTransaction(payload: $payload)
      }
    `

    const requestBody = {
      query: mutation,
      variables: {
        payload: payloadHex
      }
    }

    const { json: data, endpointUsed } = await postGraphqlWithFailover(networkKey, requestBody)
    if (import.meta.env.DEV) console.log('[Broadcast] Used RPC endpoint:', endpointUsed)

    if (data.errors) {
      const errorMessage = data.errors[0]?.message || 'GraphQL error occurred'
      const errorDetails = data.errors[0]?.extensions || {}
      console.error('[Broadcast] GraphQL errors:', data.errors)
      throw new Error(`${errorMessage}${errorDetails.code ? ` (Code: ${errorDetails.code})` : ''}`)
    }

    // Return the transaction id
    if (data.data?.stageTransaction) {
      return data.data.stageTransaction as string
    }
    if (data.data?.stageTx) {
      return data.data.stageTx as string
    }

    throw new Error('No transaction id returned from RPC node')
  } catch (err: any) {
    console.error('[Broadcast] Failed to broadcast transaction:', err)
    console.error('[Broadcast] Error details:', {
      message: err?.message,
      stack: err?.stack,
      response: err?.response
    })
    throw err
  }
}

/**
 * Proceeds with the purchase using the selected avatar address
 */
async function proceedWithPurchase(avatarAddress: string, item: ItemProduct) {
  try {
    const networkKey = currentNetworkKey.value
    if (import.meta.env.DEV) console.log('[Buy] Requesting plainvalue from 9CAPI for', networkKey, 'network...')

    // Validate required fields
    if (!avatarAddress) {
      throw new Error('Avatar address is required')
    }
    if (!item.tradableId) {
      throw new Error('Item tradableId is required')
    }
    if (!item.productId) {
      throw new Error('Item productId is required')
    }
    if (!item.sellerAgentAddress) {
      throw new Error('Seller agent address is required')
    }
    if (!item.sellerAvatarAddress) {
      throw new Error('Seller avatar address is required')
    }
    if (item.price === undefined || item.price === null) {
      throw new Error('Item price is required')
    }
    if (item.itemSubType === undefined || item.itemSubType === null) {
      throw new Error('Item subType is required')
    }

    // Call 9CAPI to generate the plainvalue payload
    const apiUrl = networkKey === 'odin'
      ? 'https://api.9capi.com/mobileBuyOdin'
      : (networkKey === 'heimdall'
        ? 'https://api.9capi.com/mobileBuyHeimdall'
        : 'https://api.9capi.com/mobileBuyThor')
    const requestData = {
      avatarAddress: ensureHexPrefix(avatarAddress),
      itemTradableId: String(item.tradableId),
      itemProductId: String(item.productId),
      sellerAgentAddress: ensureHexPrefix(item.sellerAgentAddress),
      sellerAvatarAddress: ensureHexPrefix(item.sellerAvatarAddress),
      price: Number(item.price),
      itemSubType: Number(item.itemSubType)
    }

    let response: Response
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        mode: 'cors' // Explicitly set CORS mode
      })
    } catch (fetchError: any) {
      console.error('[Buy] Fetch error (network/CORS):', fetchError)
      throw new Error(`Network error: ${fetchError.message}. This might be a CORS issue or the API endpoint might be unreachable.`)
    }

    if (import.meta.env.DEV) console.log('[Buy] Response status:', response.status)

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
        console.error('[Buy] 9CAPI error response body:', errorText)
      } catch (e) {
        console.error('[Buy] Could not read error response body:', e)
        errorText = 'Could not read error response (might be a CORS issue)'
      }
      
      // Try to parse as JSON if possible
      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = JSON.stringify(errorJson, null, 2)
      } catch {
        // Not JSON, use as-is
      }
      
      throw new Error(`9CAPI request failed: HTTP ${response.status}\n${errorDetails}`)
    }

    // Get the plainvalue string from the response
    const raw = await response.json()
    // API returns a JSON string (e.g., "6475...")
    const rawPlainvalue = typeof raw === 'string' ? raw : (raw?.plainvalue ?? raw?.data ?? '')
    if (typeof rawPlainvalue !== 'string' || rawPlainvalue.length === 0) {
      throw new Error('Invalid plainvalue from API')
    }
    if (rawPlainvalue.length > 200_000) {
      throw new Error('Plainvalue response is unexpectedly large')
    }
    const unquotedBuy = rawPlainvalue.trim().replace(/^"|"$/g, '')
    const plainvalueHex = normalizeHex(unquotedBuy)

    // Sign the plainvalue hex
    if (!walletInstance.value) {
      throw new Error('Wallet instance not available')
    }
    
    if (import.meta.env.DEV) console.log('[Buy] Signing plainvalue with Chrono wallet...')
    const signed = await walletInstance.value.signWithPlainValue(
      walletData.value.walletAddress,
      plainvalueHex
    )
    const signatureHex = extractSignatureHex(signed)

    // Auto-broadcast the signed transaction and open explorer link
    try {
      const txId = await broadcastTransaction(signatureHex, networkKey)
      const explorerUrl = networkKey === 'odin'
        ? `https://9cscan.com/tx/${txId}`
        : (networkKey === 'heimdall'
          ? `https://heimdall.9cscan.com/tx/${txId}`
          : `https://thor.9cscan.com/tx/${txId}`)
      if (import.meta.env.DEV) console.log('[Broadcast] Transaction staged. TxId:', txId)
      // Open in a new tab for user convenience
      openInNewTab(explorerUrl)
      alert(`Purchase Request sent!\nTx: ${txId}\nOpen: ${explorerUrl}`)
    } catch (e: any) {
      console.error('[Broadcast] Broadcasting failed:', e)
      alert(`Broadcast failed: ${e?.message || e}`)
    }

  } catch (err: any) {
    console.error('Failed to process purchase:', err)
    alert(`Transaction failed: ${err?.message || err}`)
  }
}

async function onBuy(item: ItemProduct) {
  try {
    if (!walletInstance.value) {
      walletInstance.value = getChronoSdk()
    }
    if (!walletInstance.value) {
      alert('Chrono wallet not detected.')
      return
    }
    if (!walletData.value.walletAddress) {
      alert('Wallet not connected.')
      return
    }

    // Get the current network
    const networkKey = currentNetworkKey.value

    // Fetch avatar states for the agent
    if (import.meta.env.DEV) console.log('[Buy] Fetching avatar states...')
    const avatars = await fetchAvatarStates(walletData.value.walletAddress, networkKey)
    
    if (avatars.length === 0) {
      alert('No avatars found for this agent address. Please create an avatar first.')
      return
    }

    // If only one avatar, use it directly
    if (avatars.length === 1) {
      await proceedWithPurchase(avatars[0].address, item)
      return
    }

    // Multiple avatars - show selection modal
    availableAvatars.value = avatars
    pendingPurchaseItem.value = item
    selectedAvatarAddress.value = ''
    avatarSelectionVisible.value = true
  } catch (err: any) {
    console.error('Failed to initiate purchase:', err)
    alert(`Failed to start purchase: ${err?.message || err}`)
  }
}

function selectAvatarAndProceed() {
  if (!selectedAvatarAddress.value) {
    alert('Please select an avatar.')
    return
  }
  
  if (!pendingPurchaseItem.value) {
    alert('Purchase item not found.')
    return
  }

  const selectedAvatar = availableAvatars.value.find(a => a.address === selectedAvatarAddress.value)
  if (!selectedAvatar) {
    alert('Selected avatar not found.')
    return
  }

  avatarSelectionVisible.value = false
  proceedWithPurchase(selectedAvatar.address, pendingPurchaseItem.value)
}

function closeAvatarSelection() {
  avatarSelectionVisible.value = false
  pendingPurchaseItem.value = null
  selectedAvatarAddress.value = ''
  availableAvatars.value = []
}

async function onHistory(item: ItemProduct) {
  try {
    historyVisible.value = true
    historyLoading.value = true
    historyError.value = ''
    historyRows.value = []
    historySelectedItem.value = item
    historyForProductId.value = String(item.tradableId || '')
    if (!historyForProductId.value) {
      throw new Error('Item GUID (tradableId) not available for this item')
    }

    const historyPath = currentNetworkKey.value === 'heimdall' 
      ? 'https://api.9capi.com/marketHistoryHeimdall' 
      : (currentNetworkKey.value === 'thor'
        ? 'https://api.9capi.com/marketHistoryThor'
        : 'https://api.9capi.com/marketHistoryOdin')
    const resp = await fetchWithTimeout(historyPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ itemGUID: historyForProductId.value })
    }, 10000)
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`)
    }
    const data = await resp.json()
    // Expecting an array of history records
    historyRows.value = Array.isArray(data) ? data : []
    // Preload avatar names for both list and buy addresses (merge-only)
    await preloadAvatarNames(historyRows.value, currentNetworkKey.value)
  } catch (err: any) {
    console.error('Failed to load history:', err)
    historyError.value = err?.message || 'Failed to load history'
  } finally {
    historyLoading.value = false
  }
}

function closeHistory() {
  historyVisible.value = false
}

async function resolveItemNames(items: ItemProduct[]) {
  const namePromises = items.map(async (item) => {
    // Resolve item name
    const itemName = await getItemName(item.itemId)
    itemNames.value.set(item.itemId, itemName)
    
    // Resolve skill names and descriptions
    const skillPromises = (item.skillModels ?? []).map(async (skill) => {
      const skillName = await getSkillName(skill.skillId)
      const skillDescription = await getSkillDescription(skill.skillId)
      skillNames.value.set(skill.skillId, skillName)
      skillDescriptions.value.set(skill.skillId, skillDescription)
    })
    
    await Promise.all(skillPromises)
  })
  
  await Promise.all(namePromises)
}

async function loadItems() {
  loading.value = true
  error.value = ''

  // Clear old data before loading new items
  clearItemData()

  try {
    const offset = (currentPage.value - 1) * itemsPerPage
    // If search query is present, resolve iconIds from CSV (token-based match) and include them in the API request
    const MAX_SEARCH_LEN = 200
    let iconIdsParam = ''
    if (searchQuery.value && searchQuery.value.trim()) {
      const iconIds = await findIconIdsByName(searchQuery.value.slice(0, MAX_SEARCH_LEN))
      if (iconIds.length > 0) {
        iconIdsParam = iconIds.map(id => `&iconIds=${encodeURIComponent(String(id))}`).join('')
      } else {
        // If no match, return early with empty items to avoid fetching unrelated results
        items.value = []
        loading.value = false
        return
      }
    }
    // Whitelist networkProvider — derived from a computed ternary, but encode defensively
    const ALLOWED_PROVIDERS = new Set(['Odin', 'Heimdall', 'Thor'])
    const networkProvider = currentNetworkKey.value === 'heimdall' ? 'Heimdall' : (currentNetworkKey.value === 'thor' ? 'Thor' : 'Odin')
    if (!ALLOWED_PROVIDERS.has(networkProvider)) throw new Error('Unknown network provider')

    // All user-influenced query params are encoded
    const safeOrder = encodeURIComponent(selectedOrder.value)
    let elementalTypeParam = ''
    if (selectedElementalType.value !== null) {
      elementalTypeParam = `&elementalType=${encodeURIComponent(String(selectedElementalType.value))}`
    }

    let url: string
    if (selectedSpellId.value !== null) {
      // Use spell-specific endpoint
      const spellParam = `&spellId=${encodeURIComponent(String(selectedSpellId.value))}`
      url = `${SPELL_API_BASE}/marketProvider${networkProvider}/Market/products/items/spell/${encodeURIComponent(String(selectedCategory.value))}?limit=${itemsPerPage}&offset=${offset}&order=${safeOrder}${spellParam}${elementalTypeParam}`
    } else {
      // Regular market endpoint
      url = `https://api.9capi.com/marketProvider${networkProvider}/Market/products/items/${encodeURIComponent(String(selectedCategory.value))}?limit=${itemsPerPage}&offset=${offset}&order=${safeOrder}${iconIdsParam}${elementalTypeParam}`
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: MarketResponse = await response.json()
    
    items.value = data.itemProducts || []

    // Resolve item names after loading items
    if (items.value && items.value.length > 0) {
      // Preload seller avatar names (non-blocking)
      preloadSellerNames(items.value)
      await resolveItemNames(items.value)
      await computeStatQualities(items.value)
    }
  } catch (err: any) {
    console.error('Error loading items:', err)
    error.value = err.message || 'Failed to load marketplace items'
    items.value = []
  } finally {
    loading.value = false
  }
}

function selectCategory(categoryId: number) {
  selectedCategory.value = categoryId
  currentPage.value = 1 // Reset to first page when changing category
  selectedSpellId.value = null // Reset spell filter when changing category

  // Reset search when changing equipment tab
  if (searchDebounce) {
    clearTimeout(searchDebounce)
    searchDebounce = null
  }
  searchQuery.value = ''

  // Clear old data before loading new category
  clearItemData()
  loadSkillsForCategory()
  loadItems()
}

function selectElementalType(elementalTypeId: number | null) {
  selectedElementalType.value = elementalTypeId
  currentPage.value = 1 // Reset to first page when changing elemental filter

  // Reset search when changing elemental filter
  if (searchDebounce) {
    clearTimeout(searchDebounce)
    searchDebounce = null
  }
  searchQuery.value = ''

  // Clear old data before loading new filter
  clearItemData()
  loadItems()
}

function selectSpell() {
  currentPage.value = 1 // Reset to first page when changing spell filter
  if (searchDebounce) {
    clearTimeout(searchDebounce)
    searchDebounce = null
  }
  searchQuery.value = ''
  clearItemData()
  loadItems()
}

async function loadSkillsForCategory() {
  spellsLoading.value = true
  availableSpellsForCategory.value = []
  try {
    const networkProvider = currentNetworkKey.value === 'heimdall' ? 'Heimdall' : (currentNetworkKey.value === 'thor' ? 'Thor' : 'Odin')
    // Fetch more items to discover all spells for this category (Thorn, Concentration, Dispel, etc.)
    const url = `https://api.9capi.com/marketProvider${networkProvider}/Market/products/items/${encodeURIComponent(String(selectedCategory.value))}?limit=5000&offset=0&order=cp_desc`
    const response = await fetch(url)
    if (!response.ok) return
    const data: MarketResponse = await response.json()
    const itemProducts = data.itemProducts || []
    const skillIds = new Set<number>()
    for (const item of itemProducts) {
      if (item.skillModels && Array.isArray(item.skillModels)) {
        for (const sm of item.skillModels) {
          if (typeof sm.skillId === 'number') skillIds.add(sm.skillId)
        }
      }
    }
    const spells: Array<{ id: number; name: string }> = []
    for (const id of Array.from(skillIds).sort((a, b) => a - b)) {
      const name = await getSkillName(id)
      spells.push({ id, name })
    }
    availableSpellsForCategory.value = spells
  } catch (err) {
    console.error('Error loading spells for category:', err)
  } finally {
    spellsLoading.value = false
  }
}

function onOrderChange() {
  currentPage.value = 1 // Reset to first page when changing order
  loadItems()
}

function onSearchChange() {
  currentPage.value = 1
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
  searchDebounce = setTimeout(() => {
    loadItems()
  }, 300)
}

function clearItemData() {
  items.value = []
  error.value = ''
  itemNames.value.clear()
  skillNames.value.clear()
  skillDescriptions.value.clear()
  statQualities.value = {}
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadItems()
  }
}

function nextPage() {
  // Allow going to next page if we got a full page (indicating more pages might exist)
  if (items.value.length === itemsPerPage) {
    currentPage.value++
    loadItems()
  }
}

function handleImageError(event: any) {
  // Hide broken image by setting src to empty
  event.target.style.display = 'none'
}

function getAdditionalStatsCount(item: ItemProduct): number {
  if (!item.statModels) return 0

  // Find the base stat (additional: false)
  const baseStat = item.statModels.find(stat => !stat.additional)
  if (!baseStat) return 0

  // Count additional stats that are different types from the base stat
  const baseStatType = baseStat.type
  return item.statModels.filter(stat =>
    stat.additional && stat.type !== baseStatType
  ).length
}

function getSkillsCount(item: ItemProduct): number {
  return item.skillModels ? item.skillModels.length : 0
}

// Helper function to safely filter and validate stat models
function getValidStatModels(statModels: Array<{ value: number; type: number; additional: boolean }> | undefined): Array<{ value: number; type: number; additional: boolean }> {
  if (!statModels || !Array.isArray(statModels)) return []
  return statModels.filter(stat => stat && typeof stat.type === 'number' && typeof stat.value === 'number')
}

// Helper function to safely filter and validate skill models
function getValidSkillModels(skillModels: Array<{ skillId: number; elementalType: number; skillCategory: number; hitCount: number; cooldown: number; power: number; statPowerRatio: number; chance: number; referencedStatType: number }> | undefined): Array<{ skillId: number; elementalType: number; skillCategory: number; hitCount: number; cooldown: number; power: number; statPowerRatio: number; chance: number; referencedStatType: number }> {
  if (!skillModels || !Array.isArray(skillModels)) return []
  return skillModels.filter(skill => skill && typeof skill.skillId === 'number').slice(0, 2)
}

async function computeStatQualities(loadedItems: ItemProduct[]) {
  const qualities: Record<string, number> = {}
  for (const item of loadedItems) {
    if (!item || !item.itemId || !item.statModels) continue
    // Temporarily disable percentage calculations for non-zero levels
    if (item.level && item.level !== 0) {
      continue
    }
    const valid = getValidStatModels(item.statModels)
    // Try type inference for additional stats when the displayed type may be mis-mapped
    const inferredTypes: (number | null)[] = new Array(valid.length).fill(null)
    for (let i = 0; i < valid.length; i++) {
      const stat = valid[i]
      if (stat.additional) {
        const inferred = await inferAdditionalStatType(item.itemId, stat.value, valid)
        if (inferred !== null) inferredTypes[i] = inferred
      }
    }
    // Compute for all stats on this item
    const perItemPromises: Promise<void>[] = []
    for (let i = 0; i < valid.length; i++) {
      perItemPromises.push((async () => {
        const stat = valid[i]
        const effectiveType = inferredTypes[i] ?? stat.type
        const pct = await getStatQualityPercentForItemStat(item.itemId, effectiveType, stat.value, valid, item.grade, item.level, item.productId)
        if (pct !== null) {
          qualities[qualityKey(item, i)] = pct
        }
      })())
    }
    await Promise.all(perItemPromises)
  }
  statQualities.value = qualities
}

function qualityKey(item: ItemProduct, statIndex: number): string {
  const base = item.productId || item.tradableId || String(item.itemId)
  return `${base}:${statIndex}`
}

function getItemRating(item: ItemProduct): { yellowStars: number, purpleStars: number, totalStars: number } {
  const baseYellowStars = 1 // Every item has 1 base yellow star
  const additionalStatsCount = getAdditionalStatsCount(item)
  const skillsCount = getSkillsCount(item)

  // Total yellow stars = base + additional stats
  const yellowStars = baseYellowStars + additionalStatsCount

  // Purple stars = skills (but can't exceed total available stars)
  const purpleStars = Math.min(skillsCount, (item.optionCountFromCombination || 0) - yellowStars)

  const totalStars = yellowStars + purpleStars

  return { yellowStars, purpleStars, totalStars }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

function shortAddress(addr: string): string {
  if (!addr) return ''
  return addr.length > 12 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr
}

// Avatar name resolution (Odin network)
async function fetchAvatarName(address: string, network: 'odin' | 'heimdall' | 'thor'): Promise<string | null> {
  try {
    // 1) Try avatar by avatarAddress
    const qAvatar = `
      query($addr: Address!) {
        stateQuery { avatar(avatarAddress: $addr) { name } }
      }
    `
    let rpc1 = await postGraphqlWithFailover(network, {
      query: qAvatar,
      variables: { addr: address }
    })
    if (rpc1?.json) {
      const data = rpc1.json
      const name = data?.data?.stateQuery?.avatar?.name
      if (typeof name === 'string' && name.trim()) return name
    }

    // 2) Fallback: treat as agent address and get first avatar name
    const qAgent = `
      query($addr: Address!) {
        stateQuery { agent(address: $addr) { avatarStates { name } } }
      }
    `
    rpc1 = await postGraphqlWithFailover(network, {
      query: qAgent,
      variables: { addr: address }
    })
    const data2 = rpc1.json
    const avatars: Array<{ name: string }> = data2?.data?.stateQuery?.agent?.avatarStates || []
    const candidate = avatars.find(a => a && typeof a.name === 'string' && a.name.trim())
    return candidate?.name || null
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[fetchAvatarName] Failed for address', address, err)
    return null
  }
}

async function preloadAvatarNames(rows: HistoryRecord[], network: 'odin' | 'heimdall' | 'thor') {
  const unique = new Set<string>()
  for (const r of rows) {
    if (r.listavatar) unique.add(r.listavatar)
    if (r.buyavatar) unique.add(r.buyavatar)
  }
  const promises: Promise<void>[] = []
  unique.forEach((addr) => {
    const current = avatarNames.value[addr]
    // If we already have a real name, skip. Do not write fallback into cache.
    if (current && !(current.includes && current.includes('…'))) {
      return
    }
    promises.push((async () => {
      const name = await fetchAvatarName(addr, network)
      if (name) {
        avatarNames.value = { ...avatarNames.value, [addr]: name }
      }
    })())
  })
  await Promise.all(promises)
}

async function preloadSellerNames(list: ItemProduct[]) {
  const unique = new Set<string>()
  for (const it of list) {
    if (it && it.sellerAvatarAddress) unique.add(it.sellerAvatarAddress)
  }
  const promises: Promise<void>[] = []
  unique.forEach((addr) => {
    const current = avatarNames.value[addr]
    // If we already have a real name, skip. Do not write fallback into cache.
    if (current && !(current.includes && current.includes('…'))) {
      return
    }
    promises.push((async () => {
      const name = await fetchAvatarName(addr, currentNetworkKey.value)
      if (name) {
        avatarNames.value = { ...avatarNames.value, [addr]: name }
      }
    })())
  })
  await Promise.all(promises)
}

// hasHistory helper removed
</script>

<style scoped>
/* ── Base ── */
.market-page {
  min-height: 100vh;
  background: #080b20;
  color: #e2e8f0;
  background-image:
    radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.014'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.market-content {
  padding: 1.75rem 0 3rem;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #1e2545;
}

.market-header h1 {
  color: #e2e8f0;
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

/* ── Filter Controls ── */
.category-selector {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: rgba(26, 31, 58, 0.6);
  border-radius: 12px;
  flex-wrap: wrap;
  border: 1px solid rgba(45, 55, 72, 0.7);
  backdrop-filter: blur(8px);
}

.category-btn {
  background: rgba(37, 43, 66, 0.8);
  border: 1px solid rgba(61, 71, 87, 0.6);
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  color: #94a3b8;
  letter-spacing: 0.2px;
}

.category-btn:hover {
  background: rgba(45, 55, 72, 0.9);
  border-color: rgba(99, 102, 241, 0.5);
  color: #e2e8f0;
  transform: translateY(-1px);
}

.category-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%);
  color: white;
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.1);
}

.elemental-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.65rem 0.9rem;
  background: rgba(26, 31, 58, 0.5);
  border-radius: 10px;
  flex-wrap: wrap;
  border: 1px solid rgba(45, 55, 72, 0.6);
}

.elemental-selector label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.78rem;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.elemental-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  flex: 1;
}

.spell-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.65rem 0.9rem;
  background: rgba(26, 31, 58, 0.5);
  border-radius: 10px;
  flex-wrap: wrap;
  border: 1px solid rgba(45, 55, 72, 0.6);
}

.spell-selector label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.78rem;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.spell-select {
  min-width: 180px;
}

.spell-loading-hint {
  font-size: 0.82rem;
  color: #64748b;
  font-style: italic;
}

.elemental-btn {
  background: rgba(37, 43, 66, 0.8);
  border: 1px solid rgba(61, 71, 87, 0.5);
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  color: #94a3b8;
  white-space: nowrap;
}

.elemental-btn:hover {
  border-color: rgba(99, 102, 241, 0.4);
  color: #e2e8f0;
}

.elemental-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.85) 0%, rgba(139, 92, 246, 0.85) 100%);
  color: white;
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.ordering-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.65rem 0.9rem;
  background: rgba(26, 31, 58, 0.5);
  border-radius: 10px;
  flex-wrap: wrap;
  border: 1px solid rgba(45, 55, 72, 0.6);
}

.ordering-selector label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.78rem;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.order-select {
  background: rgba(37, 43, 66, 0.9);
  border: 1px solid rgba(61, 71, 87, 0.6);
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  color: #e2e8f0;
  min-width: 200px;
}

.order-select:hover {
  border-color: rgba(99, 102, 241, 0.4);
}

.order-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.search-box {
  flex: 1 1 280px;
  display: flex;
  justify-content: flex-end;
}

.search-input {
  width: 100%;
  max-width: 300px;
  background: rgba(37, 43, 66, 0.9);
  border: 1px solid rgba(61, 71, 87, 0.6);
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #e2e8f0;
  transition: all 0.18s ease;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.search-input::placeholder {
  color: #4a5568;
}

/* ── Misc ── */
.market-stats {
  display: flex;
  gap: 2rem;
  color: #94a3b8;
}

.loading {
  text-align: center;
  padding: 5rem 0;
  color: #94a3b8;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(99, 102, 241, 0.12);
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1.25rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 5rem 0;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error h3 {
  color: #f87171;
  margin: 0 0 0.75rem 0;
}

.error p {
  color: #64748b;
  margin: 0 0 2rem 0;
}

/* ── Items Grid ── */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
  gap: 1.25rem;
  margin-bottom: 3rem;
}

/* ── Item Card ── */
.item-card {
  background: linear-gradient(160deg, #131830 0%, #0f1428 100%);
  border: 1px solid rgba(30, 37, 69, 0.9);
  border-top: 2px solid rgba(45, 55, 90, 0.9);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.03);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.item-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.6) 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.2s;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.18), 0 4px 16px rgba(0,0,0,0.5);
  border-color: rgba(99, 102, 241, 0.4);
}

.item-card:hover::before {
  opacity: 1;
}

/* Grade-specific card accents */
.card-grade-5 { border-top-color: rgba(202, 138, 4, 0.8); }
.card-grade-5:hover { box-shadow: 0 12px 32px rgba(202, 138, 4, 0.18), 0 4px 16px rgba(0,0,0,0.5); border-color: rgba(202, 138, 4, 0.45); }
.card-grade-5::before { background: linear-gradient(90deg, transparent 0%, rgba(234, 179, 8, 0.7) 50%, transparent 100%); }

.card-grade-6 { border-top-color: rgba(234, 88, 12, 0.8); }
.card-grade-6:hover { box-shadow: 0 12px 32px rgba(234, 88, 12, 0.2), 0 4px 16px rgba(0,0,0,0.5); border-color: rgba(234, 88, 12, 0.45); }
.card-grade-6::before { background: linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.7) 50%, transparent 100%); }

.card-grade-7 { border-top-color: rgba(219, 39, 119, 0.85); }
.card-grade-7:hover { box-shadow: 0 12px 32px rgba(219, 39, 119, 0.22), 0 4px 16px rgba(0,0,0,0.5); border-color: rgba(219, 39, 119, 0.5); }
.card-grade-7::before { background: linear-gradient(90deg, transparent 0%, rgba(236, 72, 153, 0.8) 50%, transparent 100%); }

.card-grade-8 { border-top-color: rgba(6, 182, 212, 0.9); }
.card-grade-8:hover { box-shadow: 0 12px 32px rgba(6, 182, 212, 0.2), 0 4px 16px rgba(0,0,0,0.5); border-color: rgba(6, 182, 212, 0.5); }
.card-grade-8::before { background: linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.85) 50%, transparent 100%); }

/* ── Item Image ── */
.item-image {
  background: linear-gradient(145deg, #1a1f40 0%, #14193a 50%, #0f1330 100%);
  height: 130px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.item-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

/* Grade image backgrounds */
.img-grade-1, .img-grade-2 { background: linear-gradient(145deg, #1a1f2e 0%, #141820 100%); }
.img-grade-3 { background: linear-gradient(145deg, #172040 0%, #0f172a 100%); }
.img-grade-4 { background: linear-gradient(145deg, #1a1040 0%, #130b30 100%); }
.img-grade-5 { background: linear-gradient(145deg, #2a200a 0%, #1c1505 60%, #241a08 100%); }
.img-grade-5::after { background: radial-gradient(ellipse at center, rgba(234, 179, 8, 0.08) 0%, transparent 65%); }
.img-grade-6 { background: linear-gradient(145deg, #2a1008 0%, #1c0a04 60%, #241208 100%); }
.img-grade-6::after { background: radial-gradient(ellipse at center, rgba(249, 115, 22, 0.08) 0%, transparent 65%); }
.img-grade-7 { background: linear-gradient(145deg, #2a0820 0%, #1c0415 60%, #240820 100%); }
.img-grade-7::after { background: radial-gradient(ellipse at center, rgba(236, 72, 153, 0.1) 0%, transparent 65%); }
.img-grade-8 { background: linear-gradient(145deg, #031a20 0%, #021218 60%, #031a20 100%); }
.img-grade-8::after { background: radial-gradient(ellipse at center, rgba(6, 182, 212, 0.12) 0%, transparent 65%); }

.item-icon {
  width: 100%;
  height: 100%;
  object-fit: scale-down;
  padding: 0.9rem;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
  transition: transform 0.2s ease;
}

.item-card:hover .item-icon {
  transform: translateZ(0) scale(1.06);
}

.item-grade {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  z-index: 2;
  text-transform: uppercase;
}

.grade-1, .grade-2, .grade-3 {
  background: rgba(100, 116, 139, 0.85);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.2);
}
.grade-4 {
  background: rgba(88, 28, 135, 0.85);
  color: #e9d5ff;
  border: 1px solid rgba(167, 139, 250, 0.3);
}
.grade-5 {
  background: linear-gradient(135deg, rgba(161, 98, 7, 0.9), rgba(202, 138, 4, 0.9));
  color: #fef3c7;
  border: 1px solid rgba(234, 179, 8, 0.4);
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.2);
}
.grade-6 {
  background: linear-gradient(135deg, rgba(154, 52, 18, 0.9), rgba(194, 65, 12, 0.9));
  color: #ffedd5;
  border: 1px solid rgba(249, 115, 22, 0.4);
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.2);
}
.grade-7 {
  background: linear-gradient(135deg, rgba(157, 23, 77, 0.9), rgba(190, 24, 93, 0.9));
  color: #fce7f3;
  border: 1px solid rgba(236, 72, 153, 0.4);
  box-shadow: 0 0 10px rgba(236, 72, 153, 0.25);
}
.grade-8 {
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.9), rgba(6, 182, 212, 0.9));
  color: #cffafe;
  border: 1px solid rgba(6, 182, 212, 0.4);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
}

.item-level {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
  border: 1px solid rgba(255,255,255,0.06);
  z-index: 2;
}

/* ── Item Body ── */
.item-info {
  padding: 0.875rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  color: #e2e8f0;
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
}

.product-id {
  font-size: 0.7rem;
  color: #374151;
  word-break: break-all;
  font-family: ui-monospace, monospace;
}

.seller-line {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
}
.seller-label { color: #4b5563; }
.seller-name { font-weight: 600; color: #6b7280; }

.item-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.item-rating {
  display: flex;
  gap: 0.2rem;
  margin-top: 0.1rem;
}

.star {
  font-size: 0.95rem;
  line-height: 1;
}

.star-yellow {
  color: #fbbf24;
  filter: drop-shadow(0 0 3px rgba(251, 191, 36, 0.5));
}

.star-purple {
  color: #a855f7;
  filter: drop-shadow(0 0 3px rgba(168, 85, 247, 0.5));
}

/* ── Stats ── */
.item-stats {
  margin-bottom: 0.875rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  align-items: center;
}

.stat-label {
  color: #64748b;
  font-size: 0.8rem;
}

.stat-value {
  color: #cbd5e0;
  font-weight: 600;
  font-size: 0.8rem;
}

.item-stat-models {
  margin-top: 0.625rem;
  padding-top: 0.625rem;
  border-top: 1px solid rgba(30, 37, 69, 0.9);
}

.stat-model {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
  font-size: 0.8rem;
}

.stat-model-label {
  color: #94a3b8;
  font-weight: 500;
}

.additional-indicator {
  color: #34d399;
  font-weight: 800;
  margin-left: 0.2rem;
}

.stat-model-value {
  color: #cbd5e0;
  font-weight: 600;
}

.stat-quality {
  margin-left: 0.3rem;
  color: #8b5cf6;
  font-weight: 600;
  font-size: 0.78rem;
}
.stat-quality.unavailable {
  color: #374151;
  font-weight: 500;
}

/* ── Skills ── */
.item-skills {
  margin-bottom: 0.875rem;
  flex-grow: 1;
}

.no-skills {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.75rem;
}

.no-skills-text {
  color: #374151;
  font-style: italic;
  font-size: 0.78rem;
}

.skill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.22rem 0.5rem;
  margin-bottom: 0.2rem;
  font-size: 0.78rem;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 5px;
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.skill-name {
  font-weight: 500;
  cursor: help;
  color: #a78bfa;
}

.skill-name:hover {
  color: #c4b5fd;
}

.skill-power {
  color: #8b5cf6;
  font-weight: 700;
  font-size: 0.8rem;
}

/* ── Price ── */
.item-price {
  background: rgba(10, 12, 28, 0.7);
  padding: 0.875rem;
  border-top: 1px solid rgba(20, 25, 50, 0.9);
}

.price-main {
  display: flex;
  align-items: baseline;
  margin-bottom: 0.35rem;
  gap: 0.4rem;
}

.price-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: #10b981;
  letter-spacing: -0.3px;
}

.price-currency {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.85rem;
}

.price-details {
  margin-bottom: 0.875rem;
  font-size: 0.76rem;
  color: #4b5563;
  line-height: 1.5;
}

.crystal-price { margin-bottom: 0.15rem; }
.crystal-per-price { font-style: italic; }

/* ── Buttons ── */
.btn {
  padding: 0.6rem 1.5rem;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  width: 100%;
  letter-spacing: 0.2px;
}

.btn-primary {
  background: linear-gradient(135deg, #5f63f0 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: rgba(37, 43, 66, 0.6);
  border: 1px solid rgba(61, 71, 87, 0.7);
  color: #94a3b8;
}

.btn-outline:hover:not(:disabled) {
  background: rgba(45, 55, 72, 0.8);
  border-color: rgba(99, 102, 241, 0.4);
  color: #e2e8f0;
}

.btn-outline:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(71, 85, 105, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%);
  color: #e2e8f0;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(71, 85, 105, 0.25);
}

.btn-buy {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);
}

.btn-buy:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}

.loading-name {
  color: #374151;
  font-style: italic;
  font-size: 0.88em;
}

/* ── Pagination ── */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 0;
  border-top: 1px solid rgba(30, 37, 69, 0.9);
  gap: 1rem;
}

.pagination.top {
  padding: 0.875rem 0 0.5rem 0;
  border-top: none;
  border-bottom: 1px solid rgba(30, 37, 69, 0.9);
  margin-bottom: 1.5rem;
}

.pagination.bottom {
  padding: 1.5rem 0 0.75rem 0;
  border-top: 1px solid rgba(30, 37, 69, 0.9);
  border-bottom: none;
  margin-top: 2rem;
}

/* ── Login Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 20, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.login-modal {
  background: linear-gradient(160deg, #141830 0%, #0f1225 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  width: min(480px, 90vw);
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.03);
}

.login-modal .modal-header {
  padding: 1.5rem 1.5rem 1.25rem;
  border-bottom: 1px solid rgba(30, 37, 69, 0.9);
  text-align: center;
  position: relative;
}

.login-modal .modal-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), transparent);
}

.login-modal .modal-header h2 {
  margin: 0;
  color: #e2e8f0;
  font-size: 1.4rem;
  font-weight: 700;
}

.login-modal .modal-body {
  padding: 2rem;
  text-align: center;
}

.login-modal .modal-body p {
  margin: 0 0 1.75rem 0;
  color: #94a3b8;
  font-size: 0.92rem;
  line-height: 1.6;
}

.login-options {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.chain-selector h3 {
  margin: 0 0 0.875rem 0;
  color: #e2e8f0;
  font-size: 1.15rem;
  font-weight: 600;
}

.current-chain-hint {
  margin: 0 0 1.25rem 0;
  color: #64748b;
  font-size: 0.85rem;
  font-style: italic;
}

.chain-options {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.chain-options .btn {
  flex: 1;
  min-width: 100px;
}

.login-modal .btn {
  padding: 0.8rem 1.5rem;
  font-size: 0.95rem;
}

.login-modal .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chain-options .btn-active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}

/* ── History Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 20, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(160deg, #131830 0%, #0d1124 100%);
  border: 1px solid rgba(30, 37, 69, 0.9);
  border-radius: 14px;
  width: min(920px, 94vw);
  max-height: 82vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02);
}

.modal-header {
  padding: 0.875rem 1.125rem;
  border-bottom: 1px solid rgba(30, 37, 69, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(10, 12, 28, 0.3);
}

.modal-title .title-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-title h3 {
  color: #e2e8f0;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.modal-title .subtitle {
  margin-top: 0.2rem;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
}

.modal-title .subtitle .name {
  font-weight: 600;
  color: #94a3b8;
}

.badge {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.25);
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.badge.grade {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.25);
}

.divider { opacity: 0.3; color: #4b5563; }

.modal-close {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  color: #64748b;
  transition: all 0.18s ease;
  line-height: 1;
  padding: 0;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

.modal-body {
  padding: 1rem;
  overflow: auto;
}

.modal-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(30, 37, 69, 0.9);
  background: rgba(10, 12, 28, 0.3);
}

/* ── History Table ── */
.history-table-wrapper {
  overflow: auto;
  border-radius: 8px;
  border: 1px solid rgba(30, 37, 69, 0.9);
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(20, 25, 50, 0.9);
  text-align: left;
  font-size: 0.85rem;
  color: #cbd5e0;
}

.history-table tbody tr:nth-child(odd) {
  background: rgba(10, 12, 28, 0.3);
}

.history-table tbody tr:hover {
  background: rgba(99, 102, 241, 0.05);
}

.history-table thead th {
  background: rgba(10, 12, 28, 0.6);
  position: sticky;
  top: 0;
  z-index: 1;
  color: #64748b;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(45, 55, 90, 0.9);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.82rem;
}

.small { font-size: 0.72rem; color: #4b5563; }

.avatar-cell { display: flex; flex-direction: column; gap: 0.1rem; }
.avatar-name { font-weight: 600; color: #94a3b8; }
.avatar-addr { color: #374151; }

.avatar-option.selected {
  border-color: #6366f1 !important;
  background: rgba(99, 102, 241, 0.12) !important;
}

.avatar-option:hover {
  border-color: rgba(99, 102, 241, 0.3) !important;
  background: rgba(37, 43, 66, 0.8) !important;
}

.page-info {
  color: #64748b;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.pagination .btn-outline {
  padding: 0.45rem 1rem;
  font-size: 0.82rem;
  width: auto;
  min-width: 90px;
}

@media (max-width: 768px) {
  .market-content {
    padding: 1rem 0;
  }

  .container {
    padding: 0 1rem;
  }
  
  .market-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .market-stats {
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-selector {
    justify-content: center;
    padding: 0.75rem;
    gap: 0.4rem;
  }

  .category-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    flex: 1 1 auto;
    min-width: calc(50% - 0.2rem);
  }

  .elemental-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .elemental-selector label {
    text-align: center;
    font-size: 0.85rem;
  }

  .elemental-buttons {
    justify-content: center;
  }

  .spell-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .spell-selector label {
    text-align: center;
  }

  .spell-select {
    min-width: 100%;
  }

  .elemental-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    flex: 1 1 auto;
    min-width: calc(33.333% - 0.4rem);
  }

  .ordering-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .ordering-selector label {
    text-align: center;
    font-size: 0.85rem;
  }

  .order-select {
    min-width: 100%;
    padding: 0.6rem;
    font-size: 0.85rem;
  }

  .search-box {
    flex: 1 1 100%;
    max-width: 100%;
  }

  .search-input {
    max-width: 100%;
  }

  .items-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .item-card {
    min-height: auto;
  }

  .item-image {
    height: 100px;
  }

  .item-info {
    padding: 0.6rem;
  }

  .item-name {
    font-size: 0.95rem;
  }

  .product-id {
    font-size: 0.7rem;
  }

  .item-price {
    padding: 0.6rem;
  }

  .price-value {
    font-size: 1.1rem;
  }

  .btn {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
  }

  .pagination.top {
    padding: 0.75rem 0 0.25rem 0;
    margin-bottom: 1rem;
  }

  .pagination.bottom {
    padding: 1.5rem 0 0.75rem 0;
    margin-top: 1.5rem;
  }

  .pagination .btn-outline {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    min-width: 80px;
    width: 100%;
  }

  .page-info {
    text-align: center;
  }

  /* Modal responsive styles */
  .modal {
    width: 95vw;
    max-height: 90vh;
    margin: 1rem;
  }

  .modal-header {
    padding: 0.75rem;
    flex-wrap: wrap;
  }

  .modal-title h3 {
    font-size: 1.1rem;
  }

  .modal-title .subtitle {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    font-size: 0.85rem;
  }

  .modal-body {
    padding: 0.75rem;
  }

  .history-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .history-table {
    min-width: 600px;
    font-size: 0.8rem;
  }

  .history-table th,
  .history-table td {
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
  }

  .avatar-cell {
    min-width: 120px;
  }

  .login-modal {
    width: 95vw;
    max-width: 95vw;
    margin: 1rem;
  }

  .login-modal .modal-header {
    padding: 1rem;
  }

  .login-modal .modal-header h2 {
    font-size: 1.25rem;
  }

  .login-modal .modal-body {
    padding: 1.5rem 1rem;
  }

  .login-modal .modal-body p {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .chain-options {
    flex-direction: column;
    gap: 0.75rem;
  }

  .chain-options .btn {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .market-content {
    padding: 0.5rem 0;
  }

  .container {
    padding: 0 0.75rem;
  }

  .category-selector {
    padding: 0.5rem;
    gap: 0.3rem;
  }

  .category-btn {
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
    min-width: calc(50% - 0.15rem);
  }

  .elemental-selector,
  .ordering-selector,
  .spell-selector {
    padding: 0.5rem;
  }

  .elemental-btn {
    padding: 0.35rem 0.6rem;
    font-size: 0.75rem;
    min-width: calc(50% - 0.25rem);
  }

  .items-grid {
    gap: 0.75rem;
  }

  .item-image {
    height: 90px;
  }

  .item-info {
    padding: 0.5rem;
  }

  .item-name {
    font-size: 0.9rem;
  }

  .stat-model {
    font-size: 0.8rem;
  }

  .stat-model-label,
  .stat-model-value {
    font-size: 0.8rem;
  }

  .price-value {
    font-size: 1rem;
  }

  .modal {
    width: 100vw;
    max-height: 100vh;
    margin: 0;
    border-radius: 0;
  }

  .login-modal {
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
  }

  .history-table {
    min-width: 500px;
    font-size: 0.75rem;
  }
}
</style>

