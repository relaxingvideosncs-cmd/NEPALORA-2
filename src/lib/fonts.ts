import localFont from 'next/font/local'
import { Caveat } from 'next/font/google'

export const caveatFont = Caveat({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-handwriting',
  display: 'swap',
})

// San Francisco Pro Text (Optimal for body and standard text, weights 400, 500, 600, 700)
export const sfProText = localFont({
  src: [
    {
      path: '../San Francisco/pro/SF-Pro-Text-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../San Francisco/pro/SF-Pro-Text-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../San Francisco/pro/SF-Pro-Text-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../San Francisco/pro/SF-Pro-Text-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sf-pro',
  display: 'swap',
})

// San Francisco Pro Display (Optimal for headlines, titles and large display typography)
export const sfProDisplay = localFont({
  src: [
    {
      path: '../San Francisco/pro/SF-Pro-Display-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../San Francisco/pro/SF-Pro-Display-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../San Francisco/pro/SF-Pro-Display-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../San Francisco/pro/SF-Pro-Display-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sf-pro-display',
  display: 'swap',
})

// San Francisco UI Text
export const sfUiText = localFont({
  src: [
    {
      path: '../San Francisco/SFUIText/SFUIText-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../San Francisco/SFUIText/SFUIText-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../San Francisco/SFUIText/SFUIText-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../San Francisco/SFUIText/SFUIText-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sf-ui-text',
  display: 'swap',
})

// San Francisco UI Display
export const sfUiDisplay = localFont({
  src: [
    {
      path: '../San Francisco/SFUIDisplay/SFUIDisplay-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../San Francisco/SFUIDisplay/SFUIDisplay-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../San Francisco/SFUIDisplay/SFUIDisplay-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../San Francisco/SFUIDisplay/SFUIDisplay-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sf-ui-display',
  display: 'swap',
})
