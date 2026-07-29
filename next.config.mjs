/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',          // service worker goes here
  disable: process.env.NODE_ENV === 'development',  // only in prod
  register: true,
  skipWaiting: true, 
})({
  reactStrictMode: false,
});
export default nextConfig;
