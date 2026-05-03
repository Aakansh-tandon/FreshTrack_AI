"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Shield, Bell, Moon, Sun, Trash2, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"

const DEFAULT_PREFERENCES = {
  autoRecipeNotifications: true,
  criticalAlertThreshold: 3,
  categoryUrgencyPreset: "default",
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [autoRecipeNotifications, setAutoRecipeNotifications] = useState(true)
  const [criticalAlertThreshold, setCriticalAlertThreshold] = useState("3")
  const [categoryUrgencyPreset, setCategoryUrgencyPreset] = useState("default")
  const { toast } = useToast()
  const router = useRouter()

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.preferences) {
          const prefs = user.user_metadata.preferences
          setAutoRecipeNotifications(prefs.autoRecipeNotifications ?? DEFAULT_PREFERENCES.autoRecipeNotifications)
          setCriticalAlertThreshold(String(prefs.criticalAlertThreshold ?? DEFAULT_PREFERENCES.criticalAlertThreshold))
          setCategoryUrgencyPreset(prefs.categoryUrgencyPreset ?? DEFAULT_PREFERENCES.categoryUrgencyPreset)
        }
      } catch (error) {
        console.error("Error loading preferences:", error)
      }
    }
    loadPreferences()
  }, [])

  // Save preferences to Supabase user metadata
  const savePreferences = async () => {
    try {
      const newPrefs = {
        autoRecipeNotifications,
        criticalAlertThreshold: parseInt(criticalAlertThreshold),
        categoryUrgencyPreset,
      }

      await supabase.auth.updateUser({
        data: { preferences: newPrefs },
      })

      toast({
        title: "Saved",
        description: "Your preferences have been updated",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      })
    }
  }

  // Handle preference changes
  const handleAutoRecipeChange = async (value: boolean) => {
    setAutoRecipeNotifications(value)
    const newPrefs = {
      autoRecipeNotifications: value,
      criticalAlertThreshold: parseInt(criticalAlertThreshold),
      categoryUrgencyPreset,
    }
    try {
      await supabase.auth.updateUser({
        data: { preferences: newPrefs },
      })
      toast({ title: "Saved", description: "Auto-recipe notifications updated" })
    } catch (error) {
      console.error("Error updating auto-recipe preference:", error)
    }
  }

  const handleThresholdChange = async (value: string) => {
    setCriticalAlertThreshold(value)
    const newPrefs = {
      autoRecipeNotifications,
      criticalAlertThreshold: parseInt(value),
      categoryUrgencyPreset,
    }
    try {
      await supabase.auth.updateUser({
        data: { preferences: newPrefs },
      })
      toast({ title: "Saved", description: "Alert threshold updated" })
    } catch (error) {
      console.error("Error updating threshold preference:", error)
    }
  }

  const handlePresetChange = async (value: string) => {
    setCategoryUrgencyPreset(value)
    const newPrefs = {
      autoRecipeNotifications,
      criticalAlertThreshold: parseInt(criticalAlertThreshold),
      categoryUrgencyPreset: value,
    }
    try {
      await supabase.auth.updateUser({
        data: { preferences: newPrefs },
      })
      toast({ title: "Saved", description: "Category urgency preset updated" })
    } catch (error) {
      console.error("Error updating preset preference:", error)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/login")
  }

  const handleDeleteAccount = () => {
    if (deleteConfirm !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would call an API to delete the account
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")

    toast({
      title: "Account deleted",
      description: "Your account has been deleted successfully",
    })

    router.push("/login")
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">Account Settings</h1>
        <Link href="/profile">
          <Button variant="outline">Back to Profile</Button>
        </Link>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="border-coder-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger id="language" className="border-coder-primary/30">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="utc">
                      <SelectTrigger id="timezone" className="border-coder-primary/30">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                        <SelectItem value="est">Eastern Time (GMT-5)</SelectItem>
                        <SelectItem value="pst">Pacific Time (GMT-8)</SelectItem>
                        <SelectItem value="ist">India (GMT+5:30)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-muted-foreground" />
                      <Switch id="dark-mode" defaultChecked />
                      <Moon className="h-4 w-4 text-coder-primary" />
                    </div>
                  </div>
                </div>

                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="border-coder-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Notification & Preference Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Existing notification settings */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="expiry-alerts">Expiry Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when items are about to expire</p>
                    </div>
                    <Switch id="expiry-alerts" defaultChecked />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-days">Alert Days Before Expiry</Label>
                    <Select defaultValue="3">
                      <SelectTrigger id="alert-days" className="border-coder-primary/30">
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day before</SelectItem>
                        <SelectItem value="2">2 days before</SelectItem>
                        <SelectItem value="3">3 days before</SelectItem>
                        <SelectItem value="5">5 days before</SelectItem>
                        <SelectItem value="7">7 days before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="recipe-suggestions">Recipe Suggestions</Label>
                      <p className="text-sm text-muted-foreground">Get recipe ideas for expiring items</p>
                    </div>
                    <Switch id="recipe-suggestions" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch id="email-notifications" />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border pt-6" />

                {/* New functional preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Smart Features</h3>

                  {/* Auto-recipe notifications toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-recipe-notifs">Auto-Recipe Notifications</Label>
                      <p className="text-sm text-muted-foreground">Automatically notify when a recipe is generated for expiring items</p>
                    </div>
                    <Switch
                      id="auto-recipe-notifs"
                      checked={autoRecipeNotifications}
                      onCheckedChange={handleAutoRecipeChange}
                    />
                  </div>

                  {/* Critical alert threshold dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="critical-threshold">Critical Alert Threshold</Label>
                    <p className="text-xs text-muted-foreground mb-2">Trigger urgent alerts when items expire within this timeframe</p>
                    <Select value={criticalAlertThreshold} onValueChange={handleThresholdChange}>
                      <SelectTrigger id="critical-threshold" className="border-coder-primary/30">
                        <SelectValue placeholder="Select threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days (default)</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category urgency preset dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="urgency-preset">Category Urgency Preset</Label>
                    <p className="text-xs text-muted-foreground mb-2">Adjust urgency scoring weights for your shopping patterns</p>
                    <Select value={categoryUrgencyPreset} onValueChange={handlePresetChange}>
                      <SelectTrigger id="urgency-preset" className="border-coder-primary/30">
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (Balanced)</SelectItem>
                        <SelectItem value="dairy-meat">Mostly Dairy & Meat</SelectItem>
                        <SelectItem value="frozen">Mostly Frozen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="border-coder-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" className="border-coder-primary/30" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" className="border-coder-primary/30" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" className="border-coder-primary/30" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                </div>

                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Update Security Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <Card className="border-destructive/20 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Log Out of All Devices</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This will log you out from all devices where you're currently signed in.
                </p>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out Everywhere
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-medium mb-2 text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This action is irreversible. All your data will be permanently deleted.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirm" className="text-destructive">
                      Type DELETE to confirm
                    </Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      className="border-destructive/30 focus:border-destructive"
                    />
                  </div>
                  <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account Permanently
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-medium mb-2">Log Out</h3>
                <p className="text-sm text-muted-foreground mb-4">Log out from your current session.</p>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

