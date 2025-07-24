// デバイス検出とレスポンシブユーティリティ

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenSize: 'sm' | 'md' | 'lg' | 'xl'
  orientation: 'portrait' | 'landscape'
}

export function getDeviceInfo(): DeviceInfo {
  const width = window.innerWidth
  const height = window.innerHeight
  const userAgent = navigator.userAgent.toLowerCase()
  
  const isMobile = width < 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = width >= 768 && width < 1024
  const isDesktop = width >= 1024
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  let screenSize: 'sm' | 'md' | 'lg' | 'xl'
  if (width < 640) screenSize = 'sm'
  else if (width < 768) screenSize = 'md'
  else if (width < 1024) screenSize = 'lg'
  else screenSize = 'xl'
  
  const orientation = height > width ? 'portrait' : 'landscape'
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    screenSize,
    orientation
  }
}

// タッチジェスチャーのハンドリング
export interface TouchGesture {
  type: 'tap' | 'longpress' | 'swipe' | 'pinch' | 'pan'
  startPoint: { x: number; y: number }
  endPoint?: { x: number; y: number }
  deltaX?: number
  deltaY?: number
  scale?: number
  duration: number
}

export class TouchGestureHandler {
  private startTime: number = 0
  private startPoint: { x: number; y: number } = { x: 0, y: 0 }
  private longPressTimer: NodeJS.Timeout | null = null
  private initialDistance: number = 0
  
  constructor(
    private element: HTMLElement,
    private onGesture: (gesture: TouchGesture) => void
  ) {
    this.setupEventListeners()
  }
  
  private setupEventListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this))
  }
  
  private handleTouchStart(e: TouchEvent) {
    e.preventDefault()
    this.startTime = Date.now()
    
    if (e.touches.length === 1) {
      this.startPoint = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
      
      // Long press detection
      this.longPressTimer = setTimeout(() => {
        this.onGesture({
          type: 'longpress',
          startPoint: this.startPoint,
          duration: Date.now() - this.startTime
        })
      }, 500)
    } else if (e.touches.length === 2) {
      // Pinch gesture initialization
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      this.initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    if (e.touches.length === 2) {
      // Pinch gesture
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const scale = currentDistance / this.initialDistance
      
      this.onGesture({
        type: 'pinch',
        startPoint: this.startPoint,
        scale,
        duration: Date.now() - this.startTime
      })
    } else if (e.touches.length === 1) {
      // Pan gesture
      const currentPoint = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
      
      this.onGesture({
        type: 'pan',
        startPoint: this.startPoint,
        endPoint: currentPoint,
        deltaX: currentPoint.x - this.startPoint.x,
        deltaY: currentPoint.y - this.startPoint.y,
        duration: Date.now() - this.startTime
      })
    }
  }
  
  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault()
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    const endTime = Date.now()
    const duration = endTime - this.startTime
    
    if (e.changedTouches.length === 1 && duration < 300) {
      const endPoint = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      }
      
      const deltaX = endPoint.x - this.startPoint.x
      const deltaY = endPoint.y - this.startPoint.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (distance < 10) {
        // Tap gesture
        this.onGesture({
          type: 'tap',
          startPoint: this.startPoint,
          endPoint,
          duration
        })
      } else if (distance > 50) {
        // Swipe gesture
        this.onGesture({
          type: 'swipe',
          startPoint: this.startPoint,
          endPoint,
          deltaX,
          deltaY,
          duration
        })
      }
    }
  }
  
  private handleTouchCancel() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }
  
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this))
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
  }
}

// ビューポートサイズに基づく動的スタイリング
export function getResponsiveStyles(deviceInfo: DeviceInfo) {
  return {
    container: {
      padding: deviceInfo.isMobile ? '8px' : '16px',
      fontSize: deviceInfo.isMobile ? '14px' : '16px'
    },
    
    sidebar: {
      width: deviceInfo.isMobile ? '100%' : deviceInfo.isTablet ? '300px' : '350px',
      position: deviceInfo.isMobile ? 'fixed' as const : 'relative' as const,
      zIndex: deviceInfo.isMobile ? 1000 : 'auto'
    },
    
    canvas: {
      height: deviceInfo.isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 80px)',
      touchAction: 'none' as const
    },
    
    nodeList: {
      maxHeight: deviceInfo.isMobile ? '300px' : '500px',
      fontSize: deviceInfo.isMobile ? '12px' : '14px'
    },
    
    modal: {
      width: deviceInfo.isMobile ? '100%' : deviceInfo.isTablet ? '90%' : '600px',
      maxHeight: deviceInfo.isMobile ? '100vh' : '90vh',
      margin: deviceInfo.isMobile ? '0' : '20px'
    },
    
    button: {
      padding: deviceInfo.isMobile ? '12px 16px' : '8px 12px',
      minHeight: deviceInfo.isTouchDevice ? '44px' : 'auto'
    },
    
    input: {
      padding: deviceInfo.isMobile ? '12px' : '8px',
      minHeight: deviceInfo.isTouchDevice ? '44px' : 'auto'
    }
  }
}

// スクロール最適化
export function optimizeScrolling(element: HTMLElement, deviceInfo: DeviceInfo) {
  if (deviceInfo.isTouchDevice) {
    (element.style as any).webkitOverflowScrolling = 'touch'
    ;(element.style as any).overflowScrolling = 'touch'
  }
  
  // パフォーマンスの向上
  element.style.willChange = 'transform'
  element.style.backfaceVisibility = 'hidden'
}

// 画面方向変更の検出
export function onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void) {
  const handleOrientationChange = () => {
    setTimeout(() => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      callback(newOrientation)
    }, 100) // 方向変更の完了を待つ
  }
  
  window.addEventListener('orientationchange', handleOrientationChange)
  window.addEventListener('resize', handleOrientationChange)
  
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange)
    window.removeEventListener('resize', handleOrientationChange)
  }
}

// アクセシビリティ対応
export function improveAccessibility(element: HTMLElement, deviceInfo: DeviceInfo) {
  if (deviceInfo.isTouchDevice) {
    // タッチデバイス用のフォーカスリング
    element.style.setProperty('--focus-ring-size', '3px')
    element.style.setProperty('--focus-ring-color', '#3b82f6')
  }
  
  // 高コントラストモード対応
  if (window.matchMedia('(prefers-contrast: high)').matches) {
    element.style.setProperty('--border-width', '2px')
    element.style.setProperty('--text-weight', 'bold')
  }
  
  // 動作低減モード対応
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.style.setProperty('--animation-duration', '0s')
    element.style.setProperty('--transition-duration', '0s')
  }
}