'use client'

const REVIEWS = [
  { name: 'Sarah M.', role: 'Printify Seller · Etsy', text: 'These designs sell like crazy on my Etsy shop. High quality and so easy to upload to Printify!', stars: 5, sales: '200+ sales' },
  { name: 'Jake R.', role: 'DTF Printer Owner', text: 'Perfect resolution for DTF printing. My customers always compliment the western collection.', stars: 5, sales: 'DTF Pro' },
  { name: 'Lisa T.', role: 'POD Entrepreneur', text: 'Best design library I\'ve found. New designs weekly keeps my shop fresh and competitive.', stars: 5, sales: '500+ sales' },
  { name: 'Monica K.', role: 'Printful Seller', text: 'Transparent PNG backgrounds work perfectly. No editing needed, just upload and start selling!', stars: 5, sales: 'Top Seller' },
  { name: 'David H.', role: 'TShirt Business Owner', text: 'Bought the Christmas bundle and sold out in 2 weeks. Worth every penny. Will buy again!', stars: 5, sales: '1K+ sales' },
  { name: 'Rachel W.', role: 'Sublimation Printer', text: 'The 300 DPI quality is amazing for sublimation. Colors are vibrant and crisp every time.', stars: 5, sales: 'Sublimation Pro' },
  { name: 'Tom B.', role: 'Etsy Shop Owner', text: 'I was skeptical at first but the commercial license gives me peace of mind. Great investment!', stars: 5, sales: '300+ sales' },
  { name: 'Jennifer L.', role: 'POD Beginner', text: 'As a beginner, these designs helped me launch my store fast. Made my first sale in 3 days!', stars: 5, sales: 'New Seller' },
  { name: 'Chris P.', role: 'Print Shop Owner', text: 'We use Tiklife for our local print shop. Customers love the variety and quality of designs.', stars: 5, sales: 'Local Shop' },
  { name: 'Amanda S.', role: 'Tumbler Maker', text: 'The tumbler wrap designs are exactly what I needed. Perfectly sized and gorgeous colors!', stars: 5, sales: '400+ sales' },
  { name: 'Kevin N.', role: 'Printify + Etsy', text: 'Love the western collection! Every design I upload sells. These are my go-to designs now.', stars: 5, sales: '150+ sales' },
  { name: 'Stephanie O.', role: 'Work From Home Mom', text: 'Started my POD business with these designs. Made $800 my first month. Highly recommend!', stars: 5, sales: '$800 first month' },
]

// Double the array for seamless loop
const DOUBLED = [...REVIEWS, ...REVIEWS]

export default function InfiniteReviews() {
  return (
    <div style={{ overflow: 'hidden', margin: '0 -24px' }}>
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-50%) }
          100% { transform: translateX(0) }
        }
        .scroll-row { display: flex; gap: 16px; width: max-content; }
        .scroll-row-1 { animation: scrollLeft 40s linear infinite; }
        .scroll-row-2 { animation: scrollRight 35s linear infinite; margin-top: 16px; }
        .scroll-row:hover { animation-play-state: paused; }
        .review-card {
          width: 300px; flex-shrink: 0;
          background: white; border-radius: 16px; padding: 22px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
      `}</style>

      {/* Row 1 */}
      <div style={{ padding: '0 24px' }}>
        <div className="scroll-row scroll-row-1">
          {DOUBLED.slice(0, 16).map((r, i) => (
            <div key={i} className="review-card">
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {Array(r.stars).fill(0).map((_, j) => (
                  <span key={j} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#444', marginBottom: 16, fontStyle: 'italic' }}>
                "{r.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `hsl(${(i * 37) % 360}, 60%, 55%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'white',
                }}>{r.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{r.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 20 }}>
                  {r.sales}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 - ngược chiều */}
        <div className="scroll-row scroll-row-2">
          {DOUBLED.slice(4, 20).map((r, i) => (
            <div key={i} className="review-card">
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {Array(r.stars).fill(0).map((_, j) => (
                  <span key={j} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#444', marginBottom: 16, fontStyle: 'italic' }}>
                "{r.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `hsl(${(i * 53 + 120) % 360}, 60%, 55%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'white',
                }}>{r.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{r.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 20 }}>
                  {r.sales}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
