"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScanLine, Camera, X, Check, Edit, ArrowRight, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createWorker } from "tesseract.js"

export default function ScanPage() {
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [productName, setProductName] = useState("")
  const [productCategory, setProductCategory] = useState("other")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const [tesseractWorker, setTesseractWorker] = useState<any>(null)

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = await createWorker("eng")
        setTesseractWorker(worker)
      } catch (error) {
        console.error("Error initializing Tesseract worker:", error)
        toast({
          title: "Error",
          description: "Failed to initialize text recognition. Please try again.",
          variant: "destructive",
        })
      }
    }

    initWorker()

    return () => {
      if (tesseractWorker) {
        tesseractWorker.terminate()
      }
    }
  }, [])

  // Start camera for scanning
  const startScanning = async () => {
    setShowOptions(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setScanning(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      })
      setScanning(false)
      setShowOptions(true)
    }
  }

  // Stop camera
  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setScanning(false)
    }
  }

  // Capture frame from video
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current && scanning) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw the current video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to data URL
        const imageData = canvas.toDataURL("image/png")
        setCapturedImage(imageData)

        // Process the image with Tesseract
        processImage(imageData)
      }
    }
  }

  // Process image with Tesseract OCR
  const processImage = async (imageData: string) => {
    if (!tesseractWorker) {
      toast({
        title: "OCR Error",
        description: "Text recognition engine is not ready. Please try again.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      // Configure Tesseract for better date recognition
      await tesseractWorker.setParameters({
        tessedit_char_whitelist: "0123456789/.-:",
        preserve_interword_spaces: "1",
      })

      // Recognize text in the image
      const { data } = await tesseractWorker.recognize(imageData)

      // Extract date patterns from the recognized text
      const datePattern = extractDateFromText(data.text)

      if (datePattern) {
        setResult(datePattern)
        stopScanning()
        setShowProductForm(true)
      } else {
        toast({
          title: "No date found",
          description: "Could not detect an expiry date. Please try again or enter manually.",
          variant: "warning",
        })
        setCapturedImage(null)
      }
    } catch (error) {
      console.error("OCR processing error:", error)
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // Extract date patterns from text
  const extractDateFromText = (text: string): string | null => {
    console.log("OCR Result:", text) // For debugging

    // Common date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD, DD-MM-YYYY, etc.
    const datePatterns = [
      /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g, // DD/MM/YYYY or MM/DD/YYYY
      /\b\d{2,4}[/\-.]\d{1,2}[/\-.]\d{1,2}\b/g, // YYYY/MM/DD
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{2,4}\b/gi, // Month DD, YYYY
      /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{2,4}\b/gi, // DD Month YYYY
      /\bBest Before:?\s+\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/gi, // Best Before: DD/MM/YYYY
      /\bExp(?:iry|\.)?:?\s+\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/gi, // Expiry: DD/MM/YYYY
      /\bUse By:?\s+\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/gi, // Use By: DD/MM/YYYY
    ]

    // Try to match any of the patterns
    for (const pattern of datePatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        return matches[0]
      }
    }

    // If no pattern matched, try to find any sequence of numbers that might be a date
    const numberGroups = text.match(/\b\d+\b/g)
    if (numberGroups && numberGroups.length >= 3) {
      // Try to construct a date from consecutive numbers
      for (let i = 0; i < numberGroups.length - 2; i++) {
        const day = Number.parseInt(numberGroups[i])
        const month = Number.parseInt(numberGroups[i + 1])
        const year = Number.parseInt(numberGroups[i + 2])

        // Basic validation for a potential date
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return `${day}/${month}/${year}`
        }
      }
    }

    return null
  }

  // Add product to inventory
  const addProductToInventory = () => {
    if (!productName || !result) {
      toast({
        title: "Missing information",
        description: "Please provide both product name and expiry date",
        variant: "destructive",
      })
      return
    }

    try {
      // Parse the date from the result
      const dateStr = result.replace(/[^\d/\-.]/g, "") // Remove non-date characters
      const dateParts = dateStr.split(/[/\-.]/)

      let expiryDate: Date

      // Try to determine date format and create a valid date
      if (dateParts.length === 3) {
        // Assume DD/MM/YYYY format if first part is <= 31
        if (Number.parseInt(dateParts[0]) <= 31 && Number.parseInt(dateParts[1]) <= 12) {
          expiryDate = new Date(`${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`)
        } else {
          // Otherwise try MM/DD/YYYY
          expiryDate = new Date(`${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`)
        }
      } else {
        // If we can't parse it properly, use current date + 7 days as fallback
        expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
      }

      // Calculate days left until expiry
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      expiryDate.setHours(0, 0, 0, 0)
      const diffTime = Math.abs(expiryDate.getTime() - today.getTime())
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Create new inventory item
      const newItem = {
        id: Date.now(),
        name: productName,
        category: productCategory,
        expiryDate: expiryDate.toISOString(),
        daysLeft,
        quantity: 1,
      }

      // Get existing inventory or initialize empty array
      const existingInventory = JSON.parse(localStorage.getItem("inventory") || "[]")
      localStorage.setItem("inventory", JSON.stringify([...existingInventory, newItem]))

      toast({
        title: "Product added",
        description: "Product has been added to your inventory",
      })

      // Redirect to inventory page
      router.push("/inventory")
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Navigate to manual entry
  const goToManualEntry = () => {
    router.push("/add-manual")
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent text-center">Add Product</h1>

      {showOptions && !result && !showProductForm ? (
        <div className="grid grid-cols-1 gap-4 mb-6">
          <Card
            className="border-coder-primary/20 hover:border-coder-primary/50 transition-colors cursor-pointer"
            onClick={startScanning}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Camera className="mr-2 h-5 w-5 text-coder-primary" />
                Scan Expiry Date with Camera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Use your camera to scan the expiry date from a product</p>
              <Button className="w-full mt-4">
                Start Camera <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-coder-accent/20 hover:border-coder-accent/50 transition-colors cursor-pointer"
            onClick={goToManualEntry}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Edit className="mr-2 h-5 w-5 text-coder-accent" />
                Enter Manually
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manually enter product details and expiry date</p>
              <Button
                variant="outline"
                className="w-full mt-4 border-coder-accent/50 text-coder-accent hover:bg-coder-accent/10"
              >
                Enter Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : showProductForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scanned-date">Scanned Expiry Date</Label>
              <Input id="scanned-date" value={result || ""} readOnly className="bg-muted" />
            </div>

            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="border-coder-primary/30"
              />
            </div>

            <div>
              <Label htmlFor="product-category">Category</Label>
              <select
                id="product-category"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-coder-primary/30 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="bakery">Bakery</option>
                <option value="frozen">Frozen</option>
                <option value="canned">Canned</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="other">Other</option>
              </select>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-0 relative">
            {!result ? (
              <>
                <div className="aspect-video bg-muted relative overflow-hidden rounded-md">
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 border-2 border-primary rounded-lg flex items-center justify-center">
                        <ScanLine className="h-8 w-8 text-primary animate-pulse" />
                      </div>
                    </div>
                  )}
                  {processing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-card p-4 rounded-lg flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                        <p className="text-sm">Processing image...</p>
                      </div>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center rounded-md">
                <div className="text-center p-6">
                  <Check className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Scan Complete</h3>
                  <p className="text-muted-foreground mb-4">{result}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        {showProductForm ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null)
                setShowProductForm(false)
                setShowOptions(true)
              }}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={addProductToInventory} className="flex-1">
              <Check className="mr-2 h-4 w-4" /> Add to Inventory
            </Button>
          </>
        ) : !showOptions && !scanning && !result ? (
          <Button variant="outline" onClick={() => setShowOptions(true)} className="flex-1">
            <X className="mr-2 h-4 w-4" /> Back to Options
          </Button>
        ) : !result && scanning ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                stopScanning()
                setShowOptions(true)
              }}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={captureFrame} className="flex-1" disabled={processing}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              Capture
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}

