"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, User, Bell, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "",
    notificationCount: 5,
    savedRecipes: 12,
    trackedItems: 8,
  })
  const { toast } = useToast()

  // Simulate loading user data
  useEffect(() => {
    // In a real app, this would fetch user data from an API
    const email = localStorage.getItem("userEmail") || "demo@example.com"
    const name = localStorage.getItem("userName") || "Demo User"

    setUserData({
      ...userData,
      email,
      name,
    })
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Save to localStorage for demo purposes
      localStorage.setItem("userName", userData.name)
      localStorage.setItem("userEmail", userData.email)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile sidebar */}
        <Card className="md:col-span-1 border-coder-primary/20 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="bg-coder-primary/10 text-coder-primary text-xl">
                {userData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <h2 className="text-xl font-semibold mb-1">{userData.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{userData.email}</p>

            <div className="w-full grid grid-cols-3 gap-2 mb-6">
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <Bell className="h-4 w-4 text-coder-primary mb-1" />
                <span className="text-xs text-muted-foreground">Alerts</span>
                <span className="font-medium">{userData.notificationCount}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <Clock className="h-4 w-4 text-coder-accent mb-1" />
                <span className="text-xs text-muted-foreground">Items</span>
                <span className="font-medium">{userData.trackedItems}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <User className="h-4 w-4 text-coder-secondary mb-1" />
                <span className="text-xs text-muted-foreground">Recipes</span>
                <span className="font-medium">{userData.savedRecipes}</span>
              </div>
            </div>

            <div className="w-full">
              <Link href="/settings">
                <Button variant="outline" className="w-full">
                  Account Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile main content */}
        <Card className="md:col-span-2 border-coder-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>

          <Tabs defaultValue="personal">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="personal" className="p-0">
              <CardContent className="p-6">
                <form onSubmit={handleSaveProfile}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        className="border-coder-primary/30"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        className="border-coder-primary/30"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="avatar">Profile Picture</Label>
                      <Input id="avatar" type="file" accept="image/*" className="border-coder-primary/30" />
                    </div>
                  </div>

                  <Button className="mt-6 w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="preferences" className="p-0">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Dietary Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                        Vegetarian
                      </Badge>
                      <Badge className="cursor-pointer">Gluten-Free</Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                        Vegan
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                        Keto
                      </Badge>
                      <Badge className="cursor-pointer">Low Carb</Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="expiry-notifications">Expiry Notifications</Label>
                        <input type="checkbox" id="expiry-notifications" defaultChecked className="toggle" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="recipe-suggestions">Recipe Suggestions</Label>
                        <input type="checkbox" id="recipe-suggestions" defaultChecked className="toggle" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <input type="checkbox" id="email-notifications" className="toggle" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="mt-6 w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </TabsContent>
          </Tabs>

          <CardFooter className="bg-muted/50 flex justify-between">
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

