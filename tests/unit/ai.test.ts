import { describe, it, expect } from "vitest";

describe("AI Credit Engine", () => {
  it("should export credit functions", async () => {
    const mod = await import("@/lib/ai-credits");
    expect(typeof mod.calculateCredits).toBe("function");
    expect(typeof mod.checkCredits).toBe("function");
    expect(typeof mod.getBalance).toBe("function");
    expect(typeof mod.getRemainingCredits).toBe("function");
    expect(typeof mod.consumeCredits).toBe("function");
    expect(typeof mod.refundCreditsIfFailed).toBe("function");
    expect(typeof mod.grantCredits).toBe("function");
    expect(typeof mod.getCreditHistory).toBe("function");
  });

  describe("calculateCredits", () => {
    it("should calculate basic credits for CORE tier", async () => {
      const { calculateCredits } = await import("@/lib/ai-credits");
      // 1000 input + 500 output => (1000 + 500*2) / 1000 * 1 = 2 credits
      const credits = calculateCredits({
        inputTokens: 1000,
        outputTokens: 500,
        modelTier: "CORE",
        feature: "chat",
      });
      expect(credits).toBe(2);
    });

    it("should apply ADVANCED tier multiplier", async () => {
      const { calculateCredits } = await import("@/lib/ai-credits");
      const credits = calculateCredits({
        inputTokens: 1000,
        outputTokens: 0,
        modelTier: "ADVANCED",
        feature: "chat",
      });
      expect(credits).toBe(3); // 1000/1000 * 3
    });

    it("should apply ENTERPRISE tier multiplier", async () => {
      const { calculateCredits } = await import("@/lib/ai-credits");
      const credits = calculateCredits({
        inputTokens: 2000,
        outputTokens: 1000,
        modelTier: "ENTERPRISE",
        feature: "analysis",
      });
      // (2000 + 1000*2) / 1000 * 5 = 4 * 5 = 20
      expect(credits).toBe(20);
    });

    it("should default to 1x for unknown tier", async () => {
      const { calculateCredits } = await import("@/lib/ai-credits");
      const credits = calculateCredits({
        inputTokens: 500,
        outputTokens: 0,
        modelTier: "UNKNOWN",
        feature: "chat",
      });
      expect(credits).toBe(1); // 500/1000 = 0.5 => ceil = 1
    });

    it("should weight output tokens 2x", async () => {
      const { calculateCredits } = await import("@/lib/ai-credits");
      const inputCredits = calculateCredits({ inputTokens: 2000, outputTokens: 0, modelTier: "CORE", feature: "chat" });
      const outputCredits = calculateCredits({ inputTokens: 0, outputTokens: 1000, modelTier: "CORE", feature: "chat" });
      expect(inputCredits).toBe(2);
      expect(outputCredits).toBe(2); // 1000*2/1000 = 2
    });
  });
});

describe("AI Gateway", () => {
  it("should export gateway functions", async () => {
    const mod = await import("@/lib/ai-gateway");
    expect(typeof mod.aiRequest).toBe("function");
    expect(typeof mod.registerAIProvider).toBe("function");
    expect(typeof mod.resolveModel).toBe("function");
    expect(typeof mod.listProviders).toBe("function");
    expect(typeof mod.listModels).toBe("function");
    expect(typeof mod.createProvider).toBe("function");
    expect(typeof mod.createModel).toBe("function");
    expect(typeof mod.getUsageStats).toBe("function");
  });

  it("should register and retrieve providers", async () => {
    const { registerAIProvider } = await import("@/lib/ai-gateway");
    registerAIProvider({
      name: "test-provider",
      chat: async () => ({ content: "test", inputTokens: 10, outputTokens: 5, cachedTokens: 0 }),
    });
    // Provider registered (no error on second register)
    registerAIProvider({
      name: "test-provider",
      chat: async () => ({ content: "test", inputTokens: 10, outputTokens: 5, cachedTokens: 0 }),
    });
  });
});

describe("AI Flow", () => {
  it("should export executeAIRequest", async () => {
    const mod = await import("@/lib/ai-flow");
    expect(typeof mod.executeAIRequest).toBe("function");
  });
});

describe("OpenRouter Provider", () => {
  it("should export OpenRouterProvider with correct name", async () => {
    const { OpenRouterProvider } = await import("@/lib/providers/openrouter");
    expect(OpenRouterProvider.name).toBe("openrouter");
    expect(typeof OpenRouterProvider.chat).toBe("function");
  });
});

describe("RBAC", () => {
  it("should include AI permissions", async () => {
    const { PERMISSIONS } = await import("@/lib/rbac");
    expect(PERMISSIONS.AI_READ).toBe("AI_READ");
    expect(PERMISSIONS.AI_USE).toBe("AI_USE");
    expect(PERMISSIONS.AI_MANAGE).toBe("AI_MANAGE");
  });

  it("should grant ADMIN all AI permissions", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_READ");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_USE");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_MANAGE");
  });

  it("should grant DIRECTOR AI read and use", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.DIRECTOR).toContain("AI_READ");
    expect(ROLE_PERMISSIONS.DIRECTOR).toContain("AI_USE");
    expect(ROLE_PERMISSIONS.DIRECTOR).not.toContain("AI_MANAGE");
  });

  it("should grant TEACHER only AI read", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("AI_READ");
    expect(ROLE_PERMISSIONS.TEACHER).not.toContain("AI_USE");
  });

  it("should not grant STUDENT any AI permissions", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("AI_READ");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("AI_USE");
  });
});

describe("Phase 6: AI Intelligence", () => {
  it("should export AI tools", async () => {
    const mod = await import("@/lib/ai/tools");
    expect(typeof mod.executeTool).toBe("function");
    expect(mod.AI_TOOLS).toBeDefined();
    expect(mod.AI_TOOLS.query_students).toBeDefined();
    expect(mod.AI_TOOLS.query_attendance).toBeDefined();
    expect(mod.AI_TOOLS.query_grades).toBeDefined();
    expect(mod.AI_TOOLS.query_payments).toBeDefined();
    expect(mod.AI_TOOLS.query_leads).toBeDefined();
    expect(mod.AI_TOOLS.query_notifications).toBeDefined();
  });

  it("should export AI protection", async () => {
    const mod = await import("@/lib/ai/protection");
    expect(typeof mod.checkAIProtection).toBe("function");
    expect(typeof mod.checkAICreditWarning).toBe("function");
  });

  it("should export knowledge base functions", async () => {
    const mod = await import("@/lib/ai/knowledge");
    expect(typeof mod.createKnowledgeBase).toBe("function");
    expect(typeof mod.listKnowledgeBases).toBe("function");
    expect(typeof mod.getKnowledgeBase).toBe("function");
    expect(typeof mod.updateKnowledgeBase).toBe("function");
    expect(typeof mod.deleteKnowledgeBase).toBe("function");
    expect(typeof mod.addDocument).toBe("function");
    expect(typeof mod.listDocuments).toBe("function");
    expect(typeof mod.searchKnowledge).toBe("function");
  });

  it("should export anomaly detection", async () => {
    const mod = await import("@/lib/ai/anomaly");
    expect(typeof mod.detectAllAnomalies).toBe("function");
    expect(typeof mod.detectAttendanceAnomalies).toBe("function");
    expect(typeof mod.detectFinancialAnomalies).toBe("function");
    expect(typeof mod.detectAcademicAnomalies).toBe("function");
  });

  it("should export recommendations", async () => {
    const mod = await import("@/lib/ai/recommendations");
    expect(typeof mod.generateAllRecommendations).toBe("function");
    expect(typeof mod.listRecommendations).toBe("function");
    expect(typeof mod.updateRecommendationStatus).toBe("function");
    expect(typeof mod.saveRecommendations).toBe("function");
  });

  it("should export reports", async () => {
    const mod = await import("@/lib/ai/reports");
    expect(typeof mod.generateReport).toBe("function");
    expect(typeof mod.saveInsight).toBe("function");
    expect(typeof mod.listInsights).toBe("function");
    expect(typeof mod.getInsightStats).toBe("function");
  });

  it("should export context engine", async () => {
    const mod = await import("@/lib/ai/context-engine");
    expect(typeof mod.aggregateStudentData).toBe("function");
    expect(typeof mod.aggregateFinancialData).toBe("function");
    expect(typeof mod.aggregateAttendanceData).toBe("function");
    expect(typeof mod.aggregateAcademicData).toBe("function");
  });

  it("should export chat", async () => {
    const mod = await import("@/lib/ai/chat");
    expect(typeof mod.sendChatMessage).toBe("function");
    expect(typeof mod.createConversation).toBe("function");
    expect(typeof mod.listConversations).toBe("function");
    expect(typeof mod.archiveConversation).toBe("function");
  });

  it("should have Phase 6 AI permissions in RBAC", async () => {
    const { PERMISSIONS } = await import("@/lib/rbac");
    expect(PERMISSIONS.AI_ASSISTANT).toBe("AI_ASSISTANT");
    expect(PERMISSIONS.AI_INSIGHTS_READ).toBe("AI_INSIGHTS_READ");
    expect(PERMISSIONS.AI_READ_FINANCE).toBe("AI_READ_FINANCE");
    expect(PERMISSIONS.AI_READ_STUDENTS).toBe("AI_READ_STUDENTS");
    expect(PERMISSIONS.AI_READ_ATTENDANCE).toBe("AI_READ_ATTENDANCE");
    expect(PERMISSIONS.AI_READ_ACADEMIC).toBe("AI_READ_ACADEMIC");
    expect(PERMISSIONS.AI_READ_CRM).toBe("AI_READ_CRM");
    expect(PERMISSIONS.AI_KNOWLEDGE_MANAGE).toBe("AI_KNOWLEDGE_MANAGE");
    expect(PERMISSIONS.AI_RECOMMENDATIONS_READ).toBe("AI_RECOMMENDATIONS_READ");
    expect(PERMISSIONS.AI_RECOMMENDATIONS_EXECUTE).toBe("AI_RECOMMENDATIONS_EXECUTE");
  });

  it("should grant ADMIN all Phase 6 AI permissions", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_ASSISTANT");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_INSIGHTS_READ");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_READ_FINANCE");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_READ_STUDENTS");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_KNOWLEDGE_MANAGE");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_RECOMMENDATIONS_READ");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AI_RECOMMENDATIONS_EXECUTE");
  });

  it("should grant DIRECTOR AI assistant and insights", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.DIRECTOR).toContain("AI_ASSISTANT");
    expect(ROLE_PERMISSIONS.DIRECTOR).toContain("AI_INSIGHTS_READ");
    expect(ROLE_PERMISSIONS.DIRECTOR).toContain("AI_RECOMMENDATIONS_READ");
  });

  it("should grant TEACHER AI assistant and academic insights", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("AI_ASSISTANT");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("AI_READ_ATTENDANCE");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("AI_READ_ACADEMIC");
  });

  it("should grant PARENT only AI insights read", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.PARENT).toContain("AI_INSIGHTS_READ");
    expect(ROLE_PERMISSIONS.PARENT).not.toContain("AI_ASSISTANT");
  });

  it("should grant STUDENT only AI insights read", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.STUDENT).toContain("AI_INSIGHTS_READ");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("AI_ASSISTANT");
  });
});
