import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { LOGIN_RETURN_COOKIE } from "../lib/login-return";
import { updateSession } from "../lib/supabase/proxy";

describe("login URL canonicalization", () => {
  it("moves a legacy next query into a secure return cookie", async () => {
    const request = new NextRequest(
      "https://warehouse.advantaindonesia.com/login?next=%2Fadmin%2Finventory%3Ftab%3Dimport",
    );

    const response = await updateSession(request);
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://warehouse.advantaindonesia.com/login");
    expect(response.cookies.get(LOGIN_RETURN_COOKIE)?.value).toBe("/admin/inventory?tab=import");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=lax");
    expect(setCookie).toContain("Max-Age=300");
  });

  it("removes unrelated login query parameters without creating a return cookie", async () => {
    const request = new NextRequest("https://warehouse.advantaindonesia.com/login?source=legacy");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://warehouse.advantaindonesia.com/login");
    expect(response.cookies.get(LOGIN_RETURN_COOKIE)).toBeUndefined();
  });
});
