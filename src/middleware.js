import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/authConstants";
import { isSessionValid } from "@/lib/authEdge";

const connectSrc = "'self' https://api.groq.com https://*.supabase.co https://*.supabase.in";
const imgSrc = "'self' data: blob:";
const fontSrc = "'self' data:";
const baseDirectives = [
	"default-src 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"object-src 'none'"
];

const generateNonce = () => {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
};

export async function middleware(request) {
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/teacher")) {
		const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
		if (!sessionId || !(await isSessionValid(sessionId))) {
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	const nonce = generateNonce();
	const scriptSrc = [`'self'`, `'nonce-${nonce}'`];

	if (process.env.NODE_ENV !== "production") {
		scriptSrc.push("'unsafe-eval'");
	}

	const styleSrc = [`'self'`, `'nonce-${nonce}'`];

	const csp = [
		...baseDirectives,
		`script-src ${scriptSrc.join(" ")}`,
		`style-src ${styleSrc.join(" ")}`,
		`img-src ${imgSrc}`,
		`font-src ${fontSrc}`,
		`connect-src ${connectSrc}`
	].join("; ");

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);

	const response = NextResponse.next({
		request: {
			headers: requestHeaders
		}
	});

	response.headers.set("Content-Security-Policy", csp);
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

	return response;
}

export const config = {
	matcher: "/:path*"
};
