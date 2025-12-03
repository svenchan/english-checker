const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
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