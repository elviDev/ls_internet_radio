import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const genres = [
  { name: 'Rock', slug: 'rock', description: 'Rock music genre' },
  { name: 'Pop', slug: 'pop', description: 'Pop music genre' },
  { name: 'Jazz', slug: 'jazz', description: 'Jazz music genre' },
  { name: 'Classical', slug: 'classical', description: 'Classical music genre' },
  { name: 'Hip Hop', slug: 'hip-hop', description: 'Hip hop music genre' },
  { name: 'Electronic', slug: 'electronic', description: 'Electronic music genre' },
  { name: 'Country', slug: 'country', description: 'Country music genre' },
  { name: 'R&B', slug: 'rnb', description: 'R&B music genre' },
  { name: 'Folk', slug: 'folk', description: 'Folk music genre' },
  { name: 'Blues', slug: 'blues', description: 'Blues music genre' }
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
  
  console.log('Genres seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })