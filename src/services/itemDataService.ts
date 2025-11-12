interface ItemData {
  id: number
  name: string
  description?: string
  grade?: number
  itemType?: number
  itemSubType?: number
  elementalType?: number
}

interface SkillData {
  id: number
  name: string
  description?: string
  elementalType?: number
  skillCategory?: number
  hitCount?: number
  cooldown?: number
  power?: number
  statPowerRatio?: number
  chance?: number
  referencedStatType?: number
  buffs?: string[]
  effects?: string[]
  statBuffs?: Array<{
    statType: number
    value: number
    description: string
  }>
}

interface ElementalType {
  id: number
  name: string
}

// Stat type mapping for better readability
const STAT_TYPES: Record<number, string> = {
  1: 'HP',
  2: 'ATK',
  3: 'DEF',
  5: 'HIT',
  6: 'SPD',

}

export function getStatTypeName(statType: number): string {
  return STAT_TYPES[statType] || `Stat ${statType}`
}

function resolveStatTypeId(input: unknown): number | null {
  if (input === undefined || input === null) return null
  // Numeric already
  const asNum = typeof input === 'number' ? input : Number.parseInt(String(input))
  if (!Number.isNaN(asNum)) return asNum

  const raw = String(input).trim().toUpperCase()

  const map: Record<string, number> = {
    'HP': 1,
    'HITPOINTS': 1,
    'ATK': 2,
    'ATTACK': 2,
    'DEF': 3,
    'DEFENSE': 3,
    'HIT': 5,
    'ACCURACY': 5,
    'SPD': 6,
    'SPEED': 6,
  }
  return map[raw] ?? null
}

// Cache for loaded data
let itemDataCache: Map<number, ItemData> | null = null
let skillDataCache: Map<number, SkillData> | null = null
let elementalTypeCache: Map<number, ElementalType> | null = null
// Enhancement growth by grade/level
let enhancementGrowthCache: Map<string, { baseMin: number; baseMax: number; extraMin: number; extraMax: number }> | null = null
// Equipment base stat (from EquipmentItemSheet)
let equipmentBaseStatCache: Map<number, { typeId: number; value: number }> | null = null
// Option details keyed by optionId
let equipmentOptionDetailCache: Map<number, { statType: number; min: number; max: number }> | null = null
// ItemId -> possible subRecipeIds
let equipmentRecipeCache: Map<number, number[]> | null = null
// subRecipeId -> option ids mapping
let equipmentSubRecipeCache: Map<number, { option1?: number; option2?: number; option3?: number; option4?: number }> | null = null

// Elemental types mapping (based on common game patterns)
const ELEMENTAL_TYPES: ElementalType[] = [
  { id: 0, name: 'None' },
  { id: 1, name: 'Fire' },
  { id: 2, name: 'Water' },
  { id: 3, name: 'Earth' },
  { id: 4, name: 'Wind' },
  { id: 5, name: 'Light' },
  { id: 6, name: 'Dark' }
]

// Function to parse CSV content
function parseCSV(csvContent: string): any[] {
  console.log('Raw CSV content preview:', csvContent.substring(0, 500))
  
  const lines = csvContent.split('\n').filter(line => line.trim())
  console.log('Total lines:', lines.length)
  console.log('First few lines:', lines.slice(0, 3))
  
  if (lines.length === 0) {
    console.warn('No lines found in CSV')
    return []
  }
  
  // Handle different CSV formats - try both comma and tab separated
  const firstLine = lines[0].replace(/^\uFEFF/, '') // strip BOM if present
  const isTabSeparated = firstLine.includes('\t')
  const separator = isTabSeparated ? '\t' : ','
  
  console.log('Using separator:', separator === '\t' ? 'TAB' : 'COMMA')
  
  const headers = firstLine.split(separator).map(h => h.trim().replace(/"/g, ''))
  console.log('Headers:', headers)
  
  return lines.slice(1).map((line, index) => {
    if (!line.trim()) return null
    
    const values = line.split(separator).map(v => v.trim().replace(/"/g, ''))
    const obj: any = {}
    
    headers.forEach((header, headerIndex) => {
      obj[header] = values[headerIndex] || ''
    })
    
    // Log first few items for debugging
    if (index < 3) {
      console.log(`Item ${index + 1}:`, obj)
    }
    
    return obj
  }).filter(Boolean)
}


async function fetchCSVFromGitHub(filePath: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/planetarium/lib9c/development/Lib9c/TableCSV/${filePath}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    console.error(`Error fetching ${filePath}:`, error)
    throw error
  }
}

async function fetchCSVFromNineChronicles(filePath: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/planetarium/NineChronicles/development/${filePath}`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    console.error(`Error fetching ${filePath}:`, error)
    throw error
  }
}

async function loadEquipmentBaseStats(): Promise<Map<number, { typeId: number; value: number }>> {
  if (equipmentBaseStatCache) return equipmentBaseStatCache
  try {
    const csvContent = await fetchCSVFromGitHub('EquipmentItemSheet.csv')
    const rows = parseCSV(csvContent)
    const map = new Map<number, { typeId: number; value: number }>()
    rows.forEach((row: any) => {
      const id = parseInt(row.id || row.ID)
      if (Number.isNaN(id)) return
      const typeName = String(row.stat_type || row.StatType || row.STAT_TYPE || '').trim()
      const typeId = resolveStatTypeId(typeName) ?? null
      const value = parseInt(row.stat_value || row.StatValue || row.STAT_VALUE)
      if (typeId && !Number.isNaN(value)) {
        map.set(id, { typeId, value })
      }
    })
    equipmentBaseStatCache = map
    return map
  } catch (e) {
    console.error('Failed to load equipment base stats:', e)
    equipmentBaseStatCache = new Map()
    return equipmentBaseStatCache
  }
}

async function loadEnhancementGrowth(): Promise<Map<string, { baseMin: number; baseMax: number; extraMin: number; extraMax: number }>> {
  if (enhancementGrowthCache) return enhancementGrowthCache
  try {
    console.log('Loading enhancement growth from Lib9c CSV...')
    const csv = await fetchCSVFromGitHub('EnhancementCostSheetV3.csv')
    const rows = parseCSV(csv)
    const map = new Map<string, { baseMin: number; baseMax: number; extraMin: number; extraMax: number }>()
    rows.forEach((row: any) => {
      const grade = parseInt(row.grade || row.Grade || row.GRADE)
      const level = parseInt(row.level || row.Level || row.LEVEL)
      const baseMin = parseInt(row.base_stat_growth_min || row.baseMin || row.base_min || row.BASE_MIN || row.base_stat_min || row.base_stat_growth_Min)
      const baseMax = parseInt(row.base_stat_growth_max || row.baseMax || row.base_max || row.BASE_MAX || row.base_stat_max || row.base_stat_growth_Max)
      const extraMin = parseInt(row.extra_stat_growth_min || row.extraMin || row.extra_min || row.EXTRA_MIN || row.extra_stat_min)
      const extraMax = parseInt(row.extra_stat_growth_max || row.extraMax || row.extra_max || row.EXTRA_MAX || row.extra_stat_max)
      if (Number.isNaN(grade) || Number.isNaN(level)) return
      const key = `${grade}:${level}`
      map.set(key, {
        baseMin: Number.isNaN(baseMin) ? 0 : baseMin,
        baseMax: Number.isNaN(baseMax) ? 0 : baseMax,
        extraMin: Number.isNaN(extraMin) ? 0 : extraMin,
        extraMax: Number.isNaN(extraMax) ? 0 : extraMax,
      })
    })
    enhancementGrowthCache = map
    console.log(`Loaded ${map.size} enhancement growth rows`)
    return map
  } catch (e) {
    console.error('Failed to load enhancement growth:', e)
    enhancementGrowthCache = new Map()
    return enhancementGrowthCache
  }
}

async function loadEquipmentItems(): Promise<Map<number, ItemData>> {
  if (itemDataCache) {
    return itemDataCache
  }

  try {
    console.log('Loading equipment items from Lib9c CSV...')
    const csvContent = await fetchCSVFromGitHub('EquipmentItemSheet.csv')
    const items = parseCSV(csvContent)
    
    console.log('Parsed items count:', items.length)
    
    const itemMap = new Map<number, ItemData>()
    
    items.forEach((item: any, index: number) => {
      // Try different possible ID field names
      const idValue = item.Id || item.id || item.ID || item.ItemId || item.itemId
      const id = parseInt(idValue)
      
      if (!isNaN(id)) {
        // Try different possible name field names (including _name with underscore)
        const name = item.Name || item.name || item.NAME || item._name || item.ItemName || item.itemName || `Item ${id}`
        
        itemMap.set(id, {
          id,
          name,
          description: item.Description || item.description || item.DESC,
          grade: parseInt(item.Grade || item.grade || item.GRADE) || undefined,
          itemType: parseInt(item.ItemType || item.itemType || item.ITEM_TYPE) || undefined,
          itemSubType: parseInt(item.ItemSubType || item.itemSubType || item.ITEM_SUB_TYPE) || undefined,
          elementalType: parseInt(item.ElementalType || item.elementalType || item.ELEMENTAL_TYPE) || undefined
        })
        
        // Log first few successful mappings
        if (index < 5) {
          console.log(`Mapped item ${id}: "${name}"`)
        }
      } else {
        console.warn('Could not parse ID for item:', item)
      }
    })
    
    itemDataCache = itemMap
    console.log(`Successfully loaded ${itemMap.size} equipment items`)
    
    return itemMap
  } catch (error) {
    console.error('Failed to load equipment items:', error)
    // Return empty map as fallback
    itemDataCache = new Map()
    return itemDataCache
  }
}

// Load skill data from multiple CSV files
async function loadSkills(): Promise<Map<number, SkillData>> {
  if (skillDataCache) {
    return skillDataCache
  }

  try {
    console.log('Loading skills from Lib9c CSV files...')
    
    // Load from all related CSV files
    const [skillSheetData, skillBuffData, skillActionBuffData, statBuffData, skillNameCsv] = await Promise.all([
      fetchCSVFromGitHub('SkillSheet.csv').catch(() => ''),
      fetchCSVFromGitHub('SkillBuffSheet.csv').catch(() => ''),
      fetchCSVFromGitHub('SkillActionBuffSheet.csv').catch(() => ''),
      fetchCSVFromGitHub('StatBuffSheet.csv').catch(() => ''),
      // English names for skills (NineChronicles localization)
      fetchCSVFromNineChronicles('nekoyume/Assets/StreamingAssets/Localization/skill_name.csv').catch(() => ''),
    ])
    
    const skillMap = new Map<number, SkillData>()
    
    // Parse main skill sheet
    if (skillSheetData) {
      const skills = parseCSV(skillSheetData)
      console.log('Parsed skills count:', skills.length)
      
      skills.forEach((skill: any, index: number) => {
          const idValue = skill.Id || skill.id || skill.ID || skill.SkillId || skill.skillId || skill.SkillID || skill.KEY || skill.Key
        const id = parseInt(idValue)
        
        if (!isNaN(id)) {
              const name = skill._name || skill.Name || skill.name || skill.NAME || skill.SkillName || skill.skillName || skill.Name_en || skill.LocalizedName || `Skill ${id}`
          
          skillMap.set(id, {
            id,
            name,
                description: skill.Description || skill.description || skill.DESC || skill.LocalizedDescription || skill.Description_en,
                elementalType: parseInt(skill.ElementalType || skill.elementalType || skill.ELEMENTAL_TYPE) || undefined,
                skillCategory: parseInt(skill.SkillCategory || skill.skillCategory || skill.SKILL_CATEGORY) || undefined,
                hitCount: parseInt(skill.HitCount || skill.hitCount || skill.HIT_COUNT || skill['hit_count']) || undefined,
                cooldown: parseInt(skill.Cooldown || skill.cooldown || skill.COOLDOWN || skill['cooldown']) || undefined,
                power: parseInt(skill.Power || skill.power || skill.POWER) || undefined,
                statPowerRatio: parseInt(skill.StatPowerRatio || skill.statPowerRatio || skill.STAT_POWER_RATIO) || undefined,
                chance: parseInt(skill.Chance || skill.chance || skill.CHANCE) || undefined,
                referencedStatType: parseInt(skill.ReferencedStatType || skill.referencedStatType || skill.REFERENCED_STAT_TYPE) || undefined,
            buffs: [],
            effects: [],
            statBuffs: []
          })
          
          // Log first few successful mappings
          if (index < 5) {
            console.log(`Mapped skill ${id}: "${name}"`)
          }
        } else {
          console.warn('Could not parse ID for skill:', skill)
        }
      })
    }

    // Override names with English names from skill_name.csv (key-based rows)
    if (skillNameCsv) {
      const lines = skillNameCsv.split('\n').filter(l => l.trim())
      console.log('Parsed skill_name.csv lines:', lines.length)
      lines.forEach(line => {
        const cols = line.split(',')
        if (cols.length < 2) return
        const key = cols[0].trim().replace(/"/g, '')
        // Column 1 (index 1) is English
        const enName = cols[1].trim().replace(/"/g, '')
        const m = key.match(/^SKILL_NAME_(\d+)$/)
        if (!m) return
        const id = parseInt(m[1], 10)
        if (Number.isNaN(id) || !enName) return
        const existing = skillMap.get(id)
        if (existing) {
          existing.name = enName
        } else {
          skillMap.set(id, { id, name: enName, buffs: [], effects: [], statBuffs: [] })
        }
      })
    }
    
        // Parse skill buff sheet for additional effects
    if (skillBuffData) {
      const buffs = parseCSV(skillBuffData)
      console.log('Parsed skill buffs count:', buffs.length)
      
      buffs.forEach((buff: any) => {
        const skillId = parseInt(buff.SkillId || buff.skillId || buff.SKILL_ID)
            if (!isNaN(skillId)) {
              let skill = skillMap.get(skillId)
              if (!skill) {
                // Create placeholder if not present in main sheet
                const name = buff.Name || buff.name || buff.NAME || buff.BuffName || buff.buffName || `Skill ${skillId}`
                skill = {
                  id: skillId,
                  name,
                  buffs: [],
                  effects: [],
                  statBuffs: []
                }
                skillMap.set(skillId, skill)
              }
              const buffName = buff.Name || buff.name || buff.NAME || buff.BuffName || buff.buffName
              if (buffName) {
                skill.buffs = skill.buffs || []
                skill.buffs.push(buffName)
              }
            }
      })
    }
    
        // Parse skill action buff sheet for additional effects
    if (skillActionBuffData) {
      const actionBuffs = parseCSV(skillActionBuffData)
      console.log('Parsed skill action buffs count:', actionBuffs.length)
      
      actionBuffs.forEach((actionBuff: any) => {
        const skillId = parseInt(actionBuff.SkillId || actionBuff.skillId || actionBuff.SKILL_ID)
            if (!isNaN(skillId)) {
              let skill = skillMap.get(skillId)
              if (!skill) {
                // Create placeholder if not present in main sheet
                const name = actionBuff.Name || actionBuff.name || actionBuff.NAME || actionBuff.EffectName || actionBuff.effectName || `Skill ${skillId}`
                skill = {
                  id: skillId,
                  name,
                  buffs: [],
                  effects: [],
                  statBuffs: []
                }
                skillMap.set(skillId, skill)
              }
              const effectName = actionBuff.Name || actionBuff.name || actionBuff.NAME || actionBuff.EffectName || actionBuff.effectName
              if (effectName) {
                skill.effects = skill.effects || []
                skill.effects.push(effectName)
              }
            }
      })
    }
    
    // Parse stat buff sheet for stat modifications
    if (statBuffData) {
      const statBuffs = parseCSV(statBuffData)
      console.log('Parsed stat buffs count:', statBuffs.length)
      
      statBuffs.forEach((statBuff: any) => {
        const skillId = parseInt(statBuff.SkillId || statBuff.skillId || statBuff.SKILL_ID)
            if (!isNaN(skillId)) {
              let skill = skillMap.get(skillId)
              if (!skill) {
                // Create placeholder if not present in main sheet
                skill = {
                  id: skillId,
                  name: `Skill ${skillId}`,
                  buffs: [],
                  effects: [],
                  statBuffs: []
                }
                skillMap.set(skillId, skill)
              }
              const statType = parseInt(statBuff.StatType || statBuff.statType || statBuff.STAT_TYPE)
              const value = parseInt(statBuff.Value || statBuff.value || statBuff.VALUE)
              const description = statBuff.Description || statBuff.description || statBuff.DESC || `+${value} ${getStatTypeName(statType)}`
              
              if (!isNaN(statType) && !isNaN(value)) {
                skill.statBuffs = skill.statBuffs || []
                skill.statBuffs.push({
                  statType,
                  value,
                  description
                })
              }
            }
      })
    }
    
    skillDataCache = skillMap
    console.log(`Successfully loaded ${skillMap.size} skills`)
    
    return skillMap
  } catch (error) {
    console.error('Failed to load skills:', error)
    // Return empty map as fallback
    skillDataCache = new Map()
    return skillDataCache
  }
}

// Initialize elemental types cache
function initializeElementalTypes(): Map<number, ElementalType> {
  if (elementalTypeCache) {
    return elementalTypeCache
  }
  
  elementalTypeCache = new Map()
  ELEMENTAL_TYPES.forEach(type => {
    elementalTypeCache!.set(type.id, type)
  })
  
  return elementalTypeCache
}

// No fallbacks: all names should come from CSV

// No fallbacks: all skill names should come from CSV

// Public API functions
export async function getItemName(itemId: number): Promise<string> {
  console.log(`Getting name for item ID: ${itemId}`)
  
  const items = await loadEquipmentItems()
  console.log(`Loaded ${items.size} items from CSV`)
  const item = items.get(itemId)
  console.log(`Item data for ${itemId}:`, item)
  const name = item?.name || `Item ${itemId}`
  console.log(`Item ${itemId} -> "${name}"`)
  return name
}

export async function getItemData(itemId: number): Promise<ItemData | null> {
  const items = await loadEquipmentItems()
  return items.get(itemId) || null
}

export async function getSkillName(skillId: number): Promise<string> {
  console.log(`Getting name for skill ID: ${skillId}`)
  const skills = await loadSkills()
  const skill = skills.get(skillId)
  if (skill && skill.name) {
    console.log(`Skill ${skillId} -> "${skill.name}" (from CSV)`)
    return skill.name
  }

  const name = `Skill ${skillId}`
  console.log(`Skill ${skillId} -> "${name}" (default)`)
  return name
}

export async function getSkillData(skillId: number): Promise<SkillData | null> {
  const skills = await loadSkills()
  return skills.get(skillId) || null
}

// Find icon IDs by (partial, case-insensitive) name match from EquipmentItemSheet
export async function findIconIdsByName(query: string): Promise<number[]> {
  const trimmed = (query || '').trim()
  if (!trimmed) return []

  const items = await loadEquipmentItems()
  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
  const matchesAll = (name: string): boolean => {
    const lower = name.toLowerCase()
    return tokens.every(t => lower.includes(t))
  }

  const results: number[] = []

  // 1) CSV-derived names
  for (const [id, item] of items.entries()) {
    if (item && item.name && matchesAll(item.name)) {
      results.push(id)
    }
  }

  return Array.from(new Set(results))
}

// No fallback descriptions: surface missing data instead

export async function getSkillDescription(skillId: number): Promise<string> {
  console.log(`Getting description for skill ID: ${skillId}`)
  const skill = await getSkillData(skillId)
  if (!skill) {
    console.log(`No skill data found for ${skillId}`)
    return `Skill ${skillId}`
  }
  
  console.log(`Skill data for ${skillId}:`, skill)
  
  let description = skill.name
  if (skill.description) {
    description += ` - ${skill.description}`
  }
  
  // Add skill stats
  const stats = []
  if (skill.power !== undefined && skill.power > 0) {
    stats.push(`Power: ${skill.power}`)
  } else if (skill.statPowerRatio !== undefined && skill.statPowerRatio > 0) {
    stats.push(`Stat Power Ratio: ${skill.statPowerRatio}`)
  }
  if (skill.cooldown !== undefined) stats.push(`Cooldown: ${skill.cooldown}s`)
  if (skill.hitCount !== undefined) stats.push(`Hits: ${skill.hitCount}`)
  if (skill.chance !== undefined) stats.push(`Chance: ${skill.chance}%`)
  
  if (stats.length > 0) {
    description += ` (${stats.join(', ')})`
  }
  
  // Add buffs and effects
  if (skill.buffs && skill.buffs.length > 0) {
    description += ` | Buffs: ${skill.buffs.join(', ')}`
  }
  if (skill.effects && skill.effects.length > 0) {
    description += ` | Effects: ${skill.effects.join(', ')}`
  }
  if (skill.statBuffs && skill.statBuffs.length > 0) {
    description += ` | Stat Mods: ${skill.statBuffs.map(sb => sb.description).join(', ')}`
  }

  console.log(`Final description for ${skillId}: "${description}"`)
  return description
}

export function getElementalTypeName(elementalTypeId: number): string {
  const types = initializeElementalTypes()
  const type = types.get(elementalTypeId)
  return type?.name || 'Unknown'
}

// Load equipment option details sheet (optionId -> statType/min/max)
async function loadEquipmentOptionDetails(): Promise<Map<number, { statType: number; min: number; max: number }>> {
  if (equipmentOptionDetailCache) return equipmentOptionDetailCache
  try {
    console.log('Loading equipment option details from Lib9c CSV...')
    const csvContent = await fetchCSVFromGitHub('EquipmentItemOptionSheet.csv')
    const rows = parseCSV(csvContent)
    console.log('Parsed option detail count:', rows.length)
    const map = new Map<number, { statType: number; min: number; max: number }>()

    rows.forEach((row: any) => {
      // Field aliases inferred (per provided headers: id, stat_type, stat_min, stat_max, ...)
      const optionIdStr = row.OptionId || row.optionId || row.OPTION_ID || row.Id || row.ID || row.id
      const statTypeRaw = row.StatType || row.statType || row.STAT_TYPE || row.stat_type || row.Type || row.type
      const minStr = row.Min || row.min || row.MIN || row.MinValue || row.minValue || row.stat_min
      const maxStr = row.Max || row.max || row.MAX || row.MaxValue || row.maxValue || row.stat_max
      const optionId = parseInt(optionIdStr)
      const statType = resolveStatTypeId(statTypeRaw)
      const min = parseInt(minStr)
      const max = parseInt(maxStr)
      if (Number.isNaN(optionId) || statType === null || Number.isNaN(min) || Number.isNaN(max)) return
      map.set(optionId, { statType, min, max })
      if (String(optionId).startsWith('10174000')) {
        console.log(`[Option] ${optionId} -> type=${statType} min=${min} max=${max}`)
      }
    })

    equipmentOptionDetailCache = map
    console.log(`Loaded ${map.size} option details`)
    return map
  } catch (error) {
    console.error('Failed to load equipment option details:', error)
    equipmentOptionDetailCache = new Map()
    return equipmentOptionDetailCache
  }
}

// Load item -> sub recipes mapping
async function loadEquipmentItemRecipes(): Promise<Map<number, number[]>> {
  if (equipmentRecipeCache) return equipmentRecipeCache
  try {
    console.log('Loading equipment item recipes from Lib9c CSV...')
    const csvContent = await fetchCSVFromGitHub('EquipmentItemRecipeSheet.csv')
    const rows = parseCSV(csvContent)
    const map = new Map<number, number[]>()
    rows.forEach((row: any) => {
      // Per provided headers
      const itemIdStr = row.result_equipment_id || row.ResultEquipmentId || row.resultEquipmentId || row.RESULT_EQUIPMENT_ID
      const s1 = row.sub_recipe_id || row.SubRecipeId || row.SUB_RECIPE_ID
      const s2 = row.sub_recipe_id_2 || row.SubRecipeId2 || row.SUB_RECIPE_ID_2
      const s3 = row.sub_recipe_id_3 || row.SubRecipeId3 || row.SUB_RECIPE_ID_3
      const itemId = parseInt(itemIdStr)
      if (Number.isNaN(itemId)) return
      const subs: number[] = []
      ;[s1, s2, s3].forEach(s => {
        const v = parseInt(s)
        if (!Number.isNaN(v)) subs.push(v)
      })
      if (subs.length > 0) map.set(itemId, subs)
      if (itemId === 10174000) {
        console.log('[Recipe] 10174000 sub recipes:', subs)
      }
    })
    equipmentRecipeCache = map
    console.log(`Loaded ${map.size} recipe entries`)
    return map
  } catch (e) {
    console.error('Failed to load equipment item recipes:', e)
    equipmentRecipeCache = new Map()
    return equipmentRecipeCache
  }
}

// Load sub-recipe -> option ids mapping (V2)
async function loadEquipmentSubRecipes(): Promise<Map<number, { option1?: number; option2?: number; option3?: number; option4?: number }>> {
  if (equipmentSubRecipeCache) return equipmentSubRecipeCache
  try {
    console.log('Loading equipment sub recipes from Lib9c CSV...')
    const csvContent = await fetchCSVFromGitHub('EquipmentItemSubRecipeSheetV2.csv')
    const rows = parseCSV(csvContent)
    const map = new Map<number, { option1?: number; option2?: number; option3?: number; option4?: number }>()
    rows.forEach((row: any) => {
      // Per provided headers
      const idStr = row.ID || row.SubRecipeId || row.sub_recipe_id || row.Id || row.id
      const o1Str = row.option_id || row.OptionId || row.OPTION_ID
      const o2Str = row.option_2_id || row.option_id2 || row.OptionId2 || row.OPTION_ID2
      const o3Str = row.option_3_id || row.option_id3 || row.OptionId3 || row.OPTION_ID3
      const o4Str = row.option_4_id || row.option_id4 || row.OptionId4 || row.OPTION_ID4
      const subId = parseInt(idStr)
      if (Number.isNaN(subId)) return
      const entry: { option1?: number; option2?: number; option3?: number; option4?: number } = {}
      const o1 = parseInt(o1Str); if (!Number.isNaN(o1)) entry.option1 = o1
      const o2 = parseInt(o2Str); if (!Number.isNaN(o2)) entry.option2 = o2
      const o3 = parseInt(o3Str); if (!Number.isNaN(o3)) entry.option3 = o3
      const o4 = parseInt(o4Str); if (!Number.isNaN(o4)) entry.option4 = o4
      map.set(subId, entry)
      if (String(subId).startsWith('10174000')) {
        console.log(`[SubRecipe] ${subId} ->`, entry)
      }
    })
    equipmentSubRecipeCache = map
    console.log(`Loaded ${map.size} sub recipes`)
    return map
  } catch (e) {
    console.error('Failed to load equipment sub recipes:', e)
    equipmentSubRecipeCache = new Map()
    return equipmentSubRecipeCache
  }
}

// Compute stat quality using recipe -> sub-recipe -> option -> min/max
export async function getStatQualityPercentForItemStat(
  itemId: number,
  statType: number,
  value: number,
  statModels: Array<{ value: number; type: number; additional: boolean }>,
  grade: number,
  level: number,
  productId?: string
): Promise<number | null> {
  const [recipes, subRecipes, options, growth, baseStats] = await Promise.all([
    loadEquipmentItemRecipes(),
    loadEquipmentSubRecipes(),
    loadEquipmentOptionDetails(),
    loadEnhancementGrowth(),
    loadEquipmentBaseStats()
  ])
  const candidates = recipes.get(itemId) || []
  if (candidates.length === 0) return null

  // Identify base and additional types in the item
  const additionals = statModels.filter(s => s.additional).map(s => s.type)

  // Score candidates: match on present additional stat types (subset match), prefer most matches, then fewer extras
  let best: { subId: number; matchCount: number; extraCount: number; range: { min: number; max: number } | null } | null = null
  for (const subId of candidates) {
    const entry = subRecipes.get(subId)
    if (!entry) continue
    const expectedTypes: number[] = []
    const collectType = (optId?: number) => {
      if (!optId) return
      const o = options.get(optId)
      if (o) expectedTypes.push(o.statType)
    }
    collectType(entry.option1)
    collectType(entry.option2)
    collectType(entry.option3)
    collectType(entry.option4)
    if (expectedTypes.length === 0) continue

    const presentSet = new Set(additionals)
    const expectedSet = new Set(expectedTypes)
    let matchCount = 0
    presentSet.forEach(t => { if (expectedSet.has(t)) matchCount++ })
    if (matchCount === 0) continue
    const extraCount = expectedTypes.length - matchCount

    // Determine range for the queried stat type (if one of the expected options matches it)
    let range: { min: number; max: number } | null = null
    const assignRange = (optId?: number) => {
      if (range || !optId) return
      const o = options.get(optId)
      if (o && o.statType === statType) range = { min: o.min, max: o.max }
    }
    assignRange(entry.option1)
    assignRange(entry.option2)
    assignRange(entry.option3)
    assignRange(entry.option4)

    if (!best || matchCount > best.matchCount || (matchCount === best.matchCount && extraCount < best.extraCount)) {
      best = { subId, matchCount, extraCount, range }
    }
  }

  if (best) {
    const { subId } = best
    const entry = subRecipes.get(subId)
    if (!entry) return null
    const isAdditional = statModels.some(s => s.additional && s.type === statType)
    // Use only current grade's growth and compound per level
    let multMin = 1
    let multMax = 1
    for (let lv = 1; lv <= Math.max(0, level); lv++) {
      const gRow = growth.get(`${grade}:${lv}`)
      if (!gRow) continue
      const bpsMin = isAdditional ? (gRow.extraMin || 0) : (gRow.baseMin || 0)
      const bpsMax = isAdditional ? (gRow.extraMax || 0) : (gRow.baseMax || 0)
      multMin *= (1 + bpsMin / 10000)
      multMax *= (1 + bpsMax / 10000)
    }
    const scaleMin = multMin
    const scaleMax = multMax

    // Base: scaled base stat_value; Additional: sum option parts
    const parts: Array<{ min: number; max: number }> = []
    const addPart = (optId?: number) => {
      if (!optId) return
      const o = options.get(optId)
      if (!o || o.statType !== statType) return
      parts.push({ min: Math.floor(o.min * scaleMin), max: Math.floor(o.max * scaleMax) })
    }
    if (isAdditional) {
      addPart(entry.option1)
      addPart(entry.option2)
      addPart(entry.option3)
      addPart(entry.option4)
    } else {
      const base = baseStats.get(itemId)
      if (!base || base.typeId !== statType) return null
      parts.push({ min: Math.floor(base.value * scaleMin), max: Math.floor(base.value * scaleMax) })
    }
    if (parts.length === 0) return null
    const sumMin = parts.reduce((acc, r) => acc + r.min, 0)
    const sumMax = parts.reduce((acc, r) => acc + r.max, 0)
    if (sumMax <= sumMin) return null
    const pct = ((value - sumMin) / (sumMax - sumMin)) * 100
    const clamped = Math.max(1, Math.min(100, Math.round(pct)))
    console.log(`[Quality] product=${productId ?? 'n/a'} item=${itemId} sub=${subId} grade=${grade} level=${level} parts=${parts.length} multMin=${scaleMin.toFixed(4)} multMax=${scaleMax.toFixed(4)} statType=${statType} value=${value} min=${sumMin} max=${sumMax} -> ${clamped}%`)
    return clamped
  }

  return null
}

// Infer additional stat type by matching value into option ranges of the best sub-recipe
export async function inferAdditionalStatType(
  itemId: number,
  value: number,
  statModels: Array<{ value: number; type: number; additional: boolean }>
): Promise<number | null> {
  const [recipes, subRecipes, options] = await Promise.all([
    loadEquipmentItemRecipes(),
    loadEquipmentSubRecipes(),
    loadEquipmentOptionDetails()
  ])
  const candidates = recipes.get(itemId) || []
  const additionals = statModels.filter(s => s.additional).map(s => s.type)
  // Score as before
  let bestSub: number | null = null
  let bestMatch = -1
  let bestExtra = Infinity
  for (const subId of candidates) {
    const entry = subRecipes.get(subId)
    if (!entry) continue
    const expectedTypes: number[] = []
    const addType = (optId?: number) => { const o = optId ? options.get(optId) : undefined; if (o) expectedTypes.push(o.statType) }
    addType(entry.option1); addType(entry.option2); addType(entry.option3)
    if (expectedTypes.length === 0) continue
    const presentSet = new Set(additionals)
    const expectedSet = new Set(expectedTypes)
    let matchCount = 0
    presentSet.forEach(t => { if (expectedSet.has(t)) matchCount++ })
    const extraCount = expectedTypes.length - matchCount
    if (matchCount > 0 && (matchCount > bestMatch || (matchCount === bestMatch && extraCount < bestExtra))) {
      bestMatch = matchCount
      bestExtra = extraCount
      bestSub = subId
    }
  }
  if (bestSub == null) return null
  const entry = subRecipes.get(bestSub)
  if (!entry) return null
  const pickType = (optId?: number): number | null => {
    if (!optId) return null
    const o = options.get(optId)
    if (!o) return null
    if (o.max > o.min && value >= o.min && value <= o.max) return o.statType
    return null
  }
  return pickType(entry.option1) ?? pickType(entry.option2) ?? pickType(entry.option3)
}

// Preload all data
export async function preloadItemData(): Promise<void> {
  try {
    console.log('Preloading item data...')
    await Promise.all([
      loadEquipmentItems(),
      loadSkills(),
      loadEquipmentOptionDetails(),
      loadEquipmentItemRecipes(),
      loadEquipmentSubRecipes()
    ])
    initializeElementalTypes()
    console.log('Item data preloaded successfully')
  } catch (error) {
    console.error('Failed to preload item data:', error)
  }
}

// Clear cache (useful for testing or refreshing data)
export function clearCache(): void {
  itemDataCache = null
  skillDataCache = null
  elementalTypeCache = null
  equipmentOptionDetailCache = null
  equipmentRecipeCache = null
  equipmentSubRecipeCache = null
}
