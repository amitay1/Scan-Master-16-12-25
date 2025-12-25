import type { Request, Response, NextFunction, Express } from "express";
import { db } from "../db";
import { organizations, orgMembers, profiles } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Extend Request type to include userId
interface AuthRequest extends Request {
  userId?: string;
}

// Simple auth middleware
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.userId = userId;
  next();
};

export function registerOrganizationRoutes(app: Express) {
  // Get user's organizations
  app.get("/api/organizations", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      
      // Get organizations where user is a member
      const userOrgs = await db
        .select({
          organization: organizations,
          role: orgMembers.role,
        })
        .from(orgMembers)
        .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
        .where(eq(orgMembers.userId, userId));

      res.json(userOrgs.map(row => ({
        ...row.organization,
        userRole: row.role,
      })));
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific organization
  app.get("/api/organizations/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { id: orgId } = req.params;
      const userId = req.userId!;

      // Check if user is member of org
      const membership = await db
        .select()
        .from(orgMembers)
        .where(and(
          eq(orgMembers.orgId, orgId),
          eq(orgMembers.userId, userId)
        ))
        .limit(1);

      if (membership.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      res.json(org);
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create organization
  app.post("/api/organizations", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { name, slug } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: "Name and slug are required" });
      }

      // Check if slug is unique
      const existing = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ error: "Organization slug already exists" });
      }

      // Create organization
      const [newOrg] = await db
        .insert(organizations)
        .values({
          name,
          slug,
          plan: 'free',
          isActive: true,
          maxUsers: 5,
          maxSheets: 100,
          settings: {},
        })
        .returning();

      // Add creator as owner
      await db
        .insert(orgMembers)
        .values({
          orgId: newOrg.id,
          userId,
          role: 'owner',
        });

      // Update user's profile with org_id
      await db
        .update(profiles)
        .set({ orgId: newOrg.id })
        .where(eq(profiles.id, userId));

      res.status(201).json(newOrg);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update organization
  app.patch("/api/organizations/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { id: orgId } = req.params;
      const userId = req.userId!;

      // Check if user is owner or admin
      const [membership] = await db
        .select()
        .from(orgMembers)
        .where(and(
          eq(orgMembers.orgId, orgId),
          eq(orgMembers.userId, userId)
        ))
        .limit(1);

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return res.status(403).json({ error: "Only owners and admins can update organization" });
      }

      const [updatedOrg] = await db
        .update(organizations)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, orgId))
        .returning();

      res.json(updatedOrg);
    } catch (error: any) {
      console.error('Error updating organization:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's role in organization
  app.get("/api/organizations/:id/role", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { id: orgId } = req.params;
      const userId = req.userId!;

      const [membership] = await db
        .select()
        .from(orgMembers)
        .where(and(
          eq(orgMembers.orgId, orgId),
          eq(orgMembers.userId, userId)
        ))
        .limit(1);

      if (!membership) {
        return res.status(404).json({ error: "Not a member of this organization" });
      }

      res.json({ role: membership.role });
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add member to organization
  app.post("/api/organizations/:id/members", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { id: orgId } = req.params;
      const userId = req.userId!;
      const { email, role = 'member' } = req.body;

      // Check if requester is owner or admin
      const [membership] = await db
        .select()
        .from(orgMembers)
        .where(and(
          eq(orgMembers.orgId, orgId),
          eq(orgMembers.userId, userId)
        ))
        .limit(1);

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return res.status(403).json({ error: "Only owners and admins can add members" });
      }

      // Find user by email (simplified - in production, use proper user lookup)
      // For now, return success message
      res.json({ 
        message: "Member invitation sent", 
        email,
        role,
        note: "Email invitation system not implemented yet"
      });
    } catch (error: any) {
      console.error('Error adding member:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get organization members
  app.get("/api/organizations/:id/members", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { id: orgId } = req.params;
      const userId = req.userId!;

      // Check if user is member of org
      const [membership] = await db
        .select()
        .from(orgMembers)
        .where(and(
          eq(orgMembers.orgId, orgId),
          eq(orgMembers.userId, userId)
        ))
        .limit(1);

      if (!membership) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all members with their profiles
      const members = await db
        .select({
          member: orgMembers,
          profile: profiles,
        })
        .from(orgMembers)
        .innerJoin(profiles, eq(orgMembers.userId, profiles.id))
        .where(eq(orgMembers.orgId, orgId));

      res.json(members.map(row => ({
        id: row.member.id,
        userId: row.member.userId,
        role: row.member.role,
        joinedAt: row.member.joinedAt,
        fullName: row.profile.fullName,
        certificationLevel: row.profile.certificationLevel,
      })));
    } catch (error: any) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: error.message });
    }
  });
}