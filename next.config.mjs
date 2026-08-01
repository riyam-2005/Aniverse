import bundleAnalyzer from "@next/bundle-analyzer";

const isGithubActions = process.env.GITHUB_ACTIONS || false;
const repoName = "Aniverse";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: isGithubActions ? `/${repoName}` : "",
  assetPrefix: isGithubActions ? `/${repoName}/` : "",
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
