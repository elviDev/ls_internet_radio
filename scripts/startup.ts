const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const genres = [
  { name: 'Fiction', slug: 'fiction' },
  { name: 'Non-Fiction', slug: 'non-fiction' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Business', slug: 'business' },
  { name: 'Health', slug: 'health' },
  { name: 'Education', slug: 'education' }
]

async function seedGenres() {
  try {
    const existingGenres = await prisma.genre.count()
    
    if (existingGenres > 0) {
      console.log('✅ Genres already seeded, skipping...')
      return
    }

    console.log('🌱 Seeding genres...')
    
    for (const genre of genres) {
      await prisma.genre.upsert({
        where: { slug: genre.slug },
        update: {},
        create: genre
      })
    }
    
    console.log('✅ Genres seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding genres:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedGenres()