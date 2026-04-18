/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: [
    "@autograph-exchange/contract",
    "@autograph-exchange/core",
    "@autograph-exchange/feature",
  ],
};

module.exports = nextConfig;
