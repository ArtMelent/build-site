import { handleLead } from '../server/lead';

// POST /api/lead — receives the site's request form.
// Configure the environment variables listed in DEPLOY.md in Vercel → Settings → Environment Variables.
export default {
  fetch(request: Request) {
    return handleLead(request, process.env);
  },
};
