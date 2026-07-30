"use client"

import { Button } from "@/components/ui/button"
import { JobInfoTable } from "@/drizzle/schema"
import { createInterview, updateInterview, getNextInterviewResponse } from "@/features/interviews/actions"
import { errorToast } from "@/lib/errorToast"
import { CondensedMessages } from "@/services/hume/components/CondensedMessages"
import { condenseChatMessages } from "@/services/hume/lib/condenseChatMessages"
import { Loader2Icon, MicIcon, MicOffIcon, PhoneOffIcon, SendIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useLanguage } from "@/context/LanguageContext"
import { Textarea } from "@/components/ui/textarea"

type Message = {
  role: "user" | "assistant"
  text: string
}

type ReadyState = "IDLE" | "CONNECTING" | "OPEN" | "CLOSED"

export function StartCall({
  jobInfo,
  user,
}: {
  jobInfo: Pick<
    typeof JobInfoTable.$inferSelect,
    "id" | "title" | "description" | "experienceLevel"
  >
  user: {
    name: string
    imageUrl: string
  }
}) {
  const router = useRouter()
  const { language, t } = useLanguage()

  const [readyState, setReadyState] = useState<ReadyState>("IDLE")
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  
  // Speech Recognition States
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [interimText, setInterimText] = useState("")
  const [finalText, setFinalText] = useState("")
  const [manualInput, setManualInput] = useState("")
  
  // Speech Synthesis States
  const [isPlayingAiSpeech, setIsPlayingAiSpeech] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Timer/Duration States
  const [seconds, setSeconds] = useState(0)

  // Audio Analyzer for Visualizer
  const [micVolume, setMicVolume] = useState<number[]>(new Array(24).fill(0))
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when messages or text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, interimText, finalText])

  // Timer interval
  useEffect(() => {
    if (readyState !== "OPEN") return
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [readyState])

  // Cleanup analyzer on unmount
  useEffect(() => {
    return () => {
      stopAnalyzer()
    }
  }, [])

  const callDurationTimestamp = useMemo(() => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":")
  }, [seconds])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.")
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = language === "vi" ? "vi-VN" : "en-US"

    rec.onresult = (event: any) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript)
      }
      if (finalTranscript) {
        setFinalText(prev => prev + " " + finalTranscript)
        setInterimText("")
      }
    }

    rec.onend = () => {
      setIsListening(false)
    }

    rec.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") {
        return
      }
      console.error("Speech recognition error", e.error, e)
      setIsListening(false)
    }

    recognitionRef.current = rec

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (err) {}
      }
    }
  }, [language])

  // Microphone Audio Context Analyzer
  const startAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContextClass()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyserRef.current = analyser

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateVolume = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        // Convert to array of numbers normalized and scaled for Hume visualizer (0 to 4)
        const values = Array.from(dataArray).slice(0, 24).map(v => (v / 255) * 4)
        setMicVolume(values)
        animationRef.current = requestAnimationFrame(updateVolume)
      }
      updateVolume()
    } catch (e) {
      console.error("Failed to start microphone analyzer", e)
    }
  }

  const stopAnalyzer = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(err => {
        console.warn("Failed to close AudioContext:", err)
      })
    }
    audioContextRef.current = null
  }

  // Speech Recognition Control
  const startListening = () => {
    if (isMuted || isPlayingAiSpeech || isAiLoading) return
    if (!recognitionRef.current) return

    setIsListening(true)
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.warn("Speech recognition already running", e)
    }
  }

  const stopListening = () => {
    setIsListening(false)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }
  }

  const sanitizeTextForSpeech = (textToSanitize: string): string => {
    return textToSanitize
      .replace(/`/g, "") // Remove backticks
      .replace(/\*/g, "") // Remove bold markdown asterisks
      .replace(/display:\s*/gi, "display ") // display: block -> display block
      .replace(/:\s*/g, " ") // Replace remaining colons with spaces
      .replace(/\bHTML\b/gi, "H T M L")
      .replace(/\bCSS\b/gi, "C S S")
      .replace(/\bAPI\b/gi, "A P I")
      .replace(/\bUI\b/gi, "U I")
      .replace(/\bUX\b/gi, "U X")
      .replace(/\bREST\b/gi, "rest")
      .replace(/\bFront-end\b/gi, "Frơn en")
      .replace(/\bFrontend\b/gi, "Frơn en")
      .replace(/\bBack-end\b/gi, "Bắc en")
      .replace(/\bBackend\b/gi, "Bắc en")
  }

  // Text to Speech
  const speakText = (text: string) => {
    if (typeof window === "undefined") return
    window.speechSynthesis.cancel()

    const sanitizedText = sanitizeTextForSpeech(text)
    const utterance = new SpeechSynthesisUtterance(sanitizedText)
    utterance.lang = language === "vi" ? "vi-VN" : "en-US"

    const voices = window.speechSynthesis.getVoices()
    const targetVoice = voices.find(
      v => v.lang.startsWith(language === "vi" ? "vi" : "en")
    )
    if (targetVoice) {
      utterance.voice = targetVoice
    }

    utterance.onstart = () => {
      setIsPlayingAiSpeech(true)
      stopListening()
    }

    utterance.onend = () => {
      setIsPlayingAiSpeech(false)
      startListening()
    }

    utterance.onerror = (e: any) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        return
      }
      console.error("Speech synthesis error", e.error, e)
      setIsPlayingAiSpeech(false)
      startListening()
    }

    window.speechSynthesis.speak(utterance)
  }

  // Handle AI Response generation
  const submitSpeechMessage = async (userSpeech: string) => {
    setFinalText("")
    setInterimText("")
    stopListening()

    const updatedMessages = [...messages, { role: "user" as const, text: userSpeech }]
    setMessages(updatedMessages)

    setIsAiLoading(true)
    const res = await getNextInterviewResponse({
      jobInfo,
      messages: updatedMessages,
      language,
    })
    setIsAiLoading(false)

    if (res.error || !res.text) {
      errorToast(res.message || "Failed to get AI response")
      startListening()
      return
    }

    const nextMessages = [...updatedMessages, { role: "assistant" as const, text: res.text }]
    setMessages(nextMessages)

    speakText(res.text)
  }

  // Watch for Speech Recognition completion
  useEffect(() => {
    if (isListening || !finalText.trim()) return
    submitSpeechMessage(finalText.trim())
  }, [isListening, finalText])

  // Start Interview action
  const handleStartInterview = async () => {
    setReadyState("CONNECTING")
    const res = await createInterview({ jobInfoId: jobInfo.id })
    if (res.error) {
      setReadyState("IDLE")
      return errorToast(res.message)
    }

    setInterviewId(res.id)
    await startAnalyzer()

    // Get the first welcoming question from Gemini
    setIsAiLoading(true)
    const initialRes = await getNextInterviewResponse({
      jobInfo,
      messages: [],
      language,
    })
    setIsAiLoading(false)

    if (initialRes.error || !initialRes.text) {
      setReadyState("CLOSED")
      return errorToast(initialRes.message || "Failed to initialize interview")
    }

    setReadyState("OPEN")
    setMessages([{ role: "assistant", text: initialRes.text }])
    speakText(initialRes.text)
  }

  // End Interview call
  const handleEndCall = async () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel()
    }
    stopListening()
    stopAnalyzer()

    if (interviewId != null) {
      await updateInterview(interviewId, {
        duration: callDurationTimestamp,
        messagesJson: JSON.stringify(messages),
      })
      router.push(`/app/job-infos/${jobInfo.id}/interviews/${interviewId}`)
    } else {
      router.push(`/app/job-infos/${jobInfo.id}/interviews`)
    }
  }

  // Handle manual message submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) return
    const textToSend = manualInput.trim()
    setManualInput("")
    submitSpeechMessage(textToSend)
  }

  // Visualizer Animation for AI Speech
  const aiVisualizerVolume = useMemo(() => {
    if (!isPlayingAiSpeech) return new Array(24).fill(0)
    // Generate random waves for speaking animation
    return new Array(24).fill(0).map(() => Math.random() * 3)
  }, [isPlayingAiSpeech, seconds])

  // Map messages to format expected by condenseChatMessages
  const humeFormattedMessages = useMemo(() => {
    const formatted = messages.map(m => ({
      type: m.role === "user" ? "USER_MESSAGE" : "AGENT_MESSAGE",
      messageText: m.text
    }))
    
    // Add current interim text as a user message at the end
    if (interimText || finalText) {
      formatted.push({
        type: "USER_MESSAGE",
        messageText: (finalText + " " + interimText).trim()
      })
    }
    return formatted
  }, [messages, interimText, finalText])

  const condensedMessages = useMemo(() => {
    return condenseChatMessages(humeFormattedMessages)
  }, [humeFormattedMessages])

  // Render Idle Screen
  if (readyState === "IDLE") {
    return (
      <div className="flex justify-center items-center h-screen-header">
        <Button size="lg" onClick={handleStartInterview}>
          {t("interviewsPage.startInterview")}
        </Button>
      </div>
    )
  }

  // Render Connecting / Loading Screen
  if (readyState === "CONNECTING" || isAiLoading) {
    return (
      <div className="h-screen-header flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="animate-spin size-24 text-primary" />
          <span className="text-muted-foreground text-lg animate-pulse">
            {readyState === "CONNECTING" ? t("interviewsPage.generating") : "AI is thinking..."}
          </span>
        </div>
      </div>
    )
  }

  // Render Active Interview Room
  return (
    <div className="overflow-y-auto h-screen-header flex flex-col justify-between pb-4">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container flex flex-col items-center gap-4 max-w-5xl">
          <CondensedMessages
            messages={condensedMessages}
            user={user}
            maxFft={isPlayingAiSpeech ? 3 : Math.max(...micVolume)}
            className="w-full"
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Manual text input option */}
      <form onSubmit={handleManualSubmit} className="container max-w-xl mx-auto px-4 mb-4 flex gap-2 items-end">
        <Textarea
          placeholder="Nhập câu trả lời của bạn hoặc nói..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (manualInput.trim() && !isPlayingAiSpeech && !isAiLoading) {
                submitSpeechMessage(manualInput.trim())
                setManualInput("")
              }
            }
          }}
          disabled={isPlayingAiSpeech || isAiLoading}
          className="flex-1 bg-secondary/50 border-secondary-foreground/20 min-h-[40px] max-h-[120px] py-2 px-3 resize-none scrollbar-thin"
          rows={1}
        />
        <Button type="submit" disabled={!manualInput.trim() || isPlayingAiSpeech || isAiLoading} size="icon" className="h-[40px] w-[40px] shrink-0">
          <SendIcon className="size-4" />
        </Button>
      </form>

      {/* Visualizer and controls */}
      <div className="container max-w-5xl mx-auto px-4 flex justify-center">
        <div className="flex gap-5 rounded-full border border-secondary-foreground/10 px-6 py-3 w-fit bg-secondary/80 backdrop-blur-md items-center shadow-lg">
          {/* Mute button */}
          <Button
            variant="ghost"
            size="icon"
            className="-mx-3 rounded-full"
            onClick={() => {
              if (isMuted) {
                setIsMuted(false)
                setIsListening(true)
                if (recognitionRef.current) {
                  try { recognitionRef.current.start() } catch(e) {}
                }
              } else {
                setIsMuted(true)
                stopListening()
              }
            }}
            disabled={isPlayingAiSpeech || isAiLoading}
          >
            {isMuted ? <MicOffIcon className="text-destructive size-5" /> : <MicIcon className="size-5" />}
            <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
          </Button>

          {/* Sóng âm Visualizer */}
          <div className="self-stretch w-48 px-2">
            <FftVisualizer fft={isPlayingAiSpeech ? aiVisualizerVolume : micVolume} />
          </div>

          {/* Timer */}
          <div className="text-sm text-muted-foreground font-mono tabular-nums">
            {callDurationTimestamp}
          </div>

          {/* End Call button */}
          <Button
            variant="ghost"
            size="icon"
            className="-mx-3 rounded-full hover:bg-destructive/10"
            onClick={handleEndCall}
          >
            <PhoneOffIcon className="text-destructive size-5" />
            <span className="sr-only">End Call</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function FftVisualizer({ fft }: { fft: number[] }) {
  return (
    <div className="flex gap-1 items-center justify-center h-full min-h-6">
      {fft.map((value, index) => {
        // value is 0 to 4. Map it to height percentage
        const percent = (value / 4) * 100
        return (
          <div
            key={index}
            className="min-h-1 bg-primary w-1 rounded-full transition-[height] duration-75"
            style={{ height: `${Math.max(10, Math.min(100, percent))}%` }}
          />
        )
      })}
    </div>
  )
}
