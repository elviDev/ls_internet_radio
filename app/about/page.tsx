import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Radio, Headphones, BookOpen, Users, Award, Globe } from "lucide-react";

const team = [
  {
    name: "Alex Rivera",
    role: "Founder & CEO",
    image: "/placeholder.svg?height=300&width=300&text=AR",
    bio: "Alex founded WaveStream with a vision to create a platform that connects people through the power of audio. With over 15 years in broadcasting, Alex brings expertise and passion to every aspect of WaveStream.",
  },
  {
    name: "Sarah Johnson",
    role: "Head of Content",
    image: "/placeholder.svg?height=300&width=300&text=SJ",
    bio: "Sarah oversees all content creation at WaveStream. Her background in journalism and digital media has helped shape our diverse programming lineup and commitment to quality storytelling.",
  },
  {
    name: "Marcus Lee",
    role: "Technical Director",
    image: "/placeholder.svg?height=300&width=300&text=ML",
    bio: "Marcus ensures that WaveStream's technical infrastructure delivers a seamless listening experience. His innovations have been key to our growth and the development of our progressive web app.",
  },
  {
    name: "Mia Chen",
    role: "Music Director",
    image: "/placeholder.svg?height=300&width=300&text=MC",
    bio: "Mia curates our music programming and works with artists to bring exclusive content to WaveStream. Her deep knowledge of various genres has helped create our signature sound.",
  },
  {
    name: "Jordan Taylor",
    role: "Community Manager",
    image: "/placeholder.svg?height=300&width=300&text=JT",
    bio: "Jordan builds and nurtures our listener community. Through events, social media, and listener engagement initiatives, he ensures that WaveStream remains connected to our audience.",
  },
  {
    name: "Elena Rodriguez",
    role: "Voice Talent Director",
    image: "/placeholder.svg?height=300&width=300&text=ER",
    bio: "Elena works with our hosts and voice talent to deliver compelling audio content. Her background in voice acting and audio production brings a unique perspective to our team.",
  },
];

const milestones = [
  {
    year: "2018",
    title: "WaveStream Founded",
    description:
      "Alex Rivera launches WaveStream with a single podcast channel and a vision to revolutionize digital audio content.",
  },
  {
    year: "2019",
    title: "Live Broadcasting Begins",
    description:
      "WaveStream expands to include live broadcasting capabilities, reaching listeners in real-time.",
  },
  {
    year: "2020",
    title: "Mobile App Launch",
    description:
      "The WaveStream progressive web app launches, allowing listeners to enjoy content on any device.",
  },
  {
    year: "2021",
    title: "Audiobook Integration",
    description:
      "WaveStream adds audiobooks to its content library, partnering with publishers and independent authors.",
  },
  {
    year: "2022",
    title: "Community Growth",
    description:
      "WaveStream reaches 1 million registered users and expands its team to 25 full-time employees.",
  },
  {
    year: "2023",
    title: "Award-Winning Content",
    description:
      "WaveStream wins multiple industry awards for podcast excellence and innovative audio experiences.",
  },
];

const stats = [
  { value: "5M+", label: "Monthly Listeners", icon: Users },
  { value: "500+", label: "Podcast Episodes", icon: Headphones },
  { value: "200+", label: "Audiobooks", icon: BookOpen },
  { value: "24/7", label: "Live Broadcasting", icon: Radio },
  { value: "15+", label: "Industry Awards", icon: Award },
  { value: "Global", label: "Audience Reach", icon: Globe },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About WaveStream</h1>
        <p className="text-xl text-muted-foreground">
          Connecting the world through the power of audio since 2018.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="space-y-4 text-lg">
            <p>
              WaveStream began with a simple idea: to create a platform where
              audio content could thrive in the digital age. Founded in 2018 by
              Alex Rivera, we started as a small podcast network with big
              ambitions.
            </p>
            <p>
              Today, WaveStream has grown into a comprehensive audio platform
              offering podcasts, live broadcasts, and audiobooks to millions of
              listeners worldwide. Our commitment to quality content and
              technological innovation has made us a leader in digital audio
              entertainment.
            </p>
            <p>
              What sets us apart is our community-focused approach. We believe
              in the power of audio to connect people, share stories, and create
              meaningful experiences. Every feature we develop and show we
              produce is guided by this philosophy.
            </p>
          </div>
          <div className="mt-8">
            <Button className="bg-brand-600 hover:bg-brand-700">
              Join Our Team
            </Button>
          </div>
        </div>
        <div className="relative h-[400px] rounded-xl overflow-hidden">
          <Image
            src="/placeholder.svg?height=800&width=1200&text=WaveStream+Studio"
            alt="WaveStream Studio"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-6">
              <div className="mx-auto rounded-full bg-brand-100 dark:bg-brand-900 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <stat.icon className="h-6 w-6 text-brand-600 dark:text-brand-300" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Our Mission & Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mx-auto rounded-full bg-brand-100 dark:bg-brand-900 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 text-brand-600 dark:text-brand-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Accessibility</h3>
              <p className="text-muted-foreground">
                We believe audio content should be accessible to everyone. We're
                committed to creating an inclusive platform that reaches
                listeners wherever they are.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mx-auto rounded-full bg-brand-100 dark:bg-brand-900 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 text-brand-600 dark:text-brand-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality</h3>
              <p className="text-muted-foreground">
                We're dedicated to delivering the highest quality audio
                experiences, from production values to content curation and
                technical delivery.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mx-auto rounded-full bg-brand-100 dark:bg-brand-900 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 text-brand-600 dark:text-brand-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Community</h3>
              <p className="text-muted-foreground">
                We foster connections between creators and listeners, building a
                vibrant community united by a shared love of audio storytelling
                and discovery.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-muted"></div>
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative flex items-center ${
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                } gap-8`}
              >
                <div className="w-1/2 flex justify-center">
                  <div className="bg-brand-600 text-white text-xl font-bold rounded-full h-16 w-16 flex items-center justify-center z-10">
                    {milestone.year}
                  </div>
                </div>
                <Card className="w-1/2">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {milestone.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
        <Tabs defaultValue="leadership">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="leadership">Leadership</TabsTrigger>
              <TabsTrigger value="hosts">Hosts & Producers</TabsTrigger>
              <TabsTrigger value="tech">Tech Team</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="leadership" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-1">
                      {member.name}
                    </h3>
                    <p className="text-brand-600 dark:text-brand-400 mb-4">
                      {member.role}
                    </p>
                    <p className="text-muted-foreground">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="hosts" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={`/placeholder.svg?height=100&width=100&text=Host${item}`}
                        />
                        <AvatarFallback>H{item}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {
                            [
                              "Jamie Wilson",
                              "Priya Sharma",
                              "Carlos Mendez",
                              "Olivia Green",
                              "David Chen",
                              "Sophia Lee",
                            ][item - 1]
                          }
                        </h3>
                        <p className="text-sm text-brand-600 dark:text-brand-400">
                          {
                            [
                              "Morning Show Host",
                              "Tech Talk Host",
                              "Sports Central Host",
                              "Wellness Podcast Host",
                              "Science Show Producer",
                              "Cultural Corner Host",
                            ][item - 1]
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        ["Talk Show", "News", "Entertainment"],
                        ["Technology", "Business", "Innovation"],
                        ["Sports", "Analysis", "Commentary"],
                        ["Health", "Wellness", "Mindfulness"],
                        ["Science", "Education", "Discovery"],
                        ["Arts", "Culture", "History"],
                      ][item - 1].map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-muted">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {
                        [
                          "Jamie brings energy and humor to your mornings with celebrity interviews and trending topics.",
                          "Priya breaks down complex tech concepts and interviews industry leaders about the future of technology.",
                          "Carlos delivers passionate sports analysis and insider perspectives on the biggest games.",
                          "Olivia guides listeners on their wellness journey with practical advice and expert interviews.",
                          "David produces our award-winning science shows, making complex topics accessible and engaging.",
                          "Sophia explores diverse cultures and art forms, bringing global perspectives to our listeners.",
                        ][item - 1]
                      }
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="tech" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={`/placeholder.svg?height=100&width=100&text=Tech${item}`}
                        />
                        <AvatarFallback>T{item}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {
                            [
                              "Ryan Park",
                              "Aisha Patel",
                              "Thomas Wright",
                              "Zoe Chen",
                              "Miguel Santos",
                              "Leila Johnson",
                            ][item - 1]
                          }
                        </h3>
                        <p className="text-sm text-brand-600 dark:text-brand-400">
                          {
                            [
                              "Lead Developer",
                              "UX Designer",
                              "Audio Engineer",
                              "Mobile App Developer",
                              "DevOps Engineer",
                              "QA Specialist",
                            ][item - 1]
                          }
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {
                        [
                          "Ryan leads our development team, focusing on creating a seamless listening experience across all platforms.",
                          "Aisha designs intuitive user interfaces that make navigating our vast audio library simple and enjoyable.",
                          "Thomas ensures our broadcasts and recordings maintain the highest audio quality standards.",
                          "Zoe develops and maintains our progressive web app, bringing WaveStream to mobile devices worldwide.",
                          "Miguel manages our cloud infrastructure, ensuring reliability and scalability as our audience grows.",
                          "Leila rigorously tests all features before release, ensuring a bug-free experience for our listeners.",
                        ][item - 1]
                      }
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="bg-muted rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Join the WaveStream Family</h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          We're always looking for passionate individuals to join our team.
          Whether you're a content creator, developer, or audio enthusiast, we'd
          love to hear from you.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button className="bg-brand-600 hover:bg-brand-700">
            View Open Positions
          </Button>
          <Button variant="outline">Contact Us</Button>
        </div>
      </div>
    </div>
  );
}
