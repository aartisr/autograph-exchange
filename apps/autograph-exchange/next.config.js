/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: [
    "@aartisr/autograph-contract",
    "@aartisr/autograph-core",
    "@aartisr/autograph-feature",
  ],
};

module.exports = nextConfig;
