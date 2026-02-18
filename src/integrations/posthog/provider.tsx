import posthog from 'posthog-js'
import { PostHogProvider as BasePostHogProvider } from '@posthog/react'
import type { ReactNode } from 'react'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY?.trim() ?? ''
const hasValidPosthogKey = posthogKey.length > 0 && posthogKey !== 'phc_xxx'

if (typeof window !== 'undefined' && hasValidPosthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    defaults: '2025-11-30',
  })
}

interface PostHogProviderProps {
  children: ReactNode
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  if (!hasValidPosthogKey) {
    return <>{children}</>
  }
  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>
}
