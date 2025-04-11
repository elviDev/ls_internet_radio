import { ProfileForm } from "@/components/auth/profile-form"

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      <ProfileForm />
    </div>
  )
}
