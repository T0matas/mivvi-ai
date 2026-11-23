// Image service for handling image operations in the app
// Currently using mock/placeholder implementations for offline mode

/**
 * Compress an image file to reduce size
 */
export async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Calculate new dimensions while maintaining aspect ratio
                const maxDimension = 1920
                if (width > height && width > maxDimension) {
                    height = (height * maxDimension) / width
                    width = maxDimension
                } else if (height > maxDimension) {
                    width = (width * maxDimension) / height
                    height = maxDimension
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            })
                            resolve(compressedFile)
                        } else {
                            reject(new Error('Failed to compress image'))
                        }
                    },
                    'image/jpeg',
                    0.8 // Quality
                )
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = e.target?.result as string
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

/**
 * Upload an image and return a URL
 * Currently returns a local blob URL for offline mode
 */
export async function uploadImage(file: File): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
        throw new Error('Image size must be less than 10MB')
    }

    // In offline mode, create a local blob URL
    // In production, this would upload to a server/cloud storage
    const url = URL.createObjectURL(file)
    return url
}

/**
 * Generate an image from a text prompt
 * Currently returns a placeholder for offline mode
 */
export async function generateImage(prompt: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In offline mode, return a placeholder image
    // In production, this would call an AI image generation API (DALL-E, Stable Diffusion, etc.)

    // Create a placeholder with the prompt text
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    if (ctx) {
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 512, 512)
        gradient.addColorStop(0, '#667eea')
        gradient.addColorStop(1, '#764ba2')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 512, 512)

        // Add text
        ctx.fillStyle = 'white'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Word wrap
        const words = prompt.split(' ')
        const lines: string[] = []
        let currentLine = ''

        words.forEach(word => {
            const testLine = currentLine + word + ' '
            const metrics = ctx.measureText(testLine)
            if (metrics.width > 450 && currentLine !== '') {
                lines.push(currentLine)
                currentLine = word + ' '
            } else {
                currentLine = testLine
            }
        })
        lines.push(currentLine)

        // Draw lines
        const lineHeight = 30
        const startY = 256 - (lines.length * lineHeight) / 2
        lines.forEach((line, i) => {
            ctx.fillText(line, 256, startY + i * lineHeight)
        })

        // Add "AI Generated" watermark
        ctx.font = '16px Arial'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.fillText('🎨 AI Generated (Demo)', 256, 480)
    }

    return canvas.toDataURL('image/png')
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Formato de imagem não suportado. Use JPG, PNG, GIF ou WebP.' }
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
        return { valid: false, error: 'Imagem muito grande. Tamanho máximo: 10MB.' }
    }

    return { valid: true }
}
