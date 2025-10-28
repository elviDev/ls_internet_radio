import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"
import { sendEmail } from "@/lib/email/sendEmail"
import { nanoid } from "nanoid"

// POST /api/admin/podcasts/invitations - Send guest invitations
export const POST = adminOnly(async (req: Request) => {
  try {
    const { podcastId, podcastTitle, guests } = await req.json()

    if (!podcastId || !podcastTitle || !guests || !Array.isArray(guests)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const invitations = []

    for (const guest of guests) {
      // Generate unique invitation token
      const invitationToken = nanoid(32)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Create guest invitation record
      const invitation = await prisma.guestInvitation.create({
        data: {
          podcastId,
          guestName: guest.name,
          guestEmail: guest.email,
          invitationToken,
          expiresAt,
          status: 'PENDING'
        }
      })

      // Generate invitation link
      const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/guest/join/${invitationToken}`

      // Send invitation email
      const emailSent = await sendGuestInvitationEmail({
        guestName: guest.name,
        guestEmail: guest.email,
        podcastTitle,
        invitationLink,
        expiresAt
      })

      invitations.push({
        ...invitation,
        emailSent
      })
    }

    return NextResponse.json({
      success: true,
      invitations,
      message: `${invitations.length} invitation(s) sent successfully`
    })
  } catch (error) {
    console.error("Error sending invitations:", error)
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    )
  }
})

async function sendGuestInvitationEmail({
  guestName,
  guestEmail,
  podcastTitle,
  invitationLink,
  expiresAt
}: {
  guestName: string
  guestEmail: string
  podcastTitle: string
  invitationLink: string
  expiresAt: Date
}) {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎙️ Podcast Invitation</h1>
        </div>
        
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${guestName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You've been invited to participate as a guest in the podcast episode:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin: 0 0 10px 0;">${podcastTitle}</h3>
            <p style="color: #666; margin: 0;">Join the conversation and share your insights!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Join Podcast Session
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⏰ Important:</strong> This invitation expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you don't have an account yet, you'll be able to create one when you click the link above. 
            If you already have an account, you'll be notified in your dashboard.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This invitation was sent by our radio station. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `

    await sendEmail({
      to: guestEmail,
      subject: `🎙️ You're invited to join "${podcastTitle}" podcast`,
      html: emailContent
    })

    return true
  } catch (error) {
    console.error("Failed to send invitation email:", error)
    return false
  }
}