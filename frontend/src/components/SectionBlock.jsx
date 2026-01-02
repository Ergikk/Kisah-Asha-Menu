import { useState, useMemo } from 'react'
import Modal from './Modal.jsx'
import { RiArrowDownWideLine,RiArrowUpWideLine } from "react-icons/ri";

const SECTION_STYLES = {
  breakfast: {
    cardBg: '#803932',
    headerText: 'text-white',
    subtitleText: 'text-white/80',
    headerImage: '/images/breakfast-bg.png',
  },
  food: {
    cardBg: '#F4F0E7',
    headerText: 'text-black',
    subtitleText: 'text-black/80',
    headerImage: '/images/food-bg.png',
  },
  beverage: {
    cardBg: '#ED473F', 
    headerText: 'text-white',
    subtitleText: 'text-white/80',
    headerImage: '/images/beverage-bg.png',
  },
}

function getSectionStyle(section) {
  return SECTION_STYLES[section.id] || SECTION_STYLES.breakfast
}

export default function SectionBlock({ section }) {
  const [isExpanded, setIsExpanded] = useState(false)  // NEW: Collapsed by default
  const [activeCategoryId, setActiveCategoryId] = useState(section.categories?.[0]?.id || null)
  const [openItem, setOpenItem] = useState(null)

  const categories = section.categories || []
  const activeItems = useMemo(() => {
    const cat = categories.find((c) => c.id === activeCategoryId)
    return cat?.items || []
  }, [categories, activeCategoryId])

  const formatPrice = (price) => (price ? Math.round(price / 1000) + 'K' : '')

  const style = getSectionStyle(section)

  const toggleSection = () => {
    setIsExpanded(!isExpanded)
    if (!isExpanded) setActiveCategoryId(section.categories?.[0]?.id || null)  // Reset on expand
  }

  return (
    <section className="rounded-3xl p-5" style={{ backgroundColor: style.cardBg }}>
      {/* COLLAPSIBLE HEADER - Always visible */}
      <div 
        className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-all duration-200 clicked:scale-[1.01] transition-all duration-200"
        onClick={toggleSection}
      >
        <div
          className="relative h-28"
          style={{
            backgroundImage: `url(${style.headerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <div>
              <h2 className={`text-xl font-bold leading-tight ${style.headerText}`}>
                {section.name}
              </h2>
              {section.subtitle && (
                <p className={`text-xs mt-1 ${style.subtitleText}`}>
                  {section.subtitle}
                </p>
              )}
              {/* Expand indicator */}
              <div className="mt-2 opacity-90 flex items-center justify-center">
                {isExpanded ? <RiArrowUpWideLine /> : <RiArrowDownWideLine />} 
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE CONTENT - Hidden by default */}
      <div className={`overflow-hidden transition-all duration-500 ease-out ${isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'}`}>
        {/* Category tabs - Only when expanded */}
        <div className="space-y-2 mt-4 mb-4 px-2">
          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`w-full rounded-xl py-3 px-4 text-center font-semibold transition-all duration-200 shadow-md ${
                  isActive
                    ? 'bg-[#ED473F] text-white shadow-xl scale-[1.02]'
                    : 'bg-white/10 text-white hover:bg-white/20 hover:text-white/90 shadow-lg hover:shadow-xl'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Items grid - Only when expanded */}
        <div className="flex-1 grid grid-cols-2 gap-3 pt-2">
          {activeItems.length > 0 ? (
            activeItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setOpenItem(item)}
                className="group rounded-2xl bg-[#ead7c6] text-black overflow-hidden border border-black/10 hover:border-black/20 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="h-28 relative overflow-hidden">
                  {item.image ? (
                    <img
                      src={`http://localhost:4000${item.image}`}
                      alt={item.name}
                      className="h-full w-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-300/50 to-gray-400/50 flex items-center justify-center">
                      <span className="text-lg">📸</span>
                    </div>
                  )}
                </div>
                <div className="p-3 pt-2">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#6c3a34] text-white text-xs font-bold mb-2">
                    {formatPrice(item.price)}
                  </div>
                  <div className="text-sm font-semibold leading-tight h-10 flex items-center justify-center">
                    {item.name}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 opacity-60">
              No items yet
            </div>
          )}
        </div>
      </div>

      {/* Modal - unchanged */}
      {openItem && (
        <Modal onClose={() => setOpenItem(null)}>
          <div className="absolute inset-0 h-full w-full">
            {openItem.image ? (
              <img src={`http://localhost:4000${openItem.image}`} alt={openItem.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-gray-300/50 to-gray-400/50 flex items-center justify-center">
                <span className="text-4xl">📸</span>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold mb-3 leading-tight">{openItem.name}</h3>
          {openItem.descriptionId && (
            <p className="text-sm text-gray-800 mb-2 leading-relaxed">
              {openItem.descriptionId}
            </p>
          )}
          {openItem.descriptionEn && (
            <p className="text-xs italic text-gray-600 mb-4">
              {openItem.descriptionEn}
            </p>
          )}
          <div className="flex justify-end mt-auto p-4">
            <div className="bg-[#803932] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
              Rp {openItem.price?.toLocaleString('id-ID') || '36.000'}
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
