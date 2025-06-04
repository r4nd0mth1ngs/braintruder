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
  const urlRef = useRef(url)
  const isConnectingRef = useRef(false)

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      // Remove all event listeners
      socketRef.current.onopen = null
      socketRef.current.onclose = null
      socketRef.current.onmessage = null
      socketRef.current.onerror = null

      // Close the connection if it's still open
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close(1000, "Client cleaning up")
      }
      socketRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    isConnectingRef.current = false
    setStatus("disconnected")
  }, [])

  const connect = useCallback(() => {
    if (isConnectingRef.current) {
      console.log("Connection attempt already in progress")
      return
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected")
      return
    }

    isConnectingRef.current = true
    cleanup() // Clean up any existing connection

    try {
      // Ensure the URL starts with ws:// or wss://
      const wsUrl = urlRef.current.startsWith('ws://') || urlRef.current.startsWith('wss://')
        ? urlRef.current
        : `ws://${urlRef.current}`

      console.log("Creating new WebSocket connection to:", wsUrl)
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      setStatus("connecting")

      socket.onopen = (event) => {
        console.log("WebSocket connected")
        setStatus("connected")
        attemptRef.current = 0
        isConnectingRef.current = false
        if (onOpen) onOpen(event)
      }

      socket.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason)
        setStatus("disconnected")
        isConnectingRef.current = false
        if (onClose) onClose(event)

        // Only attempt to reconnect if:
        // 1. The connection wasn't closed cleanly
        // 2. We haven't exceeded the maximum attempts
        // 3. The component is still mounted (urlRef.current matches the current url)
        if (!event.wasClean && attemptRef.current < reconnectAttempts && urlRef.current === url) {
          attemptRef.current += 1
          const backoff = Math.min(2 ** attemptRef.current * 1000, reconnectInterval)
          console.log(`Attempting to reconnect in ${backoff}ms (Attempt ${attemptRef.current}/${reconnectAttempts})`)
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, backoff)
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
        console.error("WebSocket error:", event)
        setStatus("error")
        isConnectingRef.current = false
        if (onError) onError(event)
      }
    } catch (error) {
      console.error("WebSocket connection error:", error)
      setStatus("error")
      isConnectingRef.current = false
    }
  }, [url, onOpen, onClose, onMessage, onError, reconnectAttempts, reconnectInterval, cleanup])

  const disconnect = useCallback(() => {
    cleanup()
    attemptRef.current = 0
  }, [cleanup])

  const send = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(typeof data === "string" ? data : JSON.stringify(data))
        return true
      } catch (error) {
        console.error("Error sending WebSocket message:", error)
        return false
      }
    }
    return false
  }, [])

  // Update urlRef when url changes
  useEffect(() => {
    urlRef.current = url
  }, [url])

  // Handle initial connection and cleanup
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
