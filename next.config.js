const isDev = process.env.NODE_ENV !== "production";

const scriptSrc = ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"];
if (isDev) {
	scriptSrc.push("'unsafe-eval'");
}

const cspDirectives = [
	"default-src 'self'",
	`script-src ${scriptSrc.join(" ")}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob:",
	"font-src 'self' data:",
	"connect-src 'self' https://api.groq.com https://*.supabase.co https://*.supabase.in",
	"form-action 'self'",
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"object-src 'none'"
];

const securityHeaders = [
	{
		key: "Content-Security-Policy",
		value: cspDirectives.join("; ")
	},
	{
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin"
	},
	{
		key: "X-Content-Type-Options",
		value: "nosniff"
	},
	{
		key: "X-Frame-Options",
		value: "DENY"
	},
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()"
	}
];

/** @type {import('next').NextConfig} */
const nextConfig = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders
			}
		];
	}
};

export default nextConfig;