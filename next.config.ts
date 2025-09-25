import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@ffmpeg/ffmpeg",
		"@ffmpeg/util",
	],
};

export default nextConfig;
