"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import LandingPage from "@/components/landing-page"

interface UserType {
  name: string
  email: string
  avatar?: string
  uid: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleViewChange = (newView: "landing" | "login" | "signup" | "chat") => {
    setIsAnimating(true)
    setTimeout(() => {
      if (newView === "login") router.push("/login")
      if (newView === "signup") router.push("/signup")
      if (newView === "chat") router.push("/chat")
      setIsAnimating(false)
    }, 300)
  }

  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email || "User",
          email: firebaseUser.email || "",
          uid: firebaseUser.uid,
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 animate-pulse">
      </div>
    )
  }

  return (
    <LandingPage
      user={user}
      onViewChange={handleViewChange}
      onLogout={handleLogout}
      isAnimating={isAnimating}
    />
  )
}
