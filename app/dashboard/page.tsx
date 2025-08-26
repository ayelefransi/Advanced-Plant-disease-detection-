import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UploadSection } from "@/components/dashboard/upload-section"
import { RecentPredictions } from "@/components/dashboard/recent-predictions"
import { StatsCards } from "@/components/dashboard/stats-cards"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user's recent predictions
  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get prediction stats
  const { count: totalPredictions } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", data.user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <DashboardHeader user={data.user} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-heading mb-2">Plant Disease Detection Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Upload plant images to get instant AI-powered disease analysis
          </p>
        </div>

        <StatsCards totalPredictions={totalPredictions || 0} />

        <div className="grid lg:grid-cols-2 gap-8">
          <UploadSection />
          <RecentPredictions predictions={predictions || []} />
        </div>
      </main>
    </div>
  )
}
