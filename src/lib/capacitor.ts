import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Clipboard } from '@capacitor/clipboard'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { SplashScreen } from '@capacitor/splash-screen'

// Check if running in Capacitor
export const isNative = Capacitor.isNativePlatform()
export const isIOS = Capacitor.getPlatform() === 'ios'
export const isAndroid = Capacitor.getPlatform() === 'android'
export const isWeb = Capacitor.getPlatform() === 'web'

// Native share functionality
export const nativeShare = async (url: string, title?: string, text?: string) => {
  if (!isNative) {
    // Fallback to Web Share API if available
    if (navigator.share) {
      await navigator.share({ url, title, text })
    }
    return
  }

  try {
    await Share.share({
      title: title || 'CreativeOS Node',
      text: text || 'Check out this knowledge node',
      url,
      dialogTitle: 'Share Node'
    })
  } catch (error) {
    console.error('Native share failed:', error)
  }
}

// Clipboard operations
export const copyToClipboard = async (text: string) => {
  if (!isNative) {
    await navigator.clipboard.writeText(text)
    return
  }

  await Clipboard.write({
    string: text
  })
}

export const pasteFromClipboard = async (): Promise<string | null> => {
  if (!isNative) {
    return await navigator.clipboard.readText()
  }

  const { value } = await Clipboard.read()
  return value || null
}

// Haptic feedback
export const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (!isNative) return

  const impactStyle = {
    light: ImpactStyle.Light,
    medium: ImpactStyle.Medium,
    heavy: ImpactStyle.Heavy
  }[style]

  await Haptics.impact({ style: impactStyle })
}

// Splash screen control
export const hideSplashScreen = async () => {
  if (!isNative) return
  
  await SplashScreen.hide()
}

// Handle app URL schemes (deep linking)
export const handleAppUrl = (callback: (data: any) => void) => {
  if (!isNative) return

  // Listen for app URL open events
  window.addEventListener('appUrlOpen', (event: any) => {
    // Parse the event data
    let data
    try {
      data = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail
    } catch (e) {
      data = { url: event.detail }
    }
    callback(data)
  })
}