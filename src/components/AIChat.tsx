import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Collapse,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
} from '@mui/material'
import { Send, SmartToy, Close, AttachFile, Image as ImageIcon, Download } from '@mui/icons-material'
import { ChatMessage, Subject } from '../types'
import { soundManager } from '../utils/soundEffects'
import { uploadImage, generateImage, validateImageFile } from '../services/imageService'
import { t } from '../utils/translations'

interface AIChatProps {
  subject?: Subject
  currentExercise?: string
  onClose?: () => void
  language?: string
}

export default function AIChat({ subject, currentExercise, onClose, language = 'pt-BR' }: AIChatProps) {
  const lang = language || 'pt-BR';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('ai_chat_intro', lang),
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulação de resposta da IA
    // Em produção, isso se conectaria a uma API real (OpenAI, Anthropic, etc.)

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

    const lowerMessage = userMessage.toLowerCase()

    // Respostas contextuais baseadas na mensagem
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('help') || lowerMessage.includes('aide') || lowerMessage.includes('hilfe') || lowerMessage.includes('aiuto')) {
      const helpText = t('ai_chat_help', lang);
      const subjectText = subject ? `${t(subject as any, lang)}. ` : '';
      const exerciseText = currentExercise ? t('ai_chat_hint', lang) : '';
      return `${helpText}\n\n${subjectText}${exerciseText}`;
    }

    if (lowerMessage.includes('dica') || lowerMessage.includes('hint') || lowerMessage.includes('consejo') || lowerMessage.includes('astuce') || lowerMessage.includes('tipp')) {
      return t('ai_chat_hint', lang);
    }

    if (lowerMessage.includes('matemática') || lowerMessage.includes('matematica') || lowerMessage.includes('math') || lowerMessage.includes('matemáticas') || lowerMessage.includes('mathématiques') || lowerMessage.includes('mathe')) {
      return t('ai_chat_math', lang);
    }

    if (lowerMessage.includes('português') || lowerMessage.includes('portugues') || lowerMessage.includes('portuguese') || lowerMessage.includes('portugués') || lowerMessage.includes('portugais')) {
      return t('ai_chat_portuguese', lang);
    }

    if (lowerMessage.includes('física') || lowerMessage.includes('fisica') || lowerMessage.includes('physics') || lowerMessage.includes('física') || lowerMessage.includes('physique') || lowerMessage.includes('physik')) {
      return t('ai_chat_physics', lang);
    }

    if (lowerMessage.includes('química') || lowerMessage.includes('quimica') || lowerMessage.includes('chemistry') || lowerMessage.includes('química') || lowerMessage.includes('chimie') || lowerMessage.includes('chemie')) {
      return t('ai_chat_chemistry', lang);
    }

    if (lowerMessage.includes('história') || lowerMessage.includes('historia') || lowerMessage.includes('history') || lowerMessage.includes('historia') || lowerMessage.includes('histoire') || lowerMessage.includes('geschichte')) {
      return t('ai_chat_history', lang);
    }

    if (lowerMessage.includes('geografia') || lowerMessage.includes('geography') || lowerMessage.includes('geografía') || lowerMessage.includes('géographie') || lowerMessage.includes('geografie')) {
      return t('ai_chat_geography', lang);
    }

    if (lowerMessage.includes('biologia') || lowerMessage.includes('biology') || lowerMessage.includes('biología') || lowerMessage.includes('biologie') || lowerMessage.includes('biologie')) {
      return t('ai_chat_biology', lang);
    }

    // Resposta genérica inteligente
    return t('ai_chat_default', lang)
  }

  const handleImageAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Erro ao validar imagem')
      return
    }

    try {
      const imageUrl = await uploadImage(file)
      setSelectedImage(imageUrl)
      soundManager.playClick()
    } catch (err) {
      setError('Erro ao carregar imagem')
      console.error(err)
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input || '📎 Imagem anexada',
      timestamp: new Date(),
      imageUrl: selectedImage || undefined,
      imageType: selectedImage ? 'attachment' : undefined,
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setSelectedImage(null)
    setIsLoading(true)
    soundManager.playClick()

    // Check if user wants to generate an image
    const imageGenKeywords = [t('ai_generate_image_cmd', lang), 'create image', 'generate image']
    const shouldGenerateImage = imageGenKeywords.some(keyword => currentInput.toLowerCase().includes(keyword))

    if (shouldGenerateImage) {
      setIsGeneratingImage(true)
      try {
        const prompt = currentInput.replace(new RegExp(`${t('ai_generate_image_cmd', lang)}|create image of|generate image of`, 'gi'), '').trim()
        const generatedImageUrl = await generateImage(prompt || currentInput)

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🎨 Aqui está a imagem gerada para: "${prompt || currentInput}"`,
          timestamp: new Date(),
          imageUrl: generatedImageUrl,
          imageType: 'generated',
        }
        setMessages(prev => [...prev, assistantMessage])
      } catch (err) {
        setError('Erro ao gerar imagem')
        console.error(err)
      } finally {
        setIsGeneratingImage(false)
        setIsLoading(false)
      }
    } else {
      const aiResponse = await generateAIResponse(currentInput)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }

    soundManager.playHover()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Paper
      elevation={16}
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        width: { xs: 'calc(100% - 32px)', sm: 400 },
        maxWidth: { xs: '100%', sm: 400 },
        height: isMinimized ? 'auto' : { xs: 'calc(100vh - 100px)', sm: 600 },
        maxHeight: { xs: 'calc(100vh - 100px)', sm: 600 },
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        zIndex: 1000,
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <SmartToy />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Beard AI
            </Typography>
          </Box>
        </Box>
        {onClose && (
          <IconButton
            size="small"
            onClick={() => {
              setIsMinimized(!isMinimized)
              soundManager.playClick()
            }}
            sx={{ color: 'white' }}
          >
            {isMinimized ? <SmartToy /> : <Close />}
          </IconButton>
        )}
      </Box>

      <Collapse in={!isMinimized}>
        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 1,
              }}
            >
              {message.role === 'assistant' && (
                <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                  <SmartToy sx={{ fontSize: 20 }} />
                </Avatar>
              )}
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  maxWidth: '80%',
                  bgcolor: message.role === 'user' ? 'primary.main' : 'rgba(255,255,255,0.08)',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.content}
                </Typography>
                {message.imageUrl && (
                  <Box sx={{ mt: 1 }}>
                    <Box
                      component="img"
                      src={message.imageUrl}
                      alt="Attached image"
                      onClick={() => setExpandedImage(message.imageUrl!)}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        },
                      }}
                    />
                    {message.imageType === 'generated' && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = message.imageUrl!
                          link.download = 'generated-image.png'
                          link.click()
                        }}
                        sx={{ mt: 0.5 }}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Paper>
              {message.role === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                  👤
                </Avatar>
              )}
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                <SmartToy sx={{ fontSize: 20 }} />
              </Avatar>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {isGeneratingImage ? `🎨 ${t('ai_generating_image', lang)}` : t('ai_thinking', lang)}
                </Typography>
                {isGeneratingImage && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {selectedImage && (
            <Box sx={{ mb: 1, position: 'relative', display: 'inline-block' }}>
              <Box
                component="img"
                src={selectedImage}
                alt="Preview"
                sx={{
                  maxWidth: 100,
                  maxHeight: 100,
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: 'primary.main',
                }}
              />
              <IconButton
                size="small"
                onClick={() => setSelectedImage(null)}
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' },
                  width: 20,
                  height: 20,
                }}
              >
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageAttachment}
            />
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              sx={{
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.light', color: 'primary.dark' },
              }}
              title={t('ai_attach_image', lang)}
            >
              <AttachFile />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setInput(input + (input ? ' ' : '') + t('ai_generate_image_cmd', lang) + ' ')}
              disabled={isLoading}
              sx={{
                color: 'secondary.main',
                '&:hover': { bgcolor: 'secondary.light', color: 'secondary.dark' },
              }}
              title="Gerar imagem com IA"
            >
              <ImageIcon />
            </IconButton>
            <TextField
              fullWidth
              size="small"
              placeholder={t('ai_placeholder_chat', lang)}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' },
              }}
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </Collapse>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Image Expansion Dialog */}
      <Dialog
        open={!!expandedImage}
        onClose={() => setExpandedImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
          <Box
            component="img"
            src={expandedImage || ''}
            alt="Expanded view"
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
            onClick={() => setExpandedImage(null)}
          />
        </DialogContent>
      </Dialog>
    </Paper>
  )
}



