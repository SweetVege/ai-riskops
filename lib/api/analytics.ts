import { average, percentage, severityRank } from "@/lib/api/overview";
import { scopedCallLogWhere, scopedRiskEventWhere, type RequestScope } from "@/lib/api/scope";
import { prisma } from "@/lib/prisma";

export type AnalyticsFilters = {
  applicationId: string | null;
  level: string | null;
  environment: string | null;
  action: string | null;
};

export type AnalyticsDrilldownType =
  | "application"
  | "category"
  | "rule"
  | "environment"
  | "department"
  | "data"
  | "model"
  | "user";

export type AnalyticsDrilldownRequest = {
  type: AnalyticsDrilldownType | null;
  label: string | null;
};

type AnalyticsRiskEvent = Awaited<ReturnType<typeof loadAnalyticsDataset>>["riskEvents"][number];
type AnalyticsCallLog = Awaited<ReturnType<typeof loadAnalyticsDataset>>["callLogs"][number];

type DriverBucket = {
  id: string;
  label: string;
  detail: string;
  weightedScore: number;
  riskEvents: number;
  highSevereEvents: number;
  blockedEvents: number;
  callLogs: number;
  blockedCalls: number;
  totalRiskScore: number;
  mainDriverCounts: Record<string, number>;
};

export function analyticsFiltersFromSearchParams(searchParams: URLSearchParams): AnalyticsFilters {
  return {
    applicationId: searchParams.get("application_id"),
    level: searchParams.get("level"),
    environment: normalizeEnvironmentParam(searchParams.get("environment")),
    action: searchParams.get("action"),
  };
}

export function analyticsFilterResponse(filters: AnalyticsFilters) {
  return {
    applicationId: filters.applicationId,
    level: filters.level,
    environment: filters.environment,
    action: filters.action,
  };
}

export function analyticsDrilldownFromSearchParams(searchParams: URLSearchParams): AnalyticsDrilldownRequest {
  const type = searchParams.get("type");

  return {
    type: isAnalyticsDrilldownType(type) ? type : null,
    label: searchParams.get("label"),
  };
}

export async function loadAnalyticsDataset(scope: RequestScope, filters: AnalyticsFilters) {
  const [riskEvents, callLogs] = await Promise.all([
    prisma.riskEvent.findMany({
      where: {
        ...scopedRiskEventWhere(scope, filters.applicationId),
        ...(filters.level ? { level: filters.level } : {}),
        ...(filters.environment ? { environment: filters.environment } : {}),
        ...(filters.action ? { action: filters.action } : {}),
      },
      orderBy: { occurredAt: "desc" },
      include: {
        application: true,
        ruleMatches: {
          include: {
            riskRule: true,
          },
        },
      },
    }),
    prisma.aiCallLog.findMany({
      where: {
        ...scopedCallLogWhere(scope, filters.applicationId),
        ...(filters.level ? { level: filters.level } : {}),
        ...(filters.environment ? { environment: filters.environment } : {}),
        ...(filters.action ? { action: filters.action } : {}),
      },
      include: {
        application: true,
      },
    }),
  ]);

  return { riskEvents, callLogs };
}

export function analyticsSummary(riskEvents: AnalyticsRiskEvent[], callLogs: AnalyticsCallLog[]) {
  const highSevereEvents = riskEvents.filter((event) => isHighSevere(event.level)).length;
  const blockedCalls = callLogs.filter((log) => log.action === "block").length;

  return {
    riskEvents: riskEvents.length,
    modelCalls: callLogs.length,
    highSevereEvents,
    highSevereRate: percentage(highSevereEvents, riskEvents.length),
    riskEventRate: percentage(riskEvents.length, callLogs.length),
    blockRate: percentage(blockedCalls, callLogs.length),
    averageRiskScore: average(riskEvents.map((event) => event.score)),
    blockedModelCalls: blockedCalls,
  };
}

export function analyticsDrivers(riskEvents: AnalyticsRiskEvent[], callLogs: AnalyticsCallLog[]) {
  return {
    applications: applicationDrivers(riskEvents, callLogs),
    categories: categoryDrivers(riskEvents),
    rules: ruleDrivers(riskEvents),
    environments: eventDrivers(riskEvents, callLogs, {
      getEventKey: (event) => event.environment,
      getEventLabel: (event) => titleCase(event.environment),
      getLogKey: (log) => log.environment,
      getLogLabel: (log) => titleCase(log.environment),
      detail: "Environment risk concentration",
    }),
    departments: eventDrivers(riskEvents, callLogs, {
      getEventKey: (event) => event.department,
      getEventLabel: (event) => event.department,
      getLogKey: () => "",
      getLogLabel: () => "",
      detail: "Department or data segment",
    }),
    users: eventDrivers(riskEvents, callLogs, {
      getEventKey: (event) => event.userRef,
      getEventLabel: (event) => event.userRef,
      getLogKey: (log) => log.userRef,
      getLogLabel: (log) => log.userRef,
      detail: "User or role segment",
    }),
    models: eventDrivers(riskEvents, callLogs, {
      getEventKey: (event) => event.model,
      getEventLabel: (event) => event.model,
      getLogKey: (log) => log.model,
      getLogLabel: (log) => log.model,
      detail: "Model segment",
    }),
  };
}

export function applicationAnalytics(
  application: {
    id: string;
    name: string;
    ownerTeam: string;
    status: string;
    fieldCoverage: number;
  },
  riskEvents: AnalyticsRiskEvent[],
  callLogs: AnalyticsCallLog[],
) {
  const summary = analyticsSummary(riskEvents, callLogs);
  const drivers = analyticsDrivers(riskEvents, callLogs);
  const maxRiskScore = riskEvents.reduce((max, event) => Math.max(max, event.score), 0);
  const recentHighRiskExamples = riskEvents
    .filter((event) => isHighSevere(event.level))
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((event) => ({
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      title: event.title,
      score: event.score,
      level: event.level,
      action: event.action,
      environment: event.environment,
      model: event.model,
      matchedRules: event.ruleMatches.map((match) => ({
        id: match.riskRule.id,
        name: match.riskRule.name,
        category: match.riskRule.category,
      })),
    }));
  const topCategory = drivers.categories[0];
  const topRule = drivers.rules[0];

  return {
    application: {
      id: application.id,
      name: application.name,
      ownerTeam: application.ownerTeam,
      status: application.status,
      fieldCoverage: application.fieldCoverage,
    },
    metrics: {
      ...summary,
      maxRiskScore,
      uniqueUsers: new Set(riskEvents.map((event) => event.userRef)).size,
      uniqueModels: new Set(riskEvents.map((event) => event.model)).size,
      uniqueRules: new Set(riskEvents.flatMap((event) => event.ruleMatches.map((match) => match.riskRuleId))).size,
    },
    driverMix: {
      categories: drivers.categories,
      environments: drivers.environments,
      rules: drivers.rules,
    },
    recentHighRiskExamples,
    insight: riskEvents.length
      ? `${application.name} contributes ${riskEvents.length} risk events in the current scope. Its main pressure comes from ${topCategory?.label ?? "mixed categories"}, with ${topRule?.label ?? "multiple matched rules"} as the leading evidence signal. Prioritize follow-up where high-severity events repeat across the same category, rule, or environment.`
      : `${application.name} has no risk events in the current analytics scope.`,
  };
}

export function analyticsDrilldown(
  riskEvents: AnalyticsRiskEvent[],
  drilldown: AnalyticsDrilldownRequest,
) {
  const scopedEvents = filterEventsByDrilldown(riskEvents, drilldown);
  const highSevereEvents = scopedEvents.filter((event) => isHighSevere(event.level)).length;
  const topEvent = scopedEvents.slice().sort((a, b) => b.score - a.score)[0] ?? null;
  const topApplication = topCount(
    scopedEvents.reduce<Record<string, number>>((counts, event) => {
      counts[event.application.name] = (counts[event.application.name] ?? 0) + 1;
      return counts;
    }, {}),
  );
  const topRule = topCount(
    scopedEvents.reduce<Record<string, number>>((counts, event) => {
      for (const match of event.ruleMatches) {
        counts[match.riskRuleId] = (counts[match.riskRuleId] ?? 0) + 1;
      }
      return counts;
    }, {}),
  );
  const topCategory = topCount(
    scopedEvents.reduce<Record<string, number>>((counts, event) => {
      for (const match of event.ruleMatches) {
        counts[match.riskRule.category] = (counts[match.riskRule.category] ?? 0) + 1;
      }
      return counts;
    }, {}),
  );

  return {
    drilldown: {
      type: drilldown.type,
      label: drilldown.label,
    },
    summary: {
      riskEvents: scopedEvents.length,
      highSevereEvents,
      highSevereRate: percentage(highSevereEvents, scopedEvents.length),
      averageRiskScore: average(scopedEvents.map((event) => event.score)),
      maxRiskScore: topEvent?.score ?? 0,
      topApplication,
      topCategory,
      topRule,
    },
    topEvent: topEvent ? formatDrilldownEvent(topEvent) : null,
    events: scopedEvents
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(formatDrilldownEvent),
    insight: scopedEvents.length
      ? `${drilldown.label ?? "The current scope"} contains ${scopedEvents.length} risk events, with ${percentage(highSevereEvents, scopedEvents.length)}% High+Severe concentration. The strongest signal is ${topEvent?.title ?? "mixed evidence"}, led by ${topCategory ?? "mixed categories"} and ${topRule ?? "multiple rules"}.`
      : `${drilldown.label ?? "The current scope"} has no matching risk events in the current analytics scope.`,
  };
}

function applicationDrivers(riskEvents: AnalyticsRiskEvent[], callLogs: AnalyticsCallLog[]) {
  return eventDrivers(riskEvents, callLogs, {
    getEventKey: (event) => event.applicationId,
    getEventLabel: (event) => event.application.name,
    getEventDetail: (event) => event.application.ownerTeam,
    getLogKey: (log) => log.applicationId,
    getLogLabel: (log) => log.application.name,
    detail: "Application risk pressure",
  });
}

function categoryDrivers(riskEvents: AnalyticsRiskEvent[]) {
  const buckets = new Map<string, DriverBucket>();

  for (const event of riskEvents) {
    for (const match of event.ruleMatches) {
      const bucket = getBucket(buckets, match.riskRule.category, match.riskRule.category, "Weighted by matched event severity");
      addEventToBucket(bucket, event, match.riskRule.id);
    }
  }

  return finalizeBuckets(buckets);
}

function ruleDrivers(riskEvents: AnalyticsRiskEvent[]) {
  const buckets = new Map<string, DriverBucket>();

  for (const event of riskEvents) {
    for (const match of event.ruleMatches) {
      const bucket = getBucket(buckets, match.riskRule.id, match.riskRule.id, match.riskRule.name);
      addEventToBucket(bucket, event, match.riskRule.category);
    }
  }

  return finalizeBuckets(buckets);
}

function eventDrivers(
  riskEvents: AnalyticsRiskEvent[],
  callLogs: AnalyticsCallLog[],
  config: {
    getEventKey: (event: AnalyticsRiskEvent) => string;
    getEventLabel: (event: AnalyticsRiskEvent) => string;
    getEventDetail?: (event: AnalyticsRiskEvent) => string;
    getLogKey: (log: AnalyticsCallLog) => string;
    getLogLabel: (log: AnalyticsCallLog) => string;
    detail: string;
  },
) {
  const buckets = new Map<string, DriverBucket>();

  for (const event of riskEvents) {
    const key = config.getEventKey(event);
    const bucket = getBucket(buckets, key, config.getEventLabel(event), config.getEventDetail?.(event) ?? config.detail);
    const mainRule = event.ruleMatches[0]?.riskRule.id ?? event.level;
    addEventToBucket(bucket, event, mainRule);
  }

  for (const log of callLogs) {
    const key = config.getLogKey(log);
    if (!key) continue;
    const bucket = getBucket(buckets, key, config.getLogLabel(log), config.detail);
    bucket.callLogs += 1;
    if (log.action === "block") bucket.blockedCalls += 1;
  }

  return finalizeBuckets(buckets);
}

function filterEventsByDrilldown(
  riskEvents: AnalyticsRiskEvent[],
  drilldown: AnalyticsDrilldownRequest,
) {
  if (!drilldown.type || !drilldown.label) return riskEvents;
  const label = drilldown.label;

  return riskEvents.filter((event) => {
    if (drilldown.type === "application") return event.application.name === label || event.applicationId === label;
    if (drilldown.type === "category") return event.ruleMatches.some((match) => match.riskRule.category === label);
    if (drilldown.type === "rule") return event.ruleMatches.some((match) => match.riskRuleId === label);
    if (drilldown.type === "environment") return titleCase(event.environment) === label || event.environment === label.toLowerCase();
    if (drilldown.type === "department" || drilldown.type === "data") return event.department === label;
    if (drilldown.type === "model") return event.model === label;
    if (drilldown.type === "user") return event.userRef === label;
    return true;
  });
}

function formatDrilldownEvent(event: AnalyticsRiskEvent) {
  return {
    id: event.id,
    occurredAt: event.occurredAt.toISOString(),
    application: {
      id: event.application.id,
      name: event.application.name,
      slug: event.application.slug,
    },
    title: event.title,
    score: event.score,
    level: event.level,
    action: event.action,
    environment: titleCase(event.environment),
    model: event.model,
    userRef: event.userRef,
    department: event.department,
    matchedRules: event.ruleMatches.map((match) => ({
      id: match.riskRule.id,
      name: match.riskRule.name,
      category: match.riskRule.category,
    })),
  };
}

function getBucket(buckets: Map<string, DriverBucket>, id: string, label: string, detail: string) {
  const existing = buckets.get(id);
  if (existing) return existing;

  const bucket: DriverBucket = {
    id,
    label,
    detail,
    weightedScore: 0,
    riskEvents: 0,
    highSevereEvents: 0,
    blockedEvents: 0,
    callLogs: 0,
    blockedCalls: 0,
    totalRiskScore: 0,
    mainDriverCounts: {},
  };

  buckets.set(id, bucket);
  return bucket;
}

function addEventToBucket(bucket: DriverBucket, event: AnalyticsRiskEvent, mainDriver: string) {
  bucket.weightedScore += severityRank(event.level);
  bucket.riskEvents += 1;
  bucket.totalRiskScore += event.score;
  if (isHighSevere(event.level)) bucket.highSevereEvents += 1;
  if (event.action === "block") bucket.blockedEvents += 1;
  bucket.mainDriverCounts[mainDriver] = (bucket.mainDriverCounts[mainDriver] ?? 0) + 1;
}

function finalizeBuckets(buckets: Map<string, DriverBucket>) {
  const totalWeightedScore = [...buckets.values()].reduce((sum, bucket) => sum + bucket.weightedScore, 0);

  return [...buckets.values()]
    .map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      detail: bucket.detail,
      contribution: percentage(bucket.weightedScore, totalWeightedScore),
      weightedScore: bucket.weightedScore,
      riskEvents: bucket.riskEvents,
      highSevereEvents: bucket.highSevereEvents,
      highSevereRate: percentage(bucket.highSevereEvents, bucket.riskEvents),
      averageRiskScore: averageScore(bucket.totalRiskScore, bucket.riskEvents),
      blockRate: percentage(bucket.blockedCalls || bucket.blockedEvents, bucket.callLogs || bucket.riskEvents),
      mainDriver: topCount(bucket.mainDriverCounts),
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 10);
}

function averageScore(total: number, count: number) {
  return count ? Math.round((total / count) * 10) / 10 : 0;
}

function isHighSevere(level: string) {
  return level === "high" || level === "severe";
}

function normalizeEnvironmentParam(value: string | null) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "production" || normalized === "test") return normalized;
  return value;
}

function titleCase(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function topCount(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function isAnalyticsDrilldownType(value: string | null): value is AnalyticsDrilldownType {
  return (
    value === "application" ||
    value === "category" ||
    value === "rule" ||
    value === "environment" ||
    value === "department" ||
    value === "data" ||
    value === "model" ||
    value === "user"
  );
}
