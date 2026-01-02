const API_URL = 'http://localhost:4000'

export async function getMenu() {
  const res = await fetch(`${API_URL}/api/menu`)
  if (!res.ok) throw new Error('Failed to fetch menu')
  return res.json()
}

export async function saveItem(sectionId, categoryId, item) {
  const res = await fetch(`${API_URL}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionId, categoryId, item }),
  })
  if (!res.ok) throw new Error('Failed to save')
  return res.json()
}

export async function deleteItem(sectionId, categoryId, itemId) {
  const res = await fetch(`${API_URL}/api/items/${sectionId}/${categoryId}/${itemId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
  return res.json()
}
