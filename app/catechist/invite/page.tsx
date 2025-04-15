"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function InvitePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState("")

  async function handleGenerateLink(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this would create a unique invite link
      const baseUrl = window.location.origin
      const token = Math.random().toString(36).substring(2, 15)
      const link = `${baseUrl}/register/catechumen?token=${token}&parish=parish_id_here`

      setInviteLink(link)
      setSuccess(true)
    } catch (err) {
      setError("Failed to generate invite link")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Invite Catechumens</h1>

      <Card>
        <form action={handleGenerateLink}>
          <CardHeader>
            <CardTitle>Create Invitation</CardTitle>
            <CardDescription>Generate a link to invite catechumens to join your parish</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Group Name (Optional)</Label>
              <Input id="name" name="name" placeholder="e.g., First Communion Class 2023" />
              <p className="text-xs text-gray-500">This helps you identify which group this invitation is for</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea id="message" name="message" placeholder="Enter a custom message for your invitation" />
            </div>

            {success && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                <h3 className="font-semibold text-green-800 mb-2">Invitation Link Generated!</h3>
                <div className="bg-white p-3 rounded border text-sm break-all mb-2">{inviteLink}</div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink)
                    }}
                  >
                    Copy Link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `mailto:?subject=Join our Catholic Catechism&body=You're invited to join our Catholic Catechism program. Click the link below to register:%0A%0A${encodeURIComponent(inviteLink)}`,
                        "_blank",
                      )
                    }}
                  >
                    Email Link
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? "Generating..." : success ? "Generated!" : "Generate Invite Link"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
