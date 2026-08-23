import { db } from "@/lib/prisma";
import { WORKSPACE_CONFIG } from "@/lib/constants";

export type ResolvedWorkspace = {
  organizationId: string;
  slug: string;
  customDomain: string | null;
  isCustomDomain: boolean;
};

export async function resolveWorkspace(
  hostname: string
): Promise<ResolvedWorkspace | null> {
  const host = hostname.split(":")[0].toLowerCase();

  const customOrg = await db.organization.findUnique({
    where: { customDomain: host },
    select: { id: true, slug: true, customDomain: true, isActive: true },
  });

  if (customOrg && customOrg.isActive) {
    return {
      organizationId: customOrg.id,
      slug: customOrg.slug,
      customDomain: customOrg.customDomain,
      isCustomDomain: true,
    };
  }

  const { ROOT_DOMAIN, SUBDOMAIN_PATTERN } = WORKSPACE_CONFIG;
  const suffix = `.${ROOT_DOMAIN}`;

  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);

    if (SUBDOMAIN_PATTERN.test(slug)) {
      const org = await db.organization.findUnique({
        where: { slug },
        select: { id: true, slug: true, customDomain: true, isActive: true },
      });

      if (org && org.isActive) {
        return {
          organizationId: org.id,
          slug: org.slug,
          customDomain: org.customDomain,
          isCustomDomain: false,
        };
      }
    }
  }

  if (SUBDOMAIN_PATTERN.test(host) && !host.includes(".")) {
    const org = await db.organization.findUnique({
      where: { slug: host },
      select: { id: true, slug: true, customDomain: true, isActive: true },
    });

    if (org && org.isActive) {
      return {
        organizationId: org.id,
        slug: org.slug,
        customDomain: org.customDomain,
        isCustomDomain: false,
      };
    }
  }

  return null;
}

export async function getWorkspaceUrl(
  slug: string,
  customDomain: string | null,
  path: string = "/"
): Promise<string> {
  const { ROOT_DOMAIN } = WORKSPACE_CONFIG;

  if (customDomain) {
    return `https://${customDomain}${path}`;
  }

  return `https://${slug}.${ROOT_DOMAIN}${path}`;
}
