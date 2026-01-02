import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 4000
const DATA_PATH = path.join(__dirname, 'data', 'menu.json')

// Create data folder if missing
if (!fs.existsSync(path.dirname(DATA_PATH))) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
}

// Multer storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'images')
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname)
    cb(null, uniqueName)
  },
})
const upload = multer({ storage })

app.use(cors())
app.use(express.json())
app.use('/images', express.static(path.join(__dirname, 'public', 'images')))

function readData() {
  if (!fs.existsSync(DATA_PATH)) {
    const defaultData = { sections: [] }
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf8')
  return JSON.parse(raw)
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

app.get('/api/menu', (req, res) => {
  const data = readData()
  res.json(data)
})

app.post('/api/items', upload.single('image'), (req, res) => {
  let { sectionId, categoryId, item: itemData } = req.body
  if (!sectionId || !categoryId || !itemData) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // FIX: itemData might already be an object.
  let item
  try {
    if (typeof itemData === 'string') item = JSON.parse(itemData)
    else item = itemData
  } catch (e) {
    return res.status(400).json({
      error: 'Invalid item format (expected JSON string or object)',
      receivedType: typeof itemData,
    })
  }

  if (req.file) item.image = `/images/${req.file.filename}`

  const data = readData()

  let section = data.sections.find((s) => s.id === sectionId)
  if (!section) {
    section = { id: sectionId, name: sectionId, categories: [] }
    data.sections.push(section)
  }

  let category = section.categories.find((c) => c.id === categoryId)
  if (!category) {
    category = {
      id: categoryId,
      name: categoryId
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      items: [],
    }
    section.categories.push(category)
  }

  const index = category.items.findIndex((i) => i.id === item.id)
  if (index >= 0) category.items[index] = item
  else category.items.push(item)

  writeData(data)
  res.json(item)
})

app.delete('/api/items/:sectionId/:categoryId/:itemId', (req, res) => {
  const { sectionId, categoryId, itemId } = req.params
  const data = readData()

  const section = data.sections.find((s) => s.id === sectionId)
  if (!section) return res.status(404).json({ error: 'Section not found' })

  const category = section.categories.find((c) => c.id === categoryId)
  if (!category) return res.status(404).json({ error: 'Category not found' })

  category.items = category.items.filter((i) => i.id !== itemId)
  writeData(data)
  res.json({ success: true })
})

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ image: `/images/${req.file.filename}` })
})

app.listen(PORT, () => {
  console.log(`Backend: http://localhost:${PORT}`)
})
