import { handleLead, type LeadEnv } from '../../server/lead';

/**
 * POST /api/lead on Cloudflare Pages — receives the site's request form.
 * Set the variables listed in DEPLOY.md in Cloudflare → Workers & Pages → project → Settings → Variables and Secrets.
 */
export const onRequest = (context: { request: Request; env: LeadEnv }): Promise<Response> =>
  handleLead(context.request, context.env);
