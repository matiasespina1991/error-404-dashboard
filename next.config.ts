export default {
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  serverExternalPackages: ["sanitize-html"],
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
};
