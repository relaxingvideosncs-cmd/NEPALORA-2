'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function StaffLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/staff/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 sm:my-16 p-6 sm:p-8 border border-hairline rounded-2xl sm:rounded-3xl shadow-md bg-bg-elevated">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-full bg-bg border border-hairline text-ink mb-3 shadow-2xs">
          <Lock className="w-6 h-6 text-accent-blue" />
        </div>
        <div className="flex justify-center mb-1">
          <Badge tone="blue">Editorial Access</Badge>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-2">
          Staff Portal
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-1">
          Soul of Nepal editorial & publishing dashboard
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@soulofnepal.com"
              className="w-full pl-10 pr-3 py-3 min-h-[48px] bg-bg border border-hairline rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-hairline-strong transition-all"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-3 min-h-[48px] bg-bg border border-hairline rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-hairline-strong transition-all"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          className="w-full mt-4 font-semibold shadow-md min-h-[48px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
        </Button>
      </form>
    </div>
  )
}
