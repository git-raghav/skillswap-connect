import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  Shield, 
  Users, 
  Flag, 
  BarChart3, 
  Ban, 
  CheckCircle, 
  Eye,
  Loader2,
  TrendingUp,
  ArrowRightLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  is_banned: boolean;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalBarters: number;
  completedBarters: number;
  pendingReports: number;
  bannedUsers: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBarters: 0,
    completedBarters: 0,
    pendingReports: 0,
    bannedUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user || !isAdmin) {
        navigate("/");
        return;
      }
      fetchData();
    }
  }, [user, isAdmin, authLoading, adminLoading]);

  const fetchData = async () => {
    try {
      // Fetch reports
      const { data: reportsData } = await supabase
        .from("user_reports")
        .select("*")
        .order("created_at", { ascending: false });

      // Get reporter and reported names
      const reportsWithNames = await Promise.all(
        (reportsData || []).map(async (report) => {
          const [reporterProfile, reportedProfile] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("user_id", report.reporter_id).maybeSingle(),
            supabase.from("profiles").select("full_name").eq("user_id", report.reported_user_id).maybeSingle(),
          ]);
          return {
            ...report,
            reporter_name: reporterProfile.data?.full_name || "Unknown",
            reported_name: reportedProfile.data?.full_name || "Unknown",
          };
        })
      );
      setReports(reportsWithNames);

      // Fetch users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(usersData || []);

      // Fetch stats
      const [bartersResult, pendingReportsResult] = await Promise.all([
        supabase.from("barter_requests").select("status"),
        supabase.from("user_reports").select("id").eq("status", "pending"),
      ]);

      const barters = bartersResult.data || [];
      const bannedCount = (usersData || []).filter(u => u.is_banned).length;

      setStats({
        totalUsers: usersData?.length || 0,
        totalBarters: barters.length,
        completedBarters: barters.filter(b => b.status === "completed").length,
        pendingReports: pendingReportsResult.data?.length || 0,
        bannedUsers: bannedCount,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("user_reports")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", reportId);

      if (error) throw error;
      
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      toast({ title: "Report updated", description: `Status changed to ${status}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleUserBan = async (userId: string, currentBanned: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !currentBanned })
        .eq("user_id", userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_banned: !currentBanned } : u));
      toast({ 
        title: currentBanned ? "User unbanned" : "User banned",
        description: currentBanned ? "User can now access the platform" : "User has been banned from the platform",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage users, reports, and platform analytics</p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.totalUsers}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Barters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.totalBarters}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold">{stats.completedBarters}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-orange-500" />
                  <span className="text-2xl font-bold">{stats.pendingReports}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Banned Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  <span className="text-2xl font-bold">{stats.bannedUsers}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList>
              <TabsTrigger value="reports" className="gap-2">
                <Flag className="w-4 h-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>User Reports</CardTitle>
                  <CardDescription>Review and manage reported users</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Reported User</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{report.reporter_name}</TableCell>
                          <TableCell>
                            <button 
                              onClick={() => navigate(`/profile/${report.reported_user_id}`)}
                              className="text-primary hover:underline"
                            >
                              {report.reported_name}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.reason}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={report.status} 
                              onValueChange={(v) => updateReportStatus(report.id, v)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="dismissed">Dismissed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/profile/${report.reported_user_id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {reports.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No reports found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage platform users</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <button 
                              onClick={() => navigate(`/profile/${u.user_id}`)}
                              className="flex items-center gap-3 hover:opacity-80"
                            >
                              <img
                                src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`}
                                alt={u.full_name}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="text-primary hover:underline">{u.full_name}</span>
                            </button>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.is_banned ? "destructive" : "secondary"}>
                              {u.is_banned ? "Banned" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant={u.is_banned ? "outline" : "destructive"} 
                                  size="sm"
                                >
                                  {u.is_banned ? "Unban" : "Ban"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {u.is_banned ? "Unban User" : "Ban User"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.is_banned 
                                      ? `Are you sure you want to unban ${u.full_name}? They will be able to access the platform again.`
                                      : `Are you sure you want to ban ${u.full_name}? They will not be able to access the platform.`
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => toggleUserBan(u.user_id, u.is_banned)}>
                                    {u.is_banned ? "Unban" : "Ban"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Platform Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Barter Completion Rate</span>
                        <span className="font-bold">
                          {stats.totalBarters > 0 
                            ? Math.round((stats.completedBarters / stats.totalBarters) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Active Users</span>
                        <span className="font-bold">{stats.totalUsers - stats.bannedUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Avg Barters per User</span>
                        <span className="font-bold">
                          {stats.totalUsers > 0 
                            ? (stats.totalBarters / stats.totalUsers).toFixed(1)
                            : 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Reports to Review</span>
                        <Badge variant={stats.pendingReports > 0 ? "destructive" : "secondary"}>
                          {stats.pendingReports}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Reports</span>
                        <span className="font-bold">{reports.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Ban Rate</span>
                        <span className="font-bold">
                          {stats.totalUsers > 0 
                            ? ((stats.bannedUsers / stats.totalUsers) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
