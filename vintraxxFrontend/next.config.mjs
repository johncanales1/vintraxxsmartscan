/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    output: 'standalone',
    outputFileTracingRoot: '/home/ec2-user/vintraxxsmartscan/vintraxxFrontend',
};

export default nextConfig;
