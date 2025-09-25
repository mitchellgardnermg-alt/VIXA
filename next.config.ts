import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	// Disable Turbopack for production builds to fix Lightning CSS issues
	experimental: {
		turbo: {
			// Disable Turbopack for production
		}
	}
};

export default nextConfig;