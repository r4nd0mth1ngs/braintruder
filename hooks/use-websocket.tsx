"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error"

interface WebSocketHookOptions {
  url: string
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onMessage?: (event: MessageEvent) => void
  onError?: (event: Event) => void
  reconnectInterval?: number
  reconnectAttempts?: number
  autoConnect?: boolean
}

export function useWebSocket({
  url,
  onOpen,
  onClose,
  onMessage,
  onError,
  reconnectInterval = 5000,
  reconnectAttempts = 5,
  autoConnect = true,
}: WebSocketHookOptions) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected")
  const [data, setData] = useState<any>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const attemptRef = useRef(0)

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return

    try {
      const socket = new WebSocket(url)
      socketRef.current = socket

      setStatus("connecting")

      socket.onopen = (event) => {
        setStatus("connected")
        attemptRef.current = 0
        if (onOpen) onOpen(event)
      }

      socket.onclose = (event) => {
        setStatus("disconnected")
        if (onClose) onClose(event)

        // Attempt to reconnect if not closed cleanly and we haven't exceeded attempts
        if (!event.wasClean && attemptRef.current < reconnectAttempts) {
          attemptRef.current += 1
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      socket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data)
          setData(parsedData)
          if (onMessage) onMessage(event)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      socket.onerror = (event) => {
        setStatus("error")
        if (onError) onError(event)
      }
    } catch (error) {
      console.error("WebSocket connection error:", error)
      setStatus("error")
    }
  }, [url, onOpen, onClose, onMessage, onError, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    attemptRef.current = 0
    setStatus("disconnected")
  }, [])

  const send = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof data === "string" ? data : JSON.stringify(data))
      return true
    }
    return false
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    status,
    data,
    send,
    connect,
    disconnect,
  }
}
