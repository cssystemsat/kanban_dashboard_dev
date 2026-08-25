import { afterEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { clientCommentHistory, clientComments } from "../drizzle/schema";
import {
  deleteClientComment,
  getClientCommentHistory,
  getClientComments,
  getDb,
  upsertClientComment,
} from "./db";

const monthYear = "2099-12";
const clientName = `CLIENT_TEST_COMMENT_${Date.now()}`;

async function cleanup() {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientCommentHistory).where(and(
    eq(clientCommentHistory.clientName, clientName),
    eq(clientCommentHistory.monthYear, monthYear),
  ));
  await db.delete(clientComments).where(and(
    eq(clientComments.clientName, clientName),
    eq(clientComments.monthYear, monthYear),
  ));
}

describe("client comments persistence integration", () => {
  afterEach(cleanup);

  it("preserves each save and deletion in the consolidated history", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await upsertClientComment({
      clientName,
      comment: "Primeiro acompanhamento",
      monthYear,
      authorEmail: "analista@example.com",
      authorName: "Analista CS",
    });
    await upsertClientComment({
      clientName,
      comment: "Acompanhamento atualizado",
      monthYear,
      authorEmail: "gestor@example.com",
      authorName: "Gestor CS",
    });

    const current = await getClientComments(monthYear);
    expect(current.find(comment => comment.clientName === clientName)?.comment).toBe("Acompanhamento atualizado");

    const savedHistory = (await getClientCommentHistory(monthYear))
      .filter(comment => comment.clientName === clientName && comment.action === "saved");
    expect(savedHistory).toHaveLength(2);
    expect(savedHistory.map(comment => comment.comment)).toContain("Primeiro acompanhamento");
    expect(savedHistory.map(comment => comment.comment)).toContain("Acompanhamento atualizado");

    await deleteClientComment(clientName, monthYear, {
      email: "gestor@example.com",
      name: "Gestor CS",
    });

    const remaining = await getClientComments(monthYear);
    expect(remaining.find(comment => comment.clientName === clientName)).toBeUndefined();

    const auditHistory = (await getClientCommentHistory(monthYear))
      .filter(comment => comment.clientName === clientName);
    expect(auditHistory.some(comment => comment.action === "deleted")).toBe(true);
  });
});
