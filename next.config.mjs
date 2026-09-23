/** @type {import('next').NextConfig} */
const config = {
  outputFileTracingIncludes: { "/**": ["./public/ventures/**/*.{md,json}", "./templates/**"] },
};

export default config;
