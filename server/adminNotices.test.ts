import { describe, expect, it } from "vitest";
import { getBrazilNowParts, getCurrentNoticeOccurrence, noticeTargetsUser } from "./adminNotices";

describe("Central de Avisos", () => {
  it("interpreta horário no fuso de Brasília", () => {
    const parts = getBrazilNowParts(new Date("2026-10-16T15:30:00.000Z"));
    expect(parts.date).toBe("2026-10-16");
    expect(parts.time).toBe("12:30");
    expect(parts.weekday).toBe(5);
  });

  it("libera aviso único imediatamente e bloqueia aviso futuro", () => {
    const now = new Date("2026-10-16T12:00:00.000Z");
    expect(getCurrentNoticeOccurrence({
      scheduleType: "unique",
      immediate: true,
      startDate: null,
      startTime: null,
      daysOfWeek: null,
      timesOfDay: null,
    }, now)).toBe("unique-immediate");
    expect(getCurrentNoticeOccurrence({
      scheduleType: "unique",
      immediate: false,
      startDate: "2026-10-17",
      startTime: "09:00",
      daysOfWeek: null,
      timesOfDay: null,
    }, now)).toBeNull();
  });

  it("usa a ocorrência periódica mais recente do dia", () => {
    const now = new Date("2026-10-16T18:30:00.000Z"); // sexta, 15:30 BRT
    expect(getCurrentNoticeOccurrence({
      scheduleType: "periodic",
      immediate: false,
      startDate: "2026-10-01",
      startTime: null,
      daysOfWeek: JSON.stringify([5]),
      timesOfDay: JSON.stringify(["09:00", "14:00"]),
    }, now)).toBe("periodic-2026-10-16-14:00");
  });

  it("mantém pendente a ocorrência periódica anterior até a ciência", () => {
    const now = new Date("2026-10-16T11:30:00.000Z"); // 08:30 BRT
    expect(getCurrentNoticeOccurrence({
      scheduleType: "periodic",
      immediate: false,
      startDate: "2026-10-01",
      startTime: null,
      daysOfWeek: JSON.stringify([5]),
      timesOfDay: JSON.stringify(["09:00"]),
    }, now)).toBe("periodic-2026-10-09-09:00");
  });

  it("respeita todos ou apenas e-mails selecionados", () => {
    expect(noticeTargetsUser({ recipientMode: "all", recipientEmails: null }, "qualquer@exemplo.com")).toBe(true);
    expect(noticeTargetsUser({ recipientMode: "selected", recipientEmails: JSON.stringify(["Equipe@exemplo.com"]) }, "equipe@exemplo.com")).toBe(true);
    expect(noticeTargetsUser({ recipientMode: "selected", recipientEmails: JSON.stringify(["outro@exemplo.com"]) }, "equipe@exemplo.com")).toBe(false);
  });
});
