/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ["drive.google.com", "i.scdn.co", "i.ytimg.com"],
  },
};

require("dotenv").config();
