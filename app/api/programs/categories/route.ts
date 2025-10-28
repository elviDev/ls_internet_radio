import { NextResponse } from "next/server"

export async function GET() {
  try {
    const categories = [
      "All",
      "Talk Show",
      "Music", 
      "Technology",
      "Business",
      "Interview",
      "Sports",
      "News",
      "Entertainment",
      "Education"
    ]

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching program categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}