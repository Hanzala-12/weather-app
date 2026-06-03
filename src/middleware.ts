import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "https://weather-dashboard-kappa-ten.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isAllowed = allowedOrigins.includes(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
