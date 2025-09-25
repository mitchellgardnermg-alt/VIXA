import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@ffmpeg/ffmpeg",
		"@ffmpeg/util",
	],
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;