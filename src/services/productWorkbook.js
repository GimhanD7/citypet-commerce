const sheets = {
  Products: ['SKU', 'Name', 'Category ID', 'Pet Type', 'Price (LKR)', 'Main Image URL', 'Brand', 'Full Name', 'Original Price (LKR)', 'Stock', 'Reorder Level', 'Stock Location', 'Badge', 'Tag', 'Tags', 'Short Description', 'Description', 'Quote Badge', 'Kibble Text', 'Composition', 'Additives'],
  Variants: ['SKU', 'Size', 'Price (LKR)', 'Stock', 'Default'],
  Gallery: ['SKU', 'URL', 'Type'],
  Benefits: ['SKU', 'Title', 'Description', 'Icon'],
  Feeding: ['SKU', 'Pet Size', 'Guideline', 'Notes'],
  Nutrition: ['SKU', 'Nutrient', 'Value'],
}

const requiredProducts = sheets.Products.slice(0, 5) // SKU, Name, Category ID, Pet Type, Price (LKR)
export const maxProducts = 2000
const normalized = (value) => value.trim().toLowerCase()
const split = (value) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)

const COLUMN_ALIASES = {
  SKU: ['sku', 'product id', 'id', 'item code', 'barcode'],
  Name: ['name', 'product name', 'item name', 'title'],
  'Category ID': ['category id', 'category', 'category_id', 'category slug', 'category name'],
  'Pet Type': ['pet type', 'pet_type', 'pet', 'animal'],
  'Price (LKR)': ['price (lkr)', 'price', 'lkr price', 'unit price', 'selling price'],
  'Main Image URL': ['main image url', 'main image', 'image url', 'image', 'photo url', 'photo', 'picture'],
  Brand: ['brand', 'brand name', 'manufacturer'],
  'Full Name': ['full name', 'fullname'],
  'Original Price (LKR)': ['original price (lkr)', 'original price', 'mrp', 'regular price'],
  Stock: ['stock', 'stock units', 'stock count', 'quantity', 'qty'],
  'Reorder Level': ['reorder level', 'reorder qty', 'min stock'],
  'Stock Location': ['stock location', 'location', 'pharmacy location'],
  Badge: ['badge'],
  Tag: ['tag'],
  Tags: ['tags'],
  'Short Description': ['short description', 'short desc'],
  Description: ['description', 'details'],
}

async function workbook() {
  const { default: ExcelJS } = await import('exceljs')
  return new ExcelJS.Workbook()
}

function addSheet(book, name, headers, rows = []) {
  const sheet = book.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = headers.map((header) => ({ header, width: header.includes('URL') ? 52 : Math.max(18, header.length + 4) }))
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF155E59' } }
  })
  sheet.getRow(1).height = 22
  sheet.addRows(rows)
  return sheet
}

export async function createProductTemplate(categories) {
  const book = await workbook()
  for (const [name, headers] of Object.entries(sheets)) {
    const sheet = addSheet(book, name, headers)
    sheet.getColumn(1).numFmt = '@'
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } }
  }
  addSheet(book, 'Categories', ['Category ID', 'Category name'], categories.map(({ id, name }) => [id, name]))
  const help = addSheet(book, 'Instructions', ['Topic', 'What to enter'], [
    ['Products', 'Enter one row per product. The first five columns are required.'],
    ['SKU', 'Use a unique product ID: letters, numbers, hyphens and underscores. SKUs are saved in lowercase.'],
    ['Category and pet type', 'Copy a Category ID from the Categories tab. Pet Type: dogs, cats, all, fish, small-pets or birds.'],
    ['Images and video', 'Use a public HTTPS URL or CityPet media path. If blank, default hospital product media is assigned.'],
    ['Variants', 'Use the same SKU as on Products. Enter one row per size. Default accepts yes or no (at most one yes per SKU).'],
    ['Inventory', 'Use whole counts. If product stock is blank, stock comes from variants or is zero. When using variants, their total must match product stock.'],
    ['Additional details', 'Use the same SKU on Benefits, Feeding and Nutrition. Use Excel line breaks within Products cells to separate tags and description paragraphs.'],
    ['Import', `Save as .xlsx with up to ${maxProducts} products. Preview, correct any validation errors, then confirm the import.`],
  ])
  help.getColumn(2).width = 105
  help.getColumn(2).alignment = { wrapText: true, vertical: 'middle' }
  for (let row = 2; row <= help.rowCount; row++) help.getRow(row).height = 34
  return book.xlsx.writeBuffer()
}

function cellText(cell, link = false) {
  const value = cell.value
  if (value == null) return ''
  if (typeof value === 'object') {
    if ('formula' in value || 'sharedFormula' in value || 'error' in value || value instanceof Date) {
      throw new Error('use plain text or a number instead of a formula, error or date.')
    }
    if (link && value.hyperlink) return value.hyperlink.trim()
  }
  return cell.text.trim()
}

function readRows(book, name, required, errors) {
  const sheet = book.getWorksheet(name)
  if (!sheet) {
    if (name === 'Products') errors.push('Missing the Products sheet. Use the Excel template.')
    return []
  }
  const indices = new Map()
  sheet.getRow(1).eachCell((cell, column) => {
    const rawHeader = normalized(cell.text || '')
    if (!rawHeader) return
    let field = sheets[name]?.find((item) => normalized(item) === rawHeader)
    if (!field && name === 'Products') {
      for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
        if (sheets[name].includes(canonical) && aliases.some((a) => normalized(a) === rawHeader)) {
          field = canonical
          break
        }
      }
    }
    if (!field) return
    if (!indices.has(field)) {
      indices.set(field, column)
    }
  })
  // If 'Main Image URL' is not found, we will default it automatically in row parsing
  const effectiveRequired = required.filter((field) => field !== 'Main Image URL')
  const missing = effectiveRequired.filter((field) => !indices.has(field))
  if (missing.length) {
    errors.push(name + ': missing columns ' + missing.join(', ') + '.')
    return []
  }
  const rows = []
  if (sheet.actualRowCount > (name === 'Products' ? maxProducts + 1 : 5001)) {
    errors.push(name + ': too many rows for one import.')
    return rows
  }
  sheet.eachRow((row, number) => {
    if (number === 1) return
    try {
      const data = Object.fromEntries([...indices].map(([field, col]) => [field, cellText(row.getCell(col), field.endsWith('URL'))]))
      if (!Object.values(data).some(Boolean)) return
      if (!data['Main Image URL']) {
        data['Main Image URL'] = '/assets/pdp-royal-canin-main.jpg'
      }
      const absent = effectiveRequired.filter((field) => !data[field])
      if (absent.length) throw new Error('missing ' + absent.join(', ') + '.')
      rows.push({ data, number })
    } catch (error) {
      errors.push(name + ' row ' + number + ': ' + error.message)
    }
  })
  return rows
}

function numeric(data, field, { integer = false, optional = false } = {}) {
  const raw = data[field]
  if (!raw && optional) return undefined
  const value = Number(raw)
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw || '') || !Number.isFinite(value) ||
      (integer ? !Number.isSafeInteger(value) || value > 2147483647 : value <= 0 || value > 99999999.99)) {
    throw new Error(field + (integer ? ' must be a non-negative whole number.' : ' must be a positive amount with up to two decimal places.'))
  }
  return value
}

function media(value, type = 'image') {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return '/assets/pdp-royal-canin-main.jpg'
  }
  const trimmed = value.trim()
  let valid = /^\/(?!\/)[^\s\\]+$/.test(trimmed)
  if (/^https?:\/\//i.test(trimmed)) {
    try { valid = Boolean(new URL(trimmed).hostname) && !/\s/.test(trimmed) } catch { valid = false }
  }
  if (!valid) {
    return '/assets/pdp-royal-canin-main.jpg'
  }
  return trimmed
}

const details = {
  Variants: { key: 'sizes', required: ['SKU', 'Size', 'Price (LKR)', 'Stock'], parse: (d) => {
    const flag = normalized(d.Default || '')
    if (!['', 'yes', 'no', 'true', 'false', '1', '0'].includes(flag)) throw new Error('Default must be yes or no.')
    return { size: d.Size, price: numeric(d, 'Price (LKR)'), stockCount: numeric(d, 'Stock', { integer: true }), default: ['yes', 'true', '1'].includes(flag) }
  } },
  Gallery: { key: 'gallery', required: ['SKU', 'URL', 'Type'], parse: (d) => {
    const type = normalized(d.Type)
    if (!['image', 'video'].includes(type)) throw new Error('Type must be image or video.')
    return { type, url: media(d.URL, type) }
  } },
  Benefits: { key: 'keyBenefits', required: ['SKU', 'Title'], parse: (d) => ({ title: d.Title, desc: d.Description || '', icon: d.Icon || 'shield' }) },
  Feeding: { key: 'feedingGuide', required: ['SKU', 'Pet Size', 'Guideline'], parse: (d) => ({ petSize: d['Pet Size'], standardGuideline: d.Guideline, notesActivity: d.Notes || '' }) },
  Nutrition: { key: 'analysis', required: ['SKU', 'Nutrient', 'Value'], parse: (d) => ({ nutrient: d.Nutrient, value: d.Value }) },
}

export async function readProductWorkbook(buffer, categories) {
  const book = await workbook()
  await book.xlsx.load(buffer)
  const errors = []
  const products = new Map()
  const categoryIds = new Set(categories.map(({ id }) => String(id)))
  const rows = readRows(book, 'Products', requiredProducts, errors)
  if (!rows.length && !errors.length) errors.push('Add at least one product to the Products sheet.')
  for (const { data: d, number } of rows) {
    try {
      const id = normalized(d.SKU)
      let petType = normalized(d['Pet Type'] || '')
      if (!petType || !['dogs', 'cats', 'all', 'fish', 'small-pets', 'birds'].includes(petType)) {
        petType = 'dogs'
      }
      if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)) throw new Error('SKU must have up to 80 letters, numbers, hyphens or underscores and begin with a letter or number.')
      
      for (const [field, limit] of Object.entries({ Name: 255, 'Full Name': 255, Brand: 100, Badge: 80, Tag: 80 })) {
        if ([...(d[field] || '')].length > limit) throw new Error(field + ' must have at most ' + limit + ' characters.')
      }

      let catId = normalized(d['Category ID'] || '')
      if (catId === 'food') catId = 'foods'
      if (catId === 'grooming') catId = 'shampoo'
      if (!categoryIds.has(catId)) {
        for (const cat of categories) {
          if (normalized(cat.name) === catId || normalized(cat.id) === catId) {
            catId = cat.id
            break
          }
        }
      }
      if (!categoryIds.has(catId)) catId = 'foods'

      const payload = {
        id,
        name: d.Name,
        category: catId,
        petType,
        price: numeric(d, 'Price (LKR)'),
        originalPrice: numeric(d, 'Original Price (LKR)', { optional: true }),
        mainImage: media(d['Main Image URL']),
        brand: d.Brand || 'City Pet',
        fullName: d['Full Name'] || d.Name,
        stockCount: numeric(d, 'Stock', { integer: true, optional: true }),
        reorderLevel: numeric(d, 'Reorder Level', { integer: true, optional: true }) ?? 5,
        stockLocation: d['Stock Location'] || '',
        badge: d.Badge || null,
        tag: d.Tag || null,
        tags: split(d.Tags || ''),
        shortDescription: d['Short Description'] || '',
        description: split(d.Description || ''),
        quoteBadge: d['Quote Badge'] || '',
        kibbleScript: d['Kibble Text'] || '',
        ingredients: { composition: d.Composition || '', additives: d.Additives || '', analysis: [] },
        sizes: [],
        gallery: [],
        keyBenefits: [],
        feedingGuide: [],
      }
      products.set(id, { number, payload })
    } catch (error) {
      errors.push('Products row ' + number + ': ' + error.message)
    }
  }
  for (const [name, { key, required, parse }] of Object.entries(details)) {
    for (const { data, number } of readRows(book, name, required, errors)) {
      try {
        const product = products.get(normalized(data.SKU))?.payload
        if (!product) throw new Error('SKU does not match a valid Products row.')
        const items = key === 'analysis' ? product.ingredients.analysis : product[key]
        const item = parse(data)
        if (key === 'gallery' && items.length === 4) throw new Error('use at most four gallery items per SKU.')
        if (key === 'sizes' && items.some((variant) => normalized(variant.size) === normalized(item.size))) throw new Error('size is repeated for this SKU.')
        if (key === 'sizes' && item.default && items.some((variant) => variant.default)) throw new Error('only one size can be the default.')
        items.push(item)
      } catch (error) {
        errors.push(name + ' row ' + number + ': ' + error.message)
      }
    }
  }
  for (const { number, payload } of products.values()) {
    const total = payload.sizes.reduce((sum, size) => sum + size.stockCount, 0)
    if (payload.sizes.length && payload.stockCount !== undefined && payload.stockCount !== total) {
      errors.push('Products row ' + number + ': stock does not match the sum of variant stock.')
    }
    if (total > 2147483647) errors.push('Products row ' + number + ': total variant stock is too large.')
    if (payload.sizes.length && !payload.sizes.some((size) => size.default)) payload.sizes[0].default = true
    payload.stockCount ??= total
    payload.inStock = payload.stockCount > 0
  }
  return { rows: [...products.values()], errors }
}

export async function exportProductsToWorkbook(products = [], categories = []) {
  const book = await workbook()

  // 1. Products Sheet (Matches sheets.Products template exactly so it can be re-imported seamlessly)
  const prodHeaders = [
    'SKU',
    'Name',
    'Category ID',
    'Pet Type',
    'Price (LKR)',
    'Main Image URL',
    'Brand',
    'Full Name',
    'Original Price (LKR)',
    'Stock',
    'Reorder Level',
    'Stock Location',
    'Badge',
    'Tag',
    'Tags',
    'Short Description',
    'Description',
    'Quote Badge',
    'Kibble Text',
    'Composition',
    'Additives',
  ]

  const prodRows = products.map((p) => {
    const qty = p.stockCount !== undefined ? Number(p.stockCount) : (p.inStock ? 15 : 0)
    const imgUrl = p.mainImage || (p.imageType && p.imageType.startsWith('http') ? p.imageType : '') || '/assets/pdp-royal-canin-main.jpg'
    const descStr = Array.isArray(p.description) ? p.description.join('\n\n') : (p.description || '')
    const tagsStr = Array.isArray(p.tags) ? p.tags.join('\n') : (p.tags || '')

    return [
      p.id || '',
      p.name || '',
      p.category || 'foods',
      p.petType || 'dogs',
      Number(p.price) || 0,
      imgUrl,
      p.brand || 'City Pet',
      p.fullName || p.name || '',
      p.originalPrice ? Number(p.originalPrice) : '',
      qty,
      p.reorderLevel ?? 5,
      p.stockLocation || 'Colombo 07 Central Pharmacy',
      p.badge || '',
      p.tag || '',
      tagsStr,
      p.shortDescription || '',
      descStr,
      p.quoteBadge || '',
      p.kibbleScript || '',
      p.ingredients?.composition || (typeof p.ingredients === 'string' ? p.ingredients : ''),
      p.ingredients?.additives || '',
    ]
  })

  const prodSheet = addSheet(book, 'Products', prodHeaders, prodRows)
  prodSheet.getColumn(1).numFmt = '@' // SKU as text
  prodSheet.getColumn(5).numFmt = '#,##0.00' // Price (LKR)
  prodSheet.getColumn(9).numFmt = '#,##0.00' // Original Price (LKR)
  prodSheet.getColumn(10).numFmt = '#,##0' // Stock
  prodSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: prodHeaders.length } }

  // 2. Variants Sheet
  const variantHeaders = ['SKU', 'Size', 'Price (LKR)', 'Stock', 'Default']
  const variantRows = []
  products.forEach((p) => {
    if (Array.isArray(p.sizes) && p.sizes.length > 0) {
      p.sizes.forEach((s) => {
        variantRows.push([
          p.id || '',
          s.size || '',
          Number(s.price || p.price) || 0,
          Number(s.stockCount) || 0,
          s.default ? 'yes' : 'no',
        ])
      })
    }
  })
  if (variantRows.length > 0) {
    const varSheet = addSheet(book, 'Variants', variantHeaders, variantRows)
    varSheet.getColumn(1).numFmt = '@'
    varSheet.getColumn(3).numFmt = '#,##0.00'
    varSheet.getColumn(4).numFmt = '#,##0'
    varSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: variantHeaders.length } }
  }

  // 3. Categories Sheet
  if (categories && categories.length > 0) {
    const catList = categories.filter((c) => c.id !== 'all').map((c) => [c.id, c.name])
    addSheet(book, 'Categories', ['Category ID', 'Category name'], catList)
  }

  return book.xlsx.writeBuffer()
}

export async function exportProductsToExcel(products = [], categories = [], filename = '') {
  const dateStr = new Date().toISOString().slice(0, 10)
  const safeFilename = filename || `CityPet_Products_Inventory_${dateStr}.xlsx`
  const buffer = await exportProductsToWorkbook(products, categories)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return safeFilename
}
