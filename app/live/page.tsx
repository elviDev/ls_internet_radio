"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageSquare,
  Send,
  Users,
  Share,
  Download,
  Calendar,
  Clock,
  Mic,
  Crown,
  UserCheck,
  Headphones,
  ThumbsUp,
  Settings,
  PhoneCall,
  Smartphone,
  Laptop,
  Music,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveBroadcast {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "LIVE" | "SCHEDULED" | "ENDED";
  hostUser: {
    id: string;
    name: string;
    email: string;
  };
  banner?: {
    url: string;
    originalName: string;
  };
  staff: BroadcastStaff[];
  guests: BroadcastGuest[];
  startTime: string;
  endTime?: string;
  streamUrl?: string;
  listenerCount: number;
  currentTrack?: {
    title: string;
    artist: string;
    duration: number;
    progress: number;
  };
}

interface BroadcastStaff {
  id: string;
  role: "HOST" | "CO_HOST" | "PRODUCER" | "SOUND_ENGINEER" | "GUEST" | "MODERATOR";
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    profileImage?: string;
  };
  isActive: boolean;
}

interface BroadcastGuest {
  id: string;
  name: string;
  title?: string;
  role: string;
  isConnected: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  type: "listener" | "staff" | "system";
  likes: number;
  isLiked: boolean;
}

interface UpcomingShow {
  id: string;
  title: string;
  description: string;
  host: string;
  startTime: string;
  duration: number;
  banner?: string;
}

export default function LivePlayerPage() {
  const { toast } = useToast();
  
  const [liveBroadcast, setLiveBroadcast] = useState<LiveBroadcast | null>(null);
  const [upcomingShows, setUpcomingShows] = useState<UpcomingShow[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [isUserNameSet, setIsUserNameSet] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [audioQuality, setAudioQuality] = useState<"high" | "medium" | "low">("high");
  const [connectDevice, setConnectDevice] = useState<"web" | "mobile" | "desktop">("web");
  const [showShareDialog, setShowShareDialog] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLiveBroadcast();
    fetchUpcomingShows();
    simulateRealTimeUpdates();
    
    // Check if user name is stored
    const storedUserName = localStorage.getItem("radio_user_name");
    if (storedUserName) {
      setUserName(storedUserName);
      setIsUserNameSet(true);
    } else {
      setShowUserDialog(true);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  const fetchLiveBroadcast = async () => {
    try {
      const response = await fetch("/api/broadcasts/live");
      if (response.ok) {
        const data = await response.json();
        setLiveBroadcast(data);
        
        if (data?.streamUrl && audioRef.current) {
          audioRef.current.src = data.streamUrl;
        }
      }
    } catch (error) {
      console.error("Error fetching live broadcast:", error);
    }
  };

  const fetchUpcomingShows = async () => {
    try {
      const response = await fetch("/api/broadcasts/upcoming");
      if (response.ok) {
        const data = await response.json();
        setUpcomingShows(data.broadcasts || []);
      }
    } catch (error) {
      console.error("Error fetching upcoming shows:", error);
    }
  };

  const simulateRealTimeUpdates = () => {
    const interval = setInterval(() => {
      // Simulate new chat messages
      if (Math.random() > 0.7 && liveBroadcast) {
        const messages = [
          "Great show! 🎵",
          "Love this song!",
          "Hello from Tokyo! 🗾",
          "Amazing broadcast as always",
          "Can you play some jazz next?",
          "This is my favorite radio station! ❤️",
          "Perfect music for work",
          "Greetings from London! 🇬🇧"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const randomUser = `Listener${Math.floor(Math.random() * 1000)}`;
        
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: randomUser,
          message: randomMessage,
          timestamp: new Date().toLocaleTimeString(),
          type: "listener",
          likes: Math.floor(Math.random() * 10),
          isLiked: false,
        };
        
        setChatMessages(prev => [...prev.slice(-49), newMessage]); // Keep last 50 messages
      }

      // Update listener count
      if (liveBroadcast) {
        setLiveBroadcast(prev => prev ? {
          ...prev,
          listenerCount: prev.listenerCount + Math.floor(Math.random() * 5) - 2
        } : null);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const handlePlayPause = () => {
    if (!liveBroadcast) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().then(() => {
        setIsPlaying(true);
        toast({
          title: "Connected to Live Stream",
          description: `Now listening to ${liveBroadcast.title}`,
        });
      }).catch((error) => {
        console.error("Error playing audio:", error);
        toast({
          title: "Connection Error",
          description: "Unable to connect to the live stream. Please try again.",
          variant: "destructive",
        });
      });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isUserNameSet) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
      type: "listener",
      likes: 0,
      isLiked: false,
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage("");

    // Here you would also send the message to the server
    // await fetch("/api/broadcasts/chat", { method: "POST", body: JSON.stringify(message) });
  };

  const handleLikeMessage = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, likes: msg.isLiked ? msg.likes - 1 : msg.likes + 1, isLiked: !msg.isLiked }
        : msg
    ));
  };

  const handleSetUserName = () => {
    if (userName.trim()) {
      localStorage.setItem("radio_user_name", userName.trim());
      setIsUserNameSet(true);
      setShowUserDialog(false);
      toast({
        title: "Welcome!",
        description: `You're now listening as ${userName}`,
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && liveBroadcast) {
      try {
        await navigator.share({
          title: liveBroadcast.title,
          text: `Listen to ${liveBroadcast.title} live!`,
          url: typeof window !== 'undefined' ? window.location.href : '',
        });
      } catch (error) {
        // Fallback to clipboard
        if (typeof window !== 'undefined') {
          navigator.clipboard.writeText(window.location.href);
        }
        toast({
          title: "Link Copied",
          description: "Share link copied to clipboard!",
        });
      }
    } else if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard!",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "HOST": return Crown;
      case "CO_HOST": return Mic;
      case "PRODUCER": return Settings;
      case "SOUND_ENGINEER": return Headphones;
      case "GUEST": return UserCheck;
      case "MODERATOR": return Users;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "HOST": return "bg-purple-100 text-purple-800 border-purple-200";
      case "CO_HOST": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PRODUCER": return "bg-green-100 text-green-800 border-green-200";
      case "SOUND_ENGINEER": return "bg-orange-100 text-orange-800 border-orange-200";
      case "GUEST": return "bg-gray-100 text-gray-800 border-gray-200";
      case "MODERATOR": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTimeToShow = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));
      return diffInMinutes > 0 ? `${diffInMinutes}m` : "Starting soon";
    }
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Radio className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LS Internet Radio</h1>
                <p className="text-sm text-gray-500">Live from the studio</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {liveBroadcast && (
                <Badge variant="destructive" className="animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {liveBroadcast?.listenerCount || 0} listening
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Player */}
          <div className="lg:col-span-2 space-y-6">
            {liveBroadcast ? (
              <Card className="overflow-hidden">
                {/* Banner */}
                {liveBroadcast.banner && (
                  <div className="h-48 bg-gradient-to-r from-purple-600 to-blue-600 relative overflow-hidden">
                    <img 
                      src={liveBroadcast.banner.url} 
                      alt={liveBroadcast.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40" />
                    <div className="absolute bottom-4 left-6 text-white">
                      <h2 className="text-2xl font-bold">{liveBroadcast.title}</h2>
                      <p className="text-sm opacity-90">{liveBroadcast.description}</p>
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Player Controls */}
                  <div className="flex items-center justify-center space-x-6 mb-6">
                    <Button
                      size="lg"
                      onClick={handlePlayPause}
                      className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8 text-white" />
                      ) : (
                        <Play className="h-8 w-8 text-white ml-1" />
                      )}
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center space-x-4 mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={100}
                      step={1}
                      className="flex-1"
                      disabled={isMuted}
                    />
                    <span className="text-sm text-gray-500 w-10">{isMuted ? 0 : volume[0]}%</span>
                  </div>

                  {/* Now Playing */}
                  {liveBroadcast.currentTrack && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{liveBroadcast.currentTrack.title}</p>
                          <p className="text-sm text-gray-600">{liveBroadcast.currentTrack.artist}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${(liveBroadcast.currentTrack.progress / liveBroadcast.currentTrack.duration) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Host & Team */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">On Air Now</h3>
                    
                    {/* Host */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{liveBroadcast.hostUser.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{liveBroadcast.hostUser.name}</span>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            <Crown className="h-3 w-3 mr-1" />
                            HOST
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Staff */}
                    {liveBroadcast.staff.length > 0 && (
                      <div className="space-y-2">
                        {liveBroadcast.staff.map((member) => {
                          const Icon = getRoleIcon(member.role);
                          return (
                            <div key={member.id} className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.user.profileImage} />
                                <AvatarFallback className="text-xs">{member.user.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{member.user.name}</span>
                                <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                                  <Icon className="h-2 w-2 mr-1" />
                                  {member.role.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Guests */}
                    {liveBroadcast.guests.length > 0 && (
                      <div className="space-y-2">
                        <Separator />
                        <h4 className="text-sm font-medium text-gray-700">Special Guests</h4>
                        {liveBroadcast.guests.map((guest) => (
                          <div key={guest.id} className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{guest.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{guest.name}</span>
                              {guest.title && (
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                  {guest.title}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                                {guest.role}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Radio className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Live Broadcast</h3>
                  <p className="text-gray-600 text-center">
                    There's no live broadcast at the moment. Check back later or see our upcoming shows below.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Shows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Shows
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingShows.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingShows.map((show) => (
                      <div key={show.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        {show.banner && (
                          <div className="h-16 w-16 bg-gray-200 rounded-lg overflow-hidden">
                            <img src={show.banner} alt={show.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{show.title}</h4>
                          <p className="text-sm text-gray-600">{show.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>Host: {show.host}</span>
                            <span>•</span>
                            <span>{new Date(show.startTime).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(show.startTime).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeToShow(show.startTime)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No upcoming shows scheduled.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Sidebar */}
          <div className="space-y-6">
            {/* Chat */}
            <Card className="h-96 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Live Chat
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(!showChat)}
                  >
                    {showChat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {showChat && (
                <>
                  <CardContent className="flex-1 overflow-y-auto">
                    <div className="space-y-3">
                      {chatMessages.map((message) => (
                        <div key={message.id} className="space-y-1">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="font-medium text-gray-700">{message.sender}</span>
                            <span className="text-gray-500">{message.timestamp}</span>
                            <Badge variant="outline" className={`text-xs ${
                              message.type === 'staff' ? 'bg-blue-100 text-blue-800' : 
                              message.type === 'system' ? 'bg-gray-100 text-gray-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {message.type}
                            </Badge>
                          </div>
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-gray-900 flex-1">{message.message}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeMessage(message.id)}
                              className="p-1 h-auto ml-2"
                            >
                              <div className="flex items-center space-x-1">
                                <Heart className={`h-3 w-3 ${message.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                {message.likes > 0 && <span className="text-xs">{message.likes}</span>}
                              </div>
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </CardContent>
                  
                  <div className="p-4 border-t">
                    {isUserNameSet ? (
                      <div className="flex space-x-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Say something..."
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setShowUserDialog(true)}
                        className="w-full"
                        variant="outline"
                      >
                        Set your name to chat
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card>

            {/* Audio Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Audio Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Quality</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant={audioQuality === "low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAudioQuality("low")}
                    >
                      Low
                    </Button>
                    <Button
                      variant={audioQuality === "medium" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAudioQuality("medium")}
                    >
                      Medium
                    </Button>
                    <Button
                      variant={audioQuality === "high" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAudioQuality("high")}
                    >
                      High
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Connect Device</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant={connectDevice === "web" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConnectDevice("web")}
                    >
                      <Laptop className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={connectDevice === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConnectDevice("mobile")}
                    >
                      <Smartphone className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={connectDevice === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConnectDevice("desktop")}
                    >
                      <PhoneCall className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* User Name Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to LS Internet Radio!</DialogTitle>
            <DialogDescription>
              Set your display name to join the live chat and interact with other listeners.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              onKeyPress={(e) => e.key === 'Enter' && handleSetUserName()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Skip
            </Button>
            <Button onClick={handleSetUserName} disabled={!userName.trim()}>
              Join Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Live Radio</DialogTitle>
            <DialogDescription>
              Share this live broadcast with your friends and family.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(window.location.href);
                  }
                  toast({ title: "Copied!", description: "Link copied to clipboard" });
                }}
                variant="outline"
              >
                Copy
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download App
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="none" />
    </div>
  );
}