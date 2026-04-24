/** @type {import('next').NextConfig} */

const crawlerUtilityHeaders = [
  {
    source: "/CFDF5F11-6B5A-420D-A46E-578D550EA51B.txt",
    headers: [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
    ],
  },
  {
    source: "/BingSiteAuth.xml",
    headers: [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
    ],
  },
];

const nextConfig = {
  async headers() {
    return crawlerUtilityHeaders;
  },

  transpilePackages: [
    "@aartisr/autograph-contract",
    "@aartisr/autograph-core",
    "@aartisr/autograph-feature",
  ],
};

module.exports = nextConfig;
