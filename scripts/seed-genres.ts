import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const genres = [
  { name: 'Fiction', slug: 'fiction' },
  { name: 'Non-Fiction', slug: 'non-fiction' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Business', slug: 'business' },
  { name: 'Health', slug: 'health' },
  { name: 'Education', slug: 'education' }
]

async function main() {
  console.log('Seeding genres...')
  
  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: genre
    })
  }
  
  console.log('✅ Genres seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })