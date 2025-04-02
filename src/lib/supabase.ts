"use client"

import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Generate a unique ID for the user
export const generateUserId = () => {
  return Math.random().toString(36).substring(2, 15)
}

// Store the user ID in memory
let userId: string | null = null

// Get the user ID, generating one if it doesn't exist
export const getUserId = () => {
  if (!userId) {
    // Check if we have a stored ID in localStorage
    const storedId = typeof window !== "undefined" ? localStorage.getItem("rtc_user_id") : null
    if (storedId) {
      userId = storedId
    } else {
      userId = generateUserId()
      if (typeof window !== "undefined") {
        localStorage.setItem("rtc_user_id", userId)
      }
    }
  }
  return userId
}

