// ---------------------------------------------------------------------------
// Analytics export — PDF / PNG / JPEG.
//
// html2canvas and jsPDF are heavy, so they're dynamically imported here and only
// pulled over the wire the first time the user actually exports. The capture
// preserves the dark theme; the PDF gets an on-brand header (logo + title).
// ---------------------------------------------------------------------------

const DARK_BG = '#0c0524'
const HEADER_VIOLET = [29, 1, 77] // #1D014D
const CYAN = [5, 215, 238] // #05D7EE
const SILVER = [225, 225, 225] // #E1E1E1

// Brain-circuit brand mark in solid Neon Cyan, no backdrop, sits on the violet band.
const LOGO_SVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
<path d="M32 12c-4.4-3.2-11-2.6-14.2 1.6-3 .2-5.6 2.3-6.2 5.3-2.8 1.2-4.4 4.2-3.6 7.1-2 2.2-2.3 5.5-.6 8 .1 3.4 2.6 6.3 6 6.9 1.4 3.4 5 5.4 8.6 4.7 2.4 2.6 6.4 3 9.2 1V12Z" stroke="#05D7EE" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M32 12c4.4-3.2 11-2.6 14.2 1.6 3 .2 5.6 2.3 6.2 5.3 2.8 1.2 4.4 4.2 3.6 7.1 2 2.2 2.3 5.5.6 8-.1 3.4-2.6 6.3-6 6.9-1.4 3.4-5 5.4-8.6 4.7-2.4 2.6-6.4 3-9.2 1V12Z" stroke="#05D7EE" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M32 12v40" stroke="#05D7EE" stroke-width="2.4" stroke-linecap="round"/>
<g fill="#05D7EE"><circle cx="19" cy="30" r="2.3"/><circle cx="25" cy="22" r="2.3"/><circle cx="40" cy="26" r="2.3"/><circle cx="44" cy="42" r="2.3"/></g>
</svg>`

function svgToPngDataUrl(svg, size = 96) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = size
      c.height = size
      c.getContext('2d').drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

function triggerDownload(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * @param {object} o
 * @param {'pdf'|'png'|'jpeg'} o.format
 * @param {HTMLElement} o.node     element to capture
 * @param {string} o.location      branch name (filename + PDF subtitle)
 * @param {string} o.date          e.g. "10-Jun-2026"
 */
export async function exportAnalytics({ format, node, location, date }) {
  if (!node) throw new Error('Nothing to export')

  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(node, {
    backgroundColor: DARK_BG,
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
  })

  const safeLoc = location.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')
  const base = `NeuroChain-Analytics-${safeLoc}-${date}`

  if (format === 'png' || format === 'jpeg') {
    const mime = format === 'png' ? 'image/png' : 'image/jpeg'
    const ext = format === 'png' ? 'png' : 'jpg'
    triggerDownload(canvas.toDataURL(mime, 0.95), `${base}.${ext}`)
    return
  }

  // ---- PDF -----------------------------------------------------------------
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  // dark canvas
  pdf.setFillColor(12, 5, 36)
  pdf.rect(0, 0, pageW, pageH, 'F')

  // on-brand header band
  const headerH = 72
  pdf.setFillColor(...HEADER_VIOLET)
  pdf.rect(0, 0, pageW, headerH, 'F')
  // cyan rule under the header
  pdf.setFillColor(...CYAN)
  pdf.rect(0, headerH, pageW, 2, 'F')

  try {
    const logoPng = await svgToPngDataUrl(LOGO_SVG, 96)
    pdf.addImage(logoPng, 'PNG', 28, 17, 38, 38)
  } catch {
    /* logo is decorative — skip if rasterising fails */
  }

  pdf.setTextColor(...CYAN)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('NeuroChain Ai', 78, 33)
  pdf.setTextColor(...SILVER)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.text(`Analytics  ·  ${location}  ·  ${date}`, 78, 51)

  // captured analytics image, fit within margins
  const margin = 24
  const top = headerH + 22
  let drawW = pageW - margin * 2
  let drawH = (canvas.height / canvas.width) * drawW
  const maxH = pageH - top - margin
  if (drawH > maxH) {
    drawH = maxH
    drawW = (canvas.width / canvas.height) * drawH
  }
  const x = (pageW - drawW) / 2
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, top, drawW, drawH)

  pdf.save(`${base}.pdf`)
}
