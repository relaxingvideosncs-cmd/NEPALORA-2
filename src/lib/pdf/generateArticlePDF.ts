import { jsPDF } from 'jspdf'
import { ArticleJSON, ParagraphBlock, HeadingBlock, ListBlock, QuoteBlock, ImageBlock } from '@/types/article'

export function generateAndDownloadArticlePDF(article: ArticleJSON) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage()
      y = margin + 8
      drawPageHeader()
    }
  }

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(180, 83, 9) // Amber-700
    doc.text('NEPALORA • OFFLINE FIELD GUIDE', margin, 12)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(article.category.toUpperCase(), pageWidth - margin, 12, { align: 'right' })

    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.line(margin, 14, pageWidth - margin, 14)
  }

  // --- 1. COVER / HEADER SECTION ---
  // Top decorative bar
  doc.setFillColor(217, 119, 6) // Amber-600
  doc.rect(margin, y, contentWidth, 3, 'F')
  y += 8

  // Category Tag
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(180, 83, 9)
  doc.text(article.category.toUpperCase(), margin, y)
  y += 6

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(24, 24, 27) // Neutral-900
  const titleLines = doc.splitTextToSize(article.title, contentWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 8 + 2

  // Excerpt Box
  if (article.excerpt) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10.5)
    doc.setTextColor(75, 85, 99) // Neutral-600
    const excerptLines = doc.splitTextToSize(article.excerpt, contentWidth - 8)
    const boxHeight = excerptLines.length * 5.5 + 8

    checkPageBreak(boxHeight)
    doc.setFillColor(254, 243, 199) // Amber-100/50
    doc.setDrawColor(251, 191, 36) // Amber-400
    doc.rect(margin, y, contentWidth, boxHeight, 'FD')

    doc.text(excerptLines, margin + 4, y + 6)
    y += boxHeight + 6
  }

  // Metadata line (Author, Date)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(120, 120, 120)
  const metaText = `Published by ${article.author || 'Soul of Nepal Editorial'} • Offline Field Edition`
  doc.text(metaText, margin, y)
  y += 4

  // Divider
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // --- 2. RENDER CONTENT BLOCKS ---
  const blocks = article.blocks || []

  for (const block of blocks) {
    if (block.type === 'paragraph') {
      const pBlock = block as ParagraphBlock
      const text = pBlock.text || (pBlock.content ? pBlock.content.map((c) => c.text).join('') : '')
      if (!text) continue

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      const lines = doc.splitTextToSize(text, contentWidth)
      const neededHeight = lines.length * 5 + 4

      checkPageBreak(neededHeight)
      doc.text(lines, margin, y)
      y += neededHeight
    } else if (block.type === 'heading') {
      const hBlock = block as HeadingBlock
      const text = hBlock.text || ''
      if (!text) continue

      const isH2 = hBlock.level === 2
      const fontSize = isH2 ? 14 : 12
      const neededHeight = 12

      checkPageBreak(neededHeight + 10)
      y += 4

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(fontSize)
      doc.setTextColor(17, 24, 39)
      const lines = doc.splitTextToSize(text, contentWidth)
      doc.text(lines, margin, y)
      y += lines.length * (isH2 ? 6 : 5) + 3

      if (isH2) {
        doc.setDrawColor(217, 119, 6) // Amber-600
        doc.setLineWidth(0.5)
        doc.line(margin, y - 1, margin + 25, y - 1)
        y += 3
      }
    } else if (block.type === 'list') {
      const lBlock = block as ListBlock
      const items = lBlock.items || []

      for (let i = 0; i < items.length; i++) {
        const itemText = typeof items[i] === 'string' ? (items[i] as string) : (items[i] as any[]).map((c) => c.text).join('')
        const prefix = lBlock.style === 'numbered' ? `${i + 1}. ` : '• '

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(40, 40, 40)

        const lines = doc.splitTextToSize(itemText, contentWidth - 8)
        const neededHeight = lines.length * 4.8 + 2

        checkPageBreak(neededHeight)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(180, 83, 9)
        doc.text(prefix, margin + 2, y)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 40)
        doc.text(lines, margin + 8, y)
        y += neededHeight
      }
      y += 3
    } else if (block.type === 'quote') {
      const qBlock = block as QuoteBlock
      const text = qBlock.text || ''
      if (!text) continue

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.setTextColor(70, 70, 70)

      const lines = doc.splitTextToSize(`"${text}"`, contentWidth - 12)
      const authorText = qBlock.author ? `— ${qBlock.author}` : ''
      const neededHeight = lines.length * 5 + (authorText ? 6 : 0) + 6

      checkPageBreak(neededHeight)

      // Left amber quote bar
      doc.setFillColor(217, 119, 6)
      doc.rect(margin, y - 2, 2, neededHeight, 'F')

      // Subtle background
      doc.setFillColor(254, 252, 232)
      doc.rect(margin + 2, y - 2, contentWidth - 2, neededHeight, 'F')

      doc.text(lines, margin + 6, y + 3)
      if (authorText) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(120, 120, 120)
        doc.text(authorText, margin + 6, y + lines.length * 5 + 3)
      }
      y += neededHeight + 4
    } else if (block.type === 'image') {
      const imgBlock = block as ImageBlock
      const captionText = [imgBlock.caption, imgBlock.credit && `(Photo: ${imgBlock.credit})`].filter(Boolean).join(' ')

      if (captionText) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8.5)
        doc.setTextColor(130, 130, 130)
        const lines = doc.splitTextToSize(`[Photo: ${captionText}]`, contentWidth)
        checkPageBreak(lines.length * 4.5 + 4)
        doc.text(lines, margin, y)
        y += lines.length * 4.5 + 2
      }
    }
  }

  // --- 3. ADD FOOTERS & PAGE NUMBERS TO ALL PAGES ---
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)

    // Bottom divider
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    doc.text('Nepalora • Independent Guides for Travelers & Trekkers • https://nepalora.com', margin, pageHeight - 7)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
  }

  // --- 4. DIRECT DOWNLOAD AS REAL .PDF FILE ---
  const fileName = `${article.slug || 'nepalora-field-guide'}.pdf`
  doc.save(fileName)
}
