import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
            <CardDescription>This is a protected page that requires authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This page is only accessible to authenticated users. If you can see this, you are successfully logged in.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You can manage your account settings and view your profile information from the profile page.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
