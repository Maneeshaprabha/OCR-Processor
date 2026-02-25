"use client";

import React, { useState, useEffect } from "react";
import { FileText, Upload, Download, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Card from "../components/ui/card";
import { useTranslation } from "react-i18next";
import  client from "@/lib/supabaseClient";
import { useAuth } from "@/app/components/context/AuthProvider";

const actionCardsConfig = [
  {
    icon: Upload,
    href: "/upload",
    titleKey: "uploadTitle",
    descKey: "uploadDesc",
  },
  {
    icon: Download,
    href: "/export",
    titleKey: "exportTitle",
    descKey: "exportDesc",
  },
];

export default function DashboardHome() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    exports: 0,
    successRate: "0%",
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let timeoutId = null;

    if (authLoading) return;

    const fetchDashboardData = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        if (showLoading) {
          timeoutId = setTimeout(() => {
            setIsLoading(false);
          }, 8000);
        }

        const { data: sessionData } = await client.auth.getSession();
        const activeUser = sessionData?.session?.user || user;

        if (!activeUser) {
           setIsLoading(false);
           return;
        }

        const { data: docs, error: docsError } = await client
          .from("documents")
          .select("id, status, created_at, file_name")
          .eq("user_id", activeUser.id)
          .order("created_at", { ascending: false });

        if (docsError) {
          console.error("Dashboard docs fetch error:", docsError.message);
          throw docsError;
        }

        if (docs) {
          const total = docs.length;

          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const today = docs.filter(
            (d) => new Date(d.created_at) >= todayStart,
          ).length;

          const completed = docs.filter((d) => d.status === "completed").length;
          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

          setStats({
            total,
            today,
            exports: total,
            successRate: `${rate}%`,
          });

          setRecentDocs(docs.slice(0, 3));
        }
      } catch (error) {
        console.error("Unexpected error fetching dashboard data:", error);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (showLoading) setIsLoading(false);
      }
    };

    fetchDashboardData(true);

    const subscription = client
      .channel(`dashboard_changes_${user.id}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDashboardData(false);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(subscription);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, authLoading, pathname]);

  const metricCardsConfig = [
    {
      icon: FileText,
      value: String(stats.total),
      change: "",
      iconBg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3B82F6",
      labelKey: "totalDocuments",
    },
    {
      icon: Upload,
      value: String(stats.today),
      change: "",
      iconBg: "rgba(34, 197, 94, 0.1)",
      iconColor: "#22C55E",
      labelKey: "processedToday",
    },
    {
      icon: Download,
      value: String(stats.exports),
      change: "",
      iconBg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#AD46FF",
      labelKey: "exports",
    },
    {
      icon: TrendingUp,
      value: stats.successRate,
      change: "",
      iconBg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#FF6900",
      labelKey: "successRate",
    },
  ];

  return (
    <div className="min-h-full w-full overflow-x-hidden p-4 sm:p-6 bg-background">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">
          {t("dashboard.title")}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {metricCardsConfig.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.labelKey}
              className="rounded-2xl border-border bg-card shadow-sm"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div
                  className="p-1.5 rounded-xl sm:p-2"
                  style={{ backgroundColor: card.iconBg }}
                >
                  <Icon
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    style={{ color: card.iconColor }}
                  />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground sm:text-2xl">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  card.value
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                {t(`dashboard.metrics.${card.labelKey}`)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Action Cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4">
        {actionCardsConfig.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.titleKey} href={card.href} className="block">
              <Card className="h-full rounded-2xl border-border shadow-sm transition-shadow hover:shadow-md bg-card">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className="shrink-0 rounded-xl p-2 sm:p-3"
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  >
                    <Icon
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      style={{ color: "#717182" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground sm:text-base">
                      {t(`dashboard.actions.${card.titleKey}`)}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                      {t(`dashboard.actions.${card.descKey}`)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Documents */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <h3 className="text-sm font-semibold text-foreground sm:text-base">
            {t("dashboard.recent.title")}
          </h3>
          <Link
            href="/export"
            className="text-xs text-muted-foreground transition hover:text-foreground sm:text-sm"
          >
            {t("dashboard.recent.viewAll")}
          </Link>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentDocs.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.noUploaded")}
            </div>
          ) : (
            recentDocs.map((doc) => {
              const confidence = null;
              return (
                <div
                  key={doc.id}
                  className="flex flex-col gap-2 px-4 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div
                      className="shrink-0 rounded-lg p-1.5 sm:p-2"
                      style={{ backgroundColor: "rgba(59, 130, 246, 0.08)" }}
                    >
                      <FileText className="w-3.5 h-3.5 text-muted-foreground sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {doc.file_name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-11 sm:gap-4 sm:pl-0 sm:shrink-0">
                    {confidence && (
                      <span className="text-xs text-muted-foreground">
                        {t("dashboard.recent.confidence")}
                        <span className="font-medium text-foreground">
                          : {Math.round(confidence * 100)}%
                        </span>
                      </span>
                    )}
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium sm:px-2.5 sm:py-1 ${
                        doc.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
