"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Upload, ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function UploadSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [plantType, setPlantType] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [prediction, setPrediction] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      setPrediction(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
  })

  const simulateAnalysis = async (file: File, plantType: string) => {
    // Simulate AI analysis with realistic disease predictions
    const diseases = {
      tomato: [
        { name: "Early Blight", confidence: 0.89 },
        { name: "Late Blight", confidence: 0.76 },
        { name: "Leaf Mold", confidence: 0.82 },
        { name: "Septoria Leaf Spot", confidence: 0.71 },
        { name: "Bacterial Spot", confidence: 0.68 },
        { name: "Healthy", confidence: 0.95 },
      ],
      potato: [
        { name: "Early Blight", confidence: 0.87 },
        { name: "Late Blight", confidence: 0.91 },
        { name: "Healthy", confidence: 0.93 },
      ],
      pepper: [
        { name: "Bacterial Spot", confidence: 0.84 },
        { name: "Healthy", confidence: 0.88 },
      ],
    }

    const plantDiseases = diseases[plantType as keyof typeof diseases] || diseases.tomato
    const randomDisease = plantDiseases[Math.floor(Math.random() * plantDiseases.length)]

    // Simulate processing time
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    return {
      predicted_disease: randomDisease.name,
      confidence_score: randomDisease.confidence,
      plant_type: plantType,
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !plantType) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Simulate image upload and analysis
      const analysisResult = await simulateAnalysis(selectedFile, plantType)

      // Create a mock image URL (in real app, this would be uploaded to storage)
      const imageUrl = URL.createObjectURL(selectedFile)

      // Save prediction to database
      const { data: predictionData, error } = await supabase
        .from("predictions")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          plant_type: analysisResult.plant_type,
          predicted_disease: analysisResult.predicted_disease,
          confidence_score: analysisResult.confidence_score,
          status: "completed",
        })
        .select()
        .single()

      if (error) throw error

      setPrediction({
        ...predictionData,
        ...analysisResult,
      })
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setPlantType("")
    setPrediction(null)
    setUploadProgress(0)
  }

  if (prediction) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Analysis Complete
          </CardTitle>
          <CardDescription>AI analysis results for your {prediction.plant_type} plant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={prediction.image_url || "/placeholder.svg"}
              alt="Uploaded plant"
              className="w-24 h-24 object-cover rounded-lg border-2"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{prediction.predicted_disease}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {prediction.plant_type} • {(prediction.confidence_score * 100).toFixed(1)}% confidence
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confidence Score</span>
              <span className="text-sm text-muted-foreground">{(prediction.confidence_score * 100).toFixed(1)}%</span>
            </div>
            <Progress value={prediction.confidence_score * 100} className="h-2" />
          </div>

          {prediction.predicted_disease !== "Healthy" && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">Disease Detected</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    We recommend consulting our disease database for detailed treatment information.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={resetUpload} variant="outline" className="flex-1 bg-transparent">
              Analyze Another
            </Button>
            <Button onClick={() => router.push("/dashboard/history")} className="flex-1 bg-primary hover:bg-primary/90">
              View History
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="font-heading">Upload Plant Image</CardTitle>
        <CardDescription>Upload a clear image of your plant leaf for AI-powered disease detection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            {selectedFile ? (
              <>
                <ImageIcon className="w-12 h-12 text-primary mx-auto" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">{isDragActive ? "Drop your image here" : "Drag & drop an image here"}</p>
                  <p className="text-sm text-muted-foreground">or click to browse • PNG, JPG, WEBP up to 10MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Plant Type</label>
          <Select value={plantType} onValueChange={setPlantType}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select plant type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tomato">Tomato</SelectItem>
              <SelectItem value="potato">Potato</SelectItem>
              <SelectItem value="pepper">Pepper</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isUploading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing image...</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !plantType || isUploading}
          className="w-full h-12 bg-primary hover:bg-primary/90"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Analyze Plant
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
