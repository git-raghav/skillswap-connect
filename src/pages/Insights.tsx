import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Loader2, BarChart3, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SkillDemand {
  skill: string;
  demand: number;
  supply: number;
  ratio: number;
}

const Insights = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demandData, setDemandData] = useState<SkillDemand[]>([]);
  const [topCategories, setTopCategories] = useState<{ name: string; count: number }[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBarters: 0,
    avgRating: 0,
  });

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      // Fetch profiles for skill data
      const { data: profiles } = await supabase
        .from("profiles")
        .select("skill_offered, skill_wanted");

      // Count skill demand (what people want) and supply (what people offer)
      const skillDemand: Record<string, { demand: number; supply: number }> = {};

      (profiles || []).forEach((profile) => {
        const wanted = profile.skill_wanted?.toLowerCase().trim();
        const offered = profile.skill_offered?.toLowerCase().trim();

        if (wanted) {
          if (!skillDemand[wanted]) skillDemand[wanted] = { demand: 0, supply: 0 };
          skillDemand[wanted].demand++;
        }

        if (offered) {
          if (!skillDemand[offered]) skillDemand[offered] = { demand: 0, supply: 0 };
          skillDemand[offered].supply++;
        }
      });

      // Calculate demand/supply ratio and sort
      const demandArray: SkillDemand[] = Object.entries(skillDemand)
        .map(([skill, data]) => ({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          demand: data.demand,
          supply: data.supply,
          ratio: data.supply > 0 ? data.demand / data.supply : data.demand,
        }))
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 10);

      setDemandData(demandArray);

      // Fetch category data from skills table
      const { data: skills } = await supabase.from("skills").select("category");

      const categoryCount: Record<string, number> = {};
      (skills || []).forEach((s) => {
        if (s.category) {
          categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
        }
      });

      const topCats = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopCategories(topCats);

      // Fetch stats
      const [bartersResult, ratingsResult] = await Promise.all([
        supabase.from("barter_requests").select("id"),
        supabase.from("ratings").select("rating"),
      ]);

      const avgRating = ratingsResult.data?.length
        ? ratingsResult.data.reduce((a, b) => a + b.rating, 0) / ratingsResult.data.length
        : 0;

      setStats({
        totalUsers: profiles?.length || 0,
        totalBarters: bartersResult.data?.length || 0,
        avgRating,
      });
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxDemand = Math.max(...demandData.map((d) => d.demand), 1);

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
              <BarChart3 className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Skill Insights</h1>
            </div>
            <p className="text-muted-foreground">
              Discover which skills are most in-demand on the platform
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-bold">{stats.totalUsers}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Barter Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-3xl font-bold">{stats.totalBarters}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">/ 5</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Most Wanted Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Most In-Demand Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {demandData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No skill data available yet
                    </p>
                  ) : (
                    demandData.map((skill, index) => (
                      <div key={skill.skill} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              #{index + 1}
                            </span>
                            <span className="font-medium">{skill.skill}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {skill.demand} want
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {skill.supply} offer
                            </Badge>
                          </div>
                        </div>
                        <Progress value={(skill.demand / maxDemand) * 100} className="h-2" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Top Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topCategories.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No category data available yet
                    </p>
                  ) : (
                    topCategories.map((cat, index) => (
                      <button
                        key={cat.name}
                        onClick={() => navigate(`/categories/${cat.name}`)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{cat.count} skills</Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Supply vs Demand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Supply vs Demand Gap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-red-500" />
                        High Demand, Low Supply
                      </h4>
                      <div className="space-y-2">
                        {demandData
                          .filter((s) => s.ratio > 1.5)
                          .slice(0, 5)
                          .map((skill) => (
                            <div
                              key={skill.skill}
                              className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-950/20"
                            >
                              <span>{skill.skill}</span>
                              <Badge variant="destructive">
                                {skill.ratio.toFixed(1)}x demand
                              </Badge>
                            </div>
                          ))}
                        {demandData.filter((s) => s.ratio > 1.5).length === 0 && (
                          <p className="text-muted-foreground text-sm">
                            No significant gaps found
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-green-500" />
                        High Supply, Low Demand
                      </h4>
                      <div className="space-y-2">
                        {demandData
                          .filter((s) => s.ratio < 0.7 && s.supply > 0)
                          .slice(0, 5)
                          .map((skill) => (
                            <div
                              key={skill.skill}
                              className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-950/20"
                            >
                              <span>{skill.skill}</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                {(1 / skill.ratio).toFixed(1)}x supply
                              </Badge>
                            </div>
                          ))}
                        {demandData.filter((s) => s.ratio < 0.7 && s.supply > 0).length === 0 && (
                          <p className="text-muted-foreground text-sm">
                            No oversupply found
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Insights;
