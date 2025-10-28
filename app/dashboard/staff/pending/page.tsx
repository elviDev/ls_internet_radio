"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Mail, 
  Phone, 
  User,
  Calendar,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface PendingStaff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone?: string;
  requestedRole: string;
  department?: string;
  position?: string;
  bio?: string;
  createdAt: string;
}

export default function PendingStaffPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [pendingStaff, setPendingStaff] = useState<PendingStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<PendingStaff | null>(null);
  
  const isAdmin = user?.role === 'ADMIN';

  const fetchPendingStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/staff/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingStaff(data.pendingStaff || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch pending staff applications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching pending staff:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStaff = async (staffId: string) => {
    try {
      const response = await fetch(`/api/admin/staff/${staffId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Staff member approved successfully",
        });
        fetchPendingStaff();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to approve staff member",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving staff:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleRejectStaff = async (staffId: string) => {
    try {
      const response = await fetch(`/api/admin/staff/${staffId}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Staff application rejected",
        });
        fetchPendingStaff();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to reject staff application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error rejecting staff:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPendingStaff();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      HOST: "bg-blue-100 text-blue-800",
      CO_HOST: "bg-green-100 text-green-800",
      PRODUCER: "bg-purple-100 text-purple-800",
      SOUND_ENGINEER: "bg-orange-100 text-orange-800",
      CONTENT_MANAGER: "bg-pink-100 text-pink-800",
      TECHNICAL_SUPPORT: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Pending Staff Applications</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/staff">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pending Staff Applications</h1>
            <p className="text-slate-600 mt-1">Review and approve staff registration requests</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-8 w-8 text-orange-600" />
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            {pendingStaff.length} Pending
          </Badge>
        </div>
      </div>

      {pendingStaff.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">All Caught Up!</h3>
            <p className="text-slate-600">
              No pending staff applications to review at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Applications Awaiting Review</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {staff.firstName} {staff.lastName}
                          </div>
                          <div className="text-sm text-gray-500">@{staff.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{staff.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(staff.requestedRole)}>
                        {formatRole(staff.requestedRole)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(staff.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStaff(staff)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Staff Application Details</DialogTitle>
                              <DialogDescription>
                                Review the complete application from {selectedStaff?.firstName} {selectedStaff?.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedStaff && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <strong>Name:</strong> {selectedStaff.firstName} {selectedStaff.lastName}
                                  </div>
                                  <div>
                                    <strong>Username:</strong> @{selectedStaff.username}
                                  </div>
                                  <div>
                                    <strong>Email:</strong> {selectedStaff.email}
                                  </div>
                                  <div>
                                    <strong>Phone:</strong> {selectedStaff.phone || "Not provided"}
                                  </div>
                                  <div>
                                    <strong>Requested Role:</strong> {formatRole(selectedStaff.requestedRole)}
                                  </div>
                                  <div>
                                    <strong>Department:</strong> {selectedStaff.department || "Not specified"}
                                  </div>
                                </div>
                                {selectedStaff.position && (
                                  <div>
                                    <strong>Position:</strong> {selectedStaff.position}
                                  </div>
                                )}
                                {selectedStaff.bio && (
                                  <div>
                                    <strong>Bio/Experience:</strong>
                                    <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                      {selectedStaff.bio}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <strong>Applied:</strong> {new Date(selectedStaff.createdAt).toLocaleString()}
                                </div>
                              </div>
                            )}
                            <DialogFooter className="flex space-x-2">
                              {isAdmin && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                      </Button>
                                    </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Application</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to reject this staff application? 
                                      The applicant account will be removed from the system.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => selectedStaff && handleRejectStaff(selectedStaff.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Reject Application
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                                  </AlertDialog>
                                  
                                  <Button
                                    onClick={() => selectedStaff && handleApproveStaff(selectedStaff.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                </>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveStaff(staff.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Application</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject this staff application from {staff.firstName} {staff.lastName}? 
                                    The applicant account will be removed from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRejectStaff(staff.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Reject Application
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}