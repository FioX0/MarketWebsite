<template>
  <div class="market-page">
    <AppHeader 
      :network-name="walletData.currentNetworkName"
      :wallet-address="walletData.walletAddress"
      :wallet-balance="walletData.walletBalance"
      :is-read-only-mode="isReadOnlyMode"
      @connect="handleConnectFromHeader"
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
            </div>
            <button @click="showChainSelector = false" class="btn btn-outline" style="margin-top: 1rem;">
              Back
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
            class="item-card"
          >
            <div class="item-image">
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
import { encode, BencodexDictionary } from '@planetarium/bencodex'

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
  }>
  statModels: Array<{
    value: number
    type: number
    additional: boolean
  }>
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
const readOnlyChain = ref<'heimdall' | 'odin' | null>(null)

const items = ref<ItemProduct[]>([])
const loading = ref(false)
const itemDataLoading = ref(false)
const error = ref('')
const currentPage = ref(1)
const itemsPerPage = 28

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

const currentNetworkKey = computed<'odin' | 'heimdall'>(() => {
  if (isReadOnlyMode.value) {
    // In read-only mode, use the reactive readOnlyChain ref
    return readOnlyChain.value || 'heimdall'
  }
  const n = (walletData.value.currentNetworkName || '').toLowerCase()
  return n.includes('heimdall') ? 'heimdall' : 'odin'
})

const currentReadOnlyChain = computed<'heimdall' | 'odin' | null>(() => {
  if (isReadOnlyMode.value) {
    return readOnlyChain.value
  }
  return null
})

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
      // ignore
    }
  } else if (storedReadOnlyChain) {
    // User is in read-only mode
    isReadOnlyMode.value = true
    const chain = (storedReadOnlyChain === 'heimdall' || storedReadOnlyChain === 'odin') ? storedReadOnlyChain : 'heimdall'
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
    loadItems()
  }
})

function loadWalletData() {
  const stored = sessionStorage.getItem('walletData')
  if (stored) {
    const data = JSON.parse(stored)
    walletData.value = {
      walletAddress: data.walletAddress || '',
      walletBalance: data.walletBalance || '',
      currentNetworkName: data.currentNetworkName || ''
    }
  }
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
    console.log('Connect result:', accounts)
    
    if (accounts && accounts.length > 0) {
      const walletAddress = accounts[0]
      
      // Get network and balance
      const currentNetwork = await wallet.getCurrentNetwork()
      let chainName: string
      
      if (currentNetwork.id === '0x000000000001') {
        chainName = 'Heimdall'
      } else if (currentNetwork.id === '0x000000000000') {
        chainName = 'Odin'
      } else {
        chainName = 'Unknown'
      }
      
      // Get balance
      let walletBalance = '-'
      try {
        const endpoint = currentNetwork.id === '0x000000000001' 
          ? 'https://heimdall-rpc-1.nine-chronicles.com/graphql'
          : 'https://odin-rpc-1.nine-chronicles.com/graphql'
        
        const query = `
          query($addr: Address!) {
            stateQuery {
              agent(address: $addr) {
                gold
              }
            }
          }
        `
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, variables: { addr: walletAddress } })
        })
        
        const data = await response.json()
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

function selectReadOnlyChain(chain: 'heimdall' | 'odin') {
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
  
  // Load items for the selected chain
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

async function refreshNetworkFromChrono() {
  if (!walletInstance.value) return
  try {
    const net = await walletInstance.value.getCurrentNetwork()
    if (net && net.id) {
      const name = net.id === '0x000000000001' ? 'Heimdall' : (net.id === '0x000000000000' ? 'Odin' : walletData.value.currentNetworkName)
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
  } catch (_) { /* noop */ }
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

    // Build a minimal valid Bencodex dictionary for action: { type_id: 'buy_product', values: { product_id: '<uuid>' } }
    const dict = new BencodexDictionary([
      ['type_id', 'buy_product'],
      ['values', new BencodexDictionary([
        ['product_id', String(item.productId)],
      ])],
    ])
    const encoded = encode(dict)
    const bytesToHex = (u8: Uint8Array) => Array.from(u8).map(b => b.toString(16).padStart(2, '0')).join('')
    const actionHex = bytesToHex(encoded)

    console.log('[Buy] Signing BuyProduct payload (Method 1):', {
      productId: item.productId,
      price: item.price,
      itemId: item.itemId,
      hexLength: actionHex.length
    })

    // Method 1: signWithPlainValue(signer, hex)
    const signed = await walletInstance.value.signWithPlainValue(
      walletData.value.walletAddress,
      actionHex
    )

    console.log('[Buy] Signed payload result:', signed)
    alert('Signed BuyProduct payload (not submitted). Check console for details.')
  } catch (err: any) {
    console.error('Failed to sign BuyProduct action:', err)
    alert(`Signing failed: ${err?.message || err}`)
  }
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
      : 'https://api.9capi.com/marketHistoryOdin'
    const resp = await fetch(historyPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ itemGUID: historyForProductId.value })
    })
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
    const skillPromises = item.skillModels.map(async (skill) => {
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
    let iconIdsParam = ''
    if (searchQuery.value && searchQuery.value.trim()) {
      const iconIds = await findIconIdsByName(searchQuery.value)
      if (iconIds.length > 0) {
        iconIdsParam = iconIds.map(id => `&iconIds=${encodeURIComponent(String(id))}`).join('')
      } else {
        // If no match, return early with empty items to avoid fetching unrelated results
        items.value = []
        loading.value = false
        return
      }
    }
    const networkProvider = currentNetworkKey.value === 'heimdall' ? 'Heimdall' : 'Odin'
    let elementalTypeParam = ''
    if (selectedElementalType.value !== null) {
      elementalTypeParam = `&elementalType=${selectedElementalType.value}`
    }
    const url = `https://api.9capi.com/marketProvider${networkProvider}/Market/products/items/${selectedCategory.value}?limit=${itemsPerPage}&offset=${offset}&order=${selectedOrder.value}${iconIdsParam}${elementalTypeParam}`
    
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

  // Reset search when changing equipment tab
  if (searchDebounce) {
    clearTimeout(searchDebounce)
    searchDebounce = null
  }
  searchQuery.value = ''

  // Clear old data before loading new category
  clearItemData()
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
async function fetchAvatarName(address: string, network: 'odin' | 'heimdall'): Promise<string | null> {
  const endpoint = network === 'heimdall'
    ? 'https://heimdall-rpc-1.nine-chronicles.com/graphql'
    : 'https://odin-rpc-1.nine-chronicles.com/graphql'
  try {
    // 1) Try avatar by avatarAddress
    const qAvatar = `
      query($addr: Address!) {
        stateQuery { avatar(avatarAddress: $addr) { name } }
      }
    `
    let resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: qAvatar, variables: { addr: address } })
    })
    if (resp.ok) {
      const data = await resp.json()
      const name = data?.data?.stateQuery?.avatar?.name
      if (typeof name === 'string' && name.trim()) return name
    }

    // 2) Fallback: treat as agent address and get first avatar name
    const qAgent = `
      query($addr: Address!) {
        stateQuery { agent(address: $addr) { avatarStates { name } } }
      }
    `
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: qAgent, variables: { addr: address } })
    })
    if (!resp.ok) return null
    const data2 = await resp.json()
    const avatars: Array<{ name: string }> = data2?.data?.stateQuery?.agent?.avatarStates || []
    const candidate = avatars.find(a => a && typeof a.name === 'string' && a.name.trim())
    return candidate?.name || null
  } catch (_) {
    return null
  }
}

async function preloadAvatarNames(rows: HistoryRecord[], network: 'odin' | 'heimdall') {
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
.market-page {
  min-height: 100vh;
  background: #0a0e27;
  color: #e2e8f0;
}

.market-content {
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #2d3748;
}

.market-header h1 {
  color: #e2e8f0;
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.category-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #1a1f3a;
  border-radius: 8px;
  flex-wrap: wrap;
  border: 1px solid #2d3748;
}

.category-btn {
  background: #252b42;
  border: 2px solid #3d4757;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #cbd5e0;
}

.category-btn:hover {
  background: #2d3748;
  border-color: #6366f1;
  color: #e2e8f0;
  transform: translateY(-1px);
}

.category-btn.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.elemental-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: #1a1f3a;
  border-radius: 8px;
  flex-wrap: wrap;
  border: 1px solid #2d3748;
}

.elemental-selector label {
  font-weight: 600;
  color: #cbd5e0;
  font-size: 0.9rem;
  white-space: nowrap;
}

.elemental-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.elemental-btn {
  background: #252b42;
  border: 2px solid #3d4757;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #cbd5e0;
  white-space: nowrap;
}

.elemental-btn:hover {
  background: #2d3748;
  border-color: #6366f1;
  color: #e2e8f0;
}

.elemental-btn.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.ordering-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: #1a1f3a;
  border-radius: 8px;
  flex-wrap: wrap;
  border: 1px solid #2d3748;
}

.ordering-selector label {
  font-weight: 600;
  color: #cbd5e0;
  font-size: 0.9rem;
  white-space: nowrap;
}

.order-select {
  background: #252b42;
  border: 2px solid #3d4757;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #e2e8f0;
  min-width: 200px;
}

.order-select:hover {
  border-color: #6366f1;
}

.order-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.search-box {
  flex: 1 1 280px;
  display: flex;
  justify-content: flex-end;
}

.search-input {
  width: 100%;
  max-width: 280px;
  background: #252b42;
  border: 2px solid #3d4757;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #e2e8f0;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.search-input::placeholder {
  color: #94a3b8;
}

.market-stats {
  display: flex;
  gap: 2rem;
  color: #94a3b8;
}

.stat {
  font-size: 0.9rem;
}

.loading {
  text-align: center;
  padding: 4rem 0;
  color: #cbd5e0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #2d3748;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 4rem 0;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error h3 {
  color: #ef4444;
  margin: 0 0 1rem 0;
}

.error p {
  color: #94a3b8;
  margin: 0 0 2rem 0;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.25rem;
  margin-bottom: 3rem;
}

.item-card {
  background: #1a1f3a;
  border: 1px solid #2d3748;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  border-color: #6366f1;
}

.item-image {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  height: 120px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
}

.item-icon {
  width: 100%;
  height: 100%;
  object-fit: scale-down;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.item-grade {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.grade-5 { background: rgba(255, 215, 0, 0.9); color: #333; }
.grade-6 { background: rgba(255, 165, 0, 0.9); color: #333; }
.grade-7 { background: rgba(255, 20, 147, 0.9); color: white; }

.item-level {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.item-info {
  padding: 0.75rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  color: #e2e8f0;
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
}

    .product-id {
      font-size: 0.75rem;
      color: #94a3b8;
      word-break: break-all;
    }

.seller-line {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #94a3b8;
}
.seller-label { color: #94a3b8; }
.seller-name { font-weight: 600; color: #cbd5e0; }

.item-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.item-rating {
  display: flex;
  gap: 0.25rem;
}

.star {
  font-size: 1rem;
  line-height: 1;
}

.star-yellow {
  color: #ffc107;
  filter: drop-shadow(0 0 2px rgba(255, 193, 7, 0.3));
}

.star-purple {
  color: #6f42c1;
  filter: drop-shadow(0 0 2px rgba(111, 66, 193, 0.3));
}


.item-stats {
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.9rem;
}

.stat-value {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.9rem;
}

.item-stat-models {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #2d3748;
}

.stat-model {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.stat-model-label {
  color: #cbd5e0;
  font-weight: 500;
}

.additional-indicator {
  color: #10b981;
  font-weight: 700;
  margin-left: 0.25rem;
}

.stat-model-value {
  color: #e2e8f0;
  font-weight: 600;
}

    .stat-quality {
      margin-left: 0.35rem;
      color: #8b5cf6;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .stat-quality.unavailable {
      color: #64748b;
      font-weight: 500;
    }

.item-skills {
  margin-bottom: 1rem;
  flex-grow: 1;
}

.no-skills {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
}

.no-skills-text {
  color: #64748b;
  font-style: italic;
  font-size: 0.85rem;
}

.skill {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.8rem;
  color: #cbd5e0;
}

.skill-name {
  font-weight: 500;
  cursor: help;
  border-bottom: 1px dotted #64748b;
}

.skill-name:hover {
  color: #8b5cf6;
}

.skill-power {
  color: #8b5cf6;
  font-weight: 600;
}

.item-price {
  background: #252b42;
  padding: 0.75rem;
  border-top: 1px solid #2d3748;
}

.price-main {
  display: flex;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.price-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #10b981;
}

.price-currency {
  margin-left: 0.5rem;
  color: #94a3b8;
  font-weight: 500;
}

.price-details {
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.crystal-price {
  margin-bottom: 0.25rem;
}

.crystal-per-price {
  font-style: italic;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-outline {
  background: #252b42;
  border: 1px solid #3d4757;
  color: #cbd5e0;
}

.btn-outline:hover:not(:disabled) {
  background: #2d3748;
  border-color: #6366f1;
  color: #e2e8f0;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


.btn-buy {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-buy:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.loading-name {
  color: #64748b;
  font-style: italic;
  font-size: 0.9em;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-top: 1px solid #2d3748;
  gap: 1rem;
}

.pagination.top {
  padding: 1rem 0 0.5rem 0;
  border-top: none;
  border-bottom: 1px solid #2d3748;
  margin-bottom: 1.5rem;
}

.pagination.bottom {
  padding: 2rem 0 1rem 0;
  border-top: 1px solid #2d3748;
  border-bottom: none;
  margin-top: 2rem;
}

/* Login Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.login-modal {
  background: #1a1f3a;
  border: 1px solid #2d3748;
  border-radius: 12px;
  width: min(500px, 90vw);
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.login-modal .modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #2d3748;
  text-align: center;
}

.login-modal .modal-header h2 {
  margin: 0;
  color: #e2e8f0;
  font-size: 1.5rem;
}

.login-modal .modal-body {
  padding: 2rem;
  text-align: center;
}

.login-modal .modal-body p {
  margin: 0 0 2rem 0;
  color: #cbd5e0;
  font-size: 1rem;
}

.login-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chain-selector h3 {
  margin: 0 0 1rem 0;
  color: #e2e8f0;
  font-size: 1.25rem;
}

.current-chain-hint {
  margin: 0 0 1.5rem 0;
  color: #94a3b8;
  font-size: 0.9rem;
  font-style: italic;
}

.chain-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.chain-options .btn {
  flex: 1;
  min-width: 120px;
}

.login-modal .btn {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
}

.login-modal .btn-secondary {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: white;
}

.login-modal .btn-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.login-modal .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chain-options .btn-active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1a1f3a;
  border: 1px solid #2d3748;
  border-radius: 10px;
  width: min(900px, 92vw);
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.modal-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #2d3748;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title .title-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-title h3 {
  color: #e2e8f0;
  margin: 0;
}

.modal-title .subtitle {
  margin-top: 0.25rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-title .subtitle .name {
  font-weight: 600;
  color: #e2e8f0;
}

.badge {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.grade {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.3);
}

.divider { opacity: 0.5; color: #64748b; }

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #cbd5e0;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #e2e8f0;
}

.modal-body {
  padding: 1rem;
  overflow: auto;
}

.modal-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #2d3748;
}

.history-table-wrapper {
  overflow: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #2d3748;
  text-align: left;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.history-table tbody tr:nth-child(odd) {
  background: #252b42;
}

.history-table tbody tr:hover {
  background: #2d3748;
}

.history-table thead th {
  background: #1a1f3a;
  position: sticky;
  top: 0;
  z-index: 1;
  color: #cbd5e0;
  font-weight: 600;
  border-bottom: 2px solid #3d4757;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.85rem;
}

.small { font-size: 0.75rem; color: #94a3b8; }

.avatar-cell { display: flex; flex-direction: column; gap: 0.1rem; }

.avatar-name { font-weight: 600; color: #e2e8f0; }

.avatar-addr { color: #94a3b8; }

.page-info {
  color: #94a3b8;
  font-weight: 500;
  font-size: 0.95rem;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Smaller pagination buttons */
.pagination .btn-outline {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
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
  .ordering-selector {
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
