import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const programs = [
  {
    id: 1,
    title: "Morning Vibes",
    host: "Alex Rivera",
    schedule: "Weekdays, 7AM - 10AM",
    image: "/placeholder.svg?height=200&width=400",
    category: "Talk Show",
  },
  {
    id: 2,
    title: "Afternoon Acoustics",
    host: "Mia Chen",
    schedule: "Weekdays, 2PM - 4PM",
    image: "/placeholder.svg?height=200&width=400",
    category: "Music",
  },
  {
    id: 3,
    title: "Evening Discussions",
    host: "Jordan Taylor",
    schedule: "Mon, Wed, Fri, 7PM - 9PM",
    image: "/placeholder.svg?height=200&width=400",
    category: "Interview",
  },
];

export default function FeaturedPrograms() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {programs.map((program) => (
        <Link href={`/programs/${program.id}`} key={program.id}>
          <Card className="overflow-hidden hover:shadow-md transition-all h-full">
            <div className="relative h-40">
              <Image
                src={program.image || "/placeholder.svg"}
                alt={program.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 left-3">
                <Badge className="bg-brand-600 hover:bg-brand-700">
                  {program.category}
                </Badge>
              </div>
            </div>
            <CardContent className="p-5">
              <h3 className="font-semibold text-lg mb-1">{program.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                with {program.host}
              </p>
              <div className="text-xs font-medium bg-purple-100 text-brand-800 px-3 py-1 rounded-full inline-block">
                {program.schedule}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
