import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'

// Simple clean icon - white background with large centered text
const size = 1024
const canvas = createCanvas(size, size)
const ctx = canvas.getContext('2d')

// macOS Big Sur corner radius
const cornerRadius = size * 0.22

// White rounded background
ctx.beginPath()
ctx.moveTo(cornerRadius, 0)
ctx.lineTo(size - cornerRadius, 0)
ctx.arcTo(size, 0, size, cornerRadius, cornerRadius)
ctx.lineTo(size, size - cornerRadius)
ctx.arcTo(size, size, size - cornerRadius, size, cornerRadius)
ctx.lineTo(cornerRadius, size)
ctx.arcTo(0, size, 0, size - cornerRadius, cornerRadius)
ctx.lineTo(0, cornerRadius)
ctx.arcTo(0, 0, cornerRadius, 0, cornerRadius)
ctx.closePath()
ctx.fillStyle = '#FFFFFF'
ctx.fill()

// Draw large centered "{J5}" text
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'

ctx.font = 'bold 480px Arial'
ctx.fillStyle = '#000000'

ctx.fillText('{J5}', size / 2, size / 2)

// Save
const outputPath = path.join(process.cwd(), 'src-tauri', 'icons', 'icon-source.png')
fs.writeFileSync(outputPath, canvas.toBuffer('image/png'))

console.log(`Icon generated: ${outputPath}`)