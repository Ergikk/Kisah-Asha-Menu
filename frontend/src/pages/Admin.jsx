import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMenu, saveItem, deleteItem } from '../api/client.js'

export default function Admin() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState(null)
  const [selected, setSelected] = useState({ sectionId: '', categoryId: '' })
  const [form, setForm] = useState({ 
    id: '', name: '', price: '', descriptionId: '', descriptionEn: '', image: ''
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [status, setStatus] = useState('')
  const [editingItem, setEditingItem] = useState(null)  // NEW: Edit mode

  // Auth check (unchanged)
  useEffect(() => {
    const token = localStorage.getItem('asha_admin_token')
    if (!token || parseInt(token.split('_')[2]) < Date.now() - 24*60*60*1000) {
      localStorage.removeItem('asha_admin_token')
      navigate('/admin-login')
      return
    }
  }, [navigate])

  useEffect(() => {
    getMenu().then(setMenu).catch(console.error)
  }, [])

  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch('http://localhost:4000/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    return data.image
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selected.sectionId || !selected.categoryId) return setStatus('❌ Select section/category first')

    setStatus('⏳ Saving...')
    try {
      let finalItem = {
        ...form,
        id: form.id || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        price: Number(form.price),
        isAvailable: true,
        sortOrder: 1
      }

      if (imageFile) {
        finalItem.image = await uploadImage(imageFile)
      }

      await saveItem(selected.sectionId, selected.categoryId, finalItem)
      setMenu(await getMenu())
      setStatus('✅ Saved successfully!')
      resetForm()
    } catch (error) {
      setStatus('❌ Save failed: ' + error.message)
    }
  }

  const handleEdit = (item) => {  // NEW: Populate form for edit
    setEditingItem(item)
    setForm({
      id: item.id,
      name: item.name,
      price: item.price,
      descriptionId: item.descriptionId || '',
      descriptionEn: item.descriptionEn || '',
      image: item.image || ''
    })
    setImagePreview(item.image ? `http://localhost:4000${item.image}` : null)
  }

  const handleDelete = async (sectionId, categoryId, itemId) => {
    if (!confirm('Delete this item?')) return
    try {
      await deleteItem(sectionId, categoryId, itemId)
      setMenu(await getMenu())
      setStatus('✅ Deleted!')
      resetForm()
    } catch {
      setStatus('❌ Delete failed')
    }
  }

  const resetForm = () => {  // NEW: Clean form
    setForm({ id: '', name: '', price: '', descriptionId: '', descriptionEn: '', image: '' })
    setImagePreview(null)
    setImageFile(null)
    setEditingItem(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  if (!menu) return <div className="animate-pulse mt-20 text-center text-white/70">Loading menu...</div>

  return (
    <div className="w-full max-w-[430px] mx-auto p-4 space-y-6 min-h-screen pb-20">  {/* Mobile-first, matches main */}
      {/* Header (no duplicate - App.jsx handles) */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent text-center mb-2">
          Menu Admin ✨
        </h1>
        <div className="text-sm opacity-75 text-center">
          Selected: <span className="font-mono bg-white/20 px-2 py-1 rounded">
            {selected.sectionId ? menu.sections.find(s => s.id === selected.sectionId)?.name : '—'} / 
            {selected.categoryId ? menu.sections.flatMap(s => s.categories).find(c => c.id === selected.categoryId)?.name : '—'}
          </span>
        </div>
      </div>

      {/* Menu Grid - Mobile single column */}
      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">  {/* Scrollable on small screens */}
        {menu.sections.map(section => (
          <div key={section.id} className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
            <h3 className="font-bold text-lg mb-3 text-white/90">{section.name}</h3>
            {section.categories.map(cat => (
              <div key={cat.id} className="mb-4 p-3 bg-white/10 rounded-xl border border-white/30">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                  <span className="font-semibold text-white">{cat.name}</span>
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => setSelected({ sectionId: section.id, categoryId: cat.id })}
                      className="px-3 py-1.5 bg-blue-500/90 hover:bg-blue-600 text-white text-xs rounded-lg font-medium transition-all backdrop-blur-sm"
                      disabled={selected.sectionId === section.id && selected.categoryId === cat.id}
                    >
                      {selected.sectionId === section.id && selected.categoryId === cat.id ? '✅ Selected' : 'Edit Items'}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm max-h-24 overflow-y-auto">
                  {cat.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {item.image ? (
                          <img src={`http://localhost:4000${item.image}`} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-white/50 flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-500/50 rounded-lg flex items-center justify-center text-xs text-white/80 flex-shrink-0">No img</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-white truncate">{item.name}</div>
                          <div className="text-xs opacity-80">Rp {item.price?.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="px-2 py-1 bg-green-500/90 hover:bg-green-600 text-white text-xs rounded font-medium transition-all"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(section.id, cat.id, item.id)}
                          className="px-2 py-1 bg-red-500/90 hover:bg-red-600 text-white text-xs rounded font-medium transition-all"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {cat.items.length === 0 && (
                    <div className="text-xs opacity-60 text-white/70 text-center py-4 italic">No items yet – select to add</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {menu.sections.length === 0 && (
          <div className="text-center py-12 opacity-50">No menu sections found</div>
        )}
      </div>

      {/* Form - Full width mobile */}
      <form onSubmit={handleSave} className="bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-md p-6 rounded-3xl border-2 border-white/20 space-y-4">
        <h3 className="font-bold text-xl text-center text-white/95">
          {editingItem ? `Edit: ${editingItem.name}` : 'Add New Item'} ✨
        </h3>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-white/90">Menu Photo</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-[#e44b4b] file:to-red-600 file:text-white hover:file:from-red-600 hover:file:to-red-700 cursor-pointer flex-1 w-full text-sm text-white/70 file:transition-all"
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-white/50 shadow-lg flex-shrink-0" />
            )}
          </div>
          {form.image && !imageFile && (
            <div className="mt-2 text-xs opacity-75 text-white/80">
              Current: <a href={`http://localhost:4000${form.image}`} target="_blank" className="underline hover:text-blue-400">View</a>
            </div>
          )}
        </div>

        <input
          className="w-full p-4 rounded-2xl text-black text-lg font-semibold bg-white/95 focus:outline-none focus:ring-4 focus:ring-blue-400/60 shadow-lg"
          placeholder="Item Name (e.g. Chicken Creamy Rosemary)"
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          required
        />
        
        <input
          className="w-full p-4 rounded-2xl text-black text-lg font-semibold bg-white/95 focus:outline-none focus:ring-4 focus:ring-green-400/60 shadow-lg"
          type="number"
          placeholder="Price (36000)"
          value={form.price}
          onChange={e => setForm({...form, price: e.target.value})}
          required
        />
        
        <textarea
          className="w-full p-4 rounded-2xl text-black text-base leading-relaxed bg-white/95 focus:outline-none focus:ring-4 focus:ring-purple-400/60 shadow-lg resize-vertical"
          rows="3"
          placeholder="Description Bahasa Indonesia"
          value={form.descriptionId}
          onChange={e => setForm({...form, descriptionId: e.target.value})}
        />
        
        <textarea
          className="w-full p-4 rounded-2xl text-black text-sm leading-relaxed bg-white/95 focus:outline-none focus:ring-4 focus:ring-indigo-400/60 shadow-lg resize-vertical"
          rows="2"
          placeholder="Description English (optional)"
          value={form.descriptionEn}
          onChange={e => setForm({...form, descriptionEn: e.target.value})}
        />
        
        <div className="flex gap-3 pt-2">
          <button 
            type="submit" 
            className="flex-1 bg-gradient-to-r from-[#e44b4b] to-red-600 text-white font-bold py-4 rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selected.sectionId || !selected.categoryId}
          >
            {editingItem ? 'Update Item' : 'Add New Item'}
          </button>
          {editingItem && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-4 bg-gray-500/80 hover:bg-gray-600 text-white font-semibold text-sm rounded-2xl transition-all shadow-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {status && (
        <div className={`p-4 rounded-2xl text-center font-medium text-sm shadow-lg transition-all ${
          status.includes('✅') ? 'bg-green-500/30 border-2 border-green-500/50 text-green-100' : 
          status.includes('❌') ? 'bg-red-500/30 border-2 border-red-500/50 text-red-100' : 
          'bg-blue-500/30 border-2 border-blue-500/50 text-blue-100'
        }`}>
          {status}
        </div>
      )}
    </div>
  )
}
