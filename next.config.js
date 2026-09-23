/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep standard deployment defaults; opt in only on restricted local hosts.
  ...(process.env.NEXT_WORKER_THREADS === "1" ? {
    experimental: { workerThreads: true, useTypeScriptCli: false, cpus: 2 }
  } : {})
};
module.exports = nextConfig;
