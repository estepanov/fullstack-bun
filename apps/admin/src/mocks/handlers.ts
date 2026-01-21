import { http, HttpResponse } from "msw";

type DemoUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "admin" | "moderator" | "user";
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
};

const demoUsers: DemoUser[] = [
  {
    id: "user-001",
    name: "Avery Moore",
    email: "avery.moore@example.com",
    emailVerified: true,
    image: null,
    role: "admin",
    banned: false,
    banReason: null,
    createdAt: "2024-02-04T10:12:00.000Z",
    updatedAt: "2025-01-08T15:02:00.000Z",
  },
  {
    id: "user-002",
    name: "Jamie Patel",
    email: "jamie.patel@example.com",
    emailVerified: true,
    image: null,
    role: "moderator",
    banned: false,
    banReason: null,
    createdAt: "2024-03-12T09:45:00.000Z",
    updatedAt: "2024-12-19T18:24:00.000Z",
  },
  {
    id: "user-003",
    name: "Harper Nguyen",
    email: "harper.nguyen@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    banned: true,
    banReason: "Repeated spam reports",
    createdAt: "2024-01-25T14:20:00.000Z",
    updatedAt: "2024-11-02T07:30:00.000Z",
  },
  {
    id: "user-004",
    name: "Morgan Lee",
    email: "morgan.lee@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2024-04-03T12:05:00.000Z",
    updatedAt: "2024-10-11T22:15:00.000Z",
  },
  {
    id: "user-005",
    name: "Riley Singh",
    email: "riley.singh@example.com",
    emailVerified: false,
    image: null,
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2024-05-21T16:55:00.000Z",
    updatedAt: "2024-11-28T08:10:00.000Z",
  },
  {
    id: "user-006",
    name: "Quinn Walker",
    email: "quinn.walker@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2024-06-09T11:05:00.000Z",
    updatedAt: "2025-01-03T20:45:00.000Z",
  },
  {
    id: "user-007",
    name: "Drew Torres",
    email: "drew.torres@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    banned: true,
    banReason: "Chargeback abuse",
    createdAt: "2024-02-19T08:30:00.000Z",
    updatedAt: "2024-10-02T13:12:00.000Z",
  },
  {
    id: "user-008",
    name: "Skyler Reed",
    email: "skyler.reed@example.com",
    emailVerified: true,
    image: null,
    role: "moderator",
    banned: false,
    banReason: null,
    createdAt: "2024-07-18T07:40:00.000Z",
    updatedAt: "2024-12-02T19:05:00.000Z",
  },
  {
    id: "user-009",
    name: "Casey Kim",
    email: "casey.kim@example.com",
    emailVerified: false,
    image: null,
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2024-08-22T13:22:00.000Z",
    updatedAt: "2025-01-05T09:55:00.000Z",
  },
  {
    id: "user-010",
    name: "Parker Diaz",
    email: "parker.diaz@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2024-09-10T21:15:00.000Z",
    updatedAt: "2024-12-28T11:35:00.000Z",
  },
  {
    id: "user-011",
    name: "Rowan Brooks",
    email: "rowan.brooks@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2024-09-30T15:10:00.000Z",
    updatedAt: "2025-01-07T16:40:00.000Z",
  },
  {
    id: "user-012",
    name: "Jordan Ellis",
    email: "jordan.ellis@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    banned: false,
    banReason: null,
    createdAt: "2024-10-12T09:00:00.000Z",
    updatedAt: "2024-12-20T17:25:00.000Z",
  },
];

const toNumber = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const paginate = <T>(items: T[], page: number, limit: number) => {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
};

const normalizeQuery = (value: string | null) => value?.trim().toLowerCase() ?? "";

export const handlers = [
  http.get("*/admin/users", ({ request }) => {
    const url = new URL(request.url);
    const page = toNumber(url.searchParams.get("page"), 1);
    const limit = toNumber(url.searchParams.get("limit"), 10);
    const query = normalizeQuery(url.searchParams.get("q"));

    const filtered = query
      ? demoUsers.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            user.name.toLowerCase().includes(query),
        )
      : demoUsers;

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const users = paginate(filtered, page, limit);

    return HttpResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }),
  http.get("*/admin/users/banned", ({ request }) => {
    const url = new URL(request.url);
    const page = toNumber(url.searchParams.get("page"), 1);
    const limit = toNumber(url.searchParams.get("limit"), 10);

    const banned = demoUsers.filter((user) => user.banned);
    const totalCount = banned.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const bans = paginate(banned, page, limit);

    return HttpResponse.json({
      success: true,
      bans,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }),
  http.get("*/admin/users/search", ({ request }) => {
    const url = new URL(request.url);
    const query = normalizeQuery(url.searchParams.get("q"));
    const limit = toNumber(url.searchParams.get("limit"), 20);

    const users = demoUsers
      .filter((user) => !user.banned)
      .filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.name.toLowerCase().includes(query),
      )
      .slice(0, limit)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }));

    return HttpResponse.json({ success: true, users });
  }),
  http.patch("*/admin/users/:id/role", async ({ params, request }) => {
    const body = (await request.json()) as { role?: DemoUser["role"] };
    const user = demoUsers.find((entry) => entry.id === params.id);

    return HttpResponse.json({
      success: true,
      user: {
        id: user?.id ?? String(params.id),
        name: user?.name ?? "Unknown User",
        email: user?.email ?? "unknown@example.com",
        role: body.role ?? user?.role ?? "user",
      },
    });
  }),
  http.delete("*/admin/users/:id/messages", () => {
    return HttpResponse.json({
      success: true,
      deletedCount: 24,
    });
  }),
  http.post("*/admin/notifications/send", async ({ request }) => {
    const body = (await request.json()) as {
      target?: {
        scope?: "all" | "user" | "users";
        identifier?: string;
        identifiers?: string[];
      };
    };

    const target = body.target;
    if (!target) {
      return HttpResponse.json(
        { success: false, error: "Missing target" },
        { status: 400 },
      );
    }

    let targetUsers: DemoUser[] = [];
    if (target.scope === "all") {
      targetUsers = demoUsers.filter((user) => !user.banned);
    } else if (target.scope === "user" && target.identifier) {
      targetUsers = demoUsers.filter(
        (user) => user.id === target.identifier || user.email === target.identifier,
      );
    } else if (target.scope === "users" && target.identifiers) {
      targetUsers = demoUsers.filter(
        (user) =>
          target.identifiers?.includes(user.id) ||
          target.identifiers?.includes(user.email),
      );
    }

    return HttpResponse.json({
      success: true,
      targetCount: targetUsers.length,
      createdCount: targetUsers.length,
      skippedCount: 0,
      failures: [],
    });
  }),
];
