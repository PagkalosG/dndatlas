// Static React preview only. Never connects to production database or Drive.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
