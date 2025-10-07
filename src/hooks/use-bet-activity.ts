import { useState, useEffect } from 'react'
import { supabase, BetActivity } from '@/lib/supabase'
import { toast } from 'sonner'

export const useBetActivity = (marketId?: string) => {
  const [activities, setActivities] = useState<BetActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch bet activities
  const fetchActivities = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('bet_activities')
        .select('*')
        .order('created_at', { ascending: false })

      if (marketId) {
        query = query.eq('market_id', marketId)
      }

      const { data, error } = await query.limit(50)

      if (error) {
        throw error
      }

      setActivities(data || [])
    } catch (err: any) {
      console.error('Error fetching bet activities:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Add new bet activity
  const addBetActivity = async (activity: Omit<BetActivity, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bet_activities')
        .insert([activity])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Add to local state
      setActivities(prev => [data, ...prev])
      return data
    } catch (err: any) {
      console.error('Error adding bet activity:', err)
      toast.error('Failed to record bet activity')
      throw err
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [marketId])

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
    addBetActivity
  }
}