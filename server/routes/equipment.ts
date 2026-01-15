import type { Request, Response, NextFunction, Express } from "express";
import { db } from "../db";
import { equipment, equipmentCalibrationHistory, equipmentMaintenanceLog } from "@shared/schema";
import { eq, and, desc, lte, gte, sql } from "drizzle-orm";
import logger from "../utils/logger";

// Extend Request type to include auth context
interface AuthRequest extends Request {
  userId?: string;
  orgId?: string;
}

// Auth middleware
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const orgId = req.headers['x-org-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.userId = userId;
  req.orgId = orgId || undefined;
  next();
};

// Helper to get auth context
const getAuthContext = (req: AuthRequest): { userId: string; orgId?: string } => {
  return {
    userId: req.userId || "00000000-0000-0000-0000-000000000000",
    orgId: req.orgId,
  };
};

export function registerEquipmentRoutes(app: Express) {
  // =====================================================
  // EQUIPMENT ROUTES
  // =====================================================

  // GET /api/equipment - List all equipment for user/org
  app.get("/api/equipment", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { type, status, dueSoon } = req.query;

      // Build query conditions
      const conditions = [eq(equipment.userId, userId)];

      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      if (type && typeof type === 'string') {
        conditions.push(eq(equipment.type, type));
      }

      if (status && typeof status === 'string') {
        conditions.push(eq(equipment.status, status));
      }

      // Filter for equipment due for calibration soon (within 30 days)
      if (dueSoon === 'true') {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        conditions.push(lte(equipment.nextCalibrationDue, thirtyDaysFromNow));
      }

      const results = await db
        .select()
        .from(equipment)
        .where(and(...conditions))
        .orderBy(desc(equipment.updatedAt));

      // Add calibration status to each equipment
      const equipmentWithStatus = results.map(eq => {
        let calibrationStatus: 'valid' | 'due_soon' | 'overdue' | 'unknown' = 'unknown';

        if (eq.nextCalibrationDue) {
          const now = new Date();
          const dueDate = new Date(eq.nextCalibrationDue);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

          if (dueDate < now) {
            calibrationStatus = 'overdue';
          } else if (dueDate <= thirtyDaysFromNow) {
            calibrationStatus = 'due_soon';
          } else {
            calibrationStatus = 'valid';
          }
        }

        return {
          ...eq,
          calibrationStatus,
        };
      });

      res.json(equipmentWithStatus);
    } catch (error: any) {
      logger.error('Failed to fetch equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/equipment/stats - Dashboard statistics
  app.get("/api/equipment/stats", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);

      const conditions = [eq(equipment.userId, userId)];
      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const allEquipment = await db
        .select()
        .from(equipment)
        .where(and(...conditions));

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const stats = {
        total: allEquipment.length,
        active: allEquipment.filter(e => e.status === 'active').length,
        maintenance: allEquipment.filter(e => e.status === 'maintenance').length,
        retired: allEquipment.filter(e => e.status === 'retired').length,
        outOfService: allEquipment.filter(e => e.status === 'out_of_service').length,
        calibrationOverdue: allEquipment.filter(e =>
          e.nextCalibrationDue && new Date(e.nextCalibrationDue) < now
        ).length,
        calibrationDueSoon: allEquipment.filter(e =>
          e.nextCalibrationDue &&
          new Date(e.nextCalibrationDue) >= now &&
          new Date(e.nextCalibrationDue) <= thirtyDaysFromNow
        ).length,
        byType: {} as Record<string, number>,
      };

      // Count by type
      allEquipment.forEach(e => {
        stats.byType[e.type] = (stats.byType[e.type] || 0) + 1;
      });

      res.json(stats);
    } catch (error: any) {
      logger.error('Failed to fetch equipment stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/equipment/due-for-calibration - Get equipment due for calibration
  app.get("/api/equipment/due-for-calibration", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { days = '30' } = req.query;

      const daysAhead = parseInt(days as string, 10) || 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const conditions = [
        eq(equipment.userId, userId),
        eq(equipment.status, 'active'),
        lte(equipment.nextCalibrationDue, futureDate),
      ];

      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const results = await db
        .select()
        .from(equipment)
        .where(and(...conditions))
        .orderBy(equipment.nextCalibrationDue);

      res.json(results);
    } catch (error: any) {
      logger.error('Failed to fetch equipment due for calibration:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/equipment/:id - Get single equipment
  app.get("/api/equipment/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { id } = req.params;

      const conditions = [eq(equipment.id, id), eq(equipment.userId, userId)];
      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const [result] = await db
        .select()
        .from(equipment)
        .where(and(...conditions));

      if (!result) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      res.json(result);
    } catch (error: any) {
      logger.error('Failed to fetch equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/equipment - Create new equipment
  app.post("/api/equipment", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const {
        name,
        type,
        manufacturer,
        model,
        serialNumber,
        assetTag,
        status = 'active',
        location,
        lastCalibrationDate,
        nextCalibrationDue,
        calibrationIntervalDays = 365,
        calibrationProvider,
        certificateNumber,
        certificateUrl,
        specifications,
        purchaseDate,
        warrantyExpiry,
        cost,
        notes,
      } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
      }

      // Validate type
      const validTypes = ['flaw_detector', 'transducer', 'cable', 'wedge', 'calibration_block', 'couplant_system', 'scanner', 'other'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
      }

      const [newEquipment] = await db
        .insert(equipment)
        .values({
          userId,
          orgId: orgId || null,
          name,
          type,
          manufacturer: manufacturer || null,
          model: model || null,
          serialNumber: serialNumber || null,
          assetTag: assetTag || null,
          status,
          location: location || null,
          lastCalibrationDate: lastCalibrationDate ? new Date(lastCalibrationDate) : null,
          nextCalibrationDue: nextCalibrationDue ? new Date(nextCalibrationDue) : null,
          calibrationIntervalDays,
          calibrationProvider: calibrationProvider || null,
          certificateNumber: certificateNumber || null,
          certificateUrl: certificateUrl || null,
          specifications: specifications || {},
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
          cost: cost ? String(cost) : null,
          notes: notes || null,
        })
        .returning();

      logger.info('Equipment created:', { id: newEquipment.id, name, type, userId });
      res.status(201).json(newEquipment);
    } catch (error: any) {
      logger.error('Failed to create equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/equipment/:id - Update equipment
  app.patch("/api/equipment/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { id } = req.params;

      // Check ownership
      const conditions = [eq(equipment.id, id), eq(equipment.userId, userId)];
      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const [existing] = await db
        .select()
        .from(equipment)
        .where(and(...conditions));

      if (!existing) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      // Build update object, excluding protected fields
      const { userId: _, orgId: __, id: ___, createdAt: ____, ...updateData } = req.body;

      // Convert date strings to Date objects
      if (updateData.lastCalibrationDate) {
        updateData.lastCalibrationDate = new Date(updateData.lastCalibrationDate);
      }
      if (updateData.nextCalibrationDue) {
        updateData.nextCalibrationDue = new Date(updateData.nextCalibrationDue);
      }
      if (updateData.purchaseDate) {
        updateData.purchaseDate = new Date(updateData.purchaseDate);
      }
      if (updateData.warrantyExpiry) {
        updateData.warrantyExpiry = new Date(updateData.warrantyExpiry);
      }

      const [updated] = await db
        .update(equipment)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(equipment.id, id))
        .returning();

      logger.info('Equipment updated:', { id, userId });
      res.json(updated);
    } catch (error: any) {
      logger.error('Failed to update equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/equipment/:id - Delete equipment
  app.delete("/api/equipment/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { id } = req.params;

      // Check ownership
      const conditions = [eq(equipment.id, id), eq(equipment.userId, userId)];
      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const [existing] = await db
        .select()
        .from(equipment)
        .where(and(...conditions));

      if (!existing) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      // Delete equipment (cascade will delete calibration history and maintenance logs)
      await db.delete(equipment).where(eq(equipment.id, id));

      logger.info('Equipment deleted:', { id, userId });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete equipment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // CALIBRATION HISTORY ROUTES
  // =====================================================

  // GET /api/equipment/:id/calibrations - Get calibration history
  app.get("/api/equipment/:id/calibrations", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { id: equipmentId } = req.params;

      // Verify equipment ownership
      const conditions = [eq(equipment.id, equipmentId), eq(equipment.userId, userId)];
      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const [eq_record] = await db
        .select()
        .from(equipment)
        .where(and(...conditions));

      if (!eq_record) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      const calibrations = await db
        .select()
        .from(equipmentCalibrationHistory)
        .where(eq(equipmentCalibrationHistory.equipmentId, equipmentId))
        .orderBy(desc(equipmentCalibrationHistory.calibrationDate));

      res.json(calibrations);
    } catch (error: any) {
      logger.error('Failed to fetch calibration history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/equipment/:id/calibrations - Add calibration record
  app.post("/api/equipment/:id/calibrations", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { id: equipmentId } = req.params;
      const {
        calibrationDate,
        nextDueDate,
        performedBy,
        calibrationProvider,
        certificateNumber,
        certificateUrl,
        result = 'pass',
        deviationNotes,
        measurements,
        cost,
        notes,
      } = req.body;

      // Verify equipment ownership
      const conditions = [eq(equipment.id, equipmentId), eq(equipment.userId, userId)];
      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const [eq_record] = await db
        .select()
        .from(equipment)
        .where(and(...conditions));

      if (!eq_record) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      if (!calibrationDate) {
        return res.status(400).json({ error: "Calibration date is required" });
      }

      // Create calibration record
      const [newCalibration] = await db
        .insert(equipmentCalibrationHistory)
        .values({
          equipmentId,
          calibrationDate: new Date(calibrationDate),
          nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
          performedBy: performedBy || null,
          calibrationProvider: calibrationProvider || null,
          certificateNumber: certificateNumber || null,
          certificateUrl: certificateUrl || null,
          result,
          deviationNotes: deviationNotes || null,
          measurements: measurements || {},
          cost: cost ? String(cost) : null,
          notes: notes || null,
        })
        .returning();

      // Update equipment's calibration fields
      const updateFields: any = {
        lastCalibrationDate: new Date(calibrationDate),
        updatedAt: new Date(),
      };

      if (nextDueDate) {
        updateFields.nextCalibrationDue = new Date(nextDueDate);
      } else if (eq_record.calibrationIntervalDays) {
        // Calculate next due date from interval
        const nextDue = new Date(calibrationDate);
        nextDue.setDate(nextDue.getDate() + (eq_record.calibrationIntervalDays || 365));
        updateFields.nextCalibrationDue = nextDue;
      }

      if (certificateNumber) {
        updateFields.certificateNumber = certificateNumber;
      }
      if (certificateUrl) {
        updateFields.certificateUrl = certificateUrl;
      }
      if (calibrationProvider) {
        updateFields.calibrationProvider = calibrationProvider;
      }

      await db
        .update(equipment)
        .set(updateFields)
        .where(eq(equipment.id, equipmentId));

      logger.info('Calibration record added:', { equipmentId, calibrationDate, result });
      res.status(201).json(newCalibration);
    } catch (error: any) {
      logger.error('Failed to add calibration record:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // MAINTENANCE LOG ROUTES
  // =====================================================

  // GET /api/equipment/:id/maintenance - Get maintenance history
  app.get("/api/equipment/:id/maintenance", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { id: equipmentId } = req.params;

      // Verify equipment ownership
      const conditions = [eq(equipment.id, equipmentId), eq(equipment.userId, userId)];
      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const [eq_record] = await db
        .select()
        .from(equipment)
        .where(and(...conditions));

      if (!eq_record) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      const maintenanceLogs = await db
        .select()
        .from(equipmentMaintenanceLog)
        .where(eq(equipmentMaintenanceLog.equipmentId, equipmentId))
        .orderBy(desc(equipmentMaintenanceLog.maintenanceDate));

      res.json(maintenanceLogs);
    } catch (error: any) {
      logger.error('Failed to fetch maintenance history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/equipment/:id/maintenance - Add maintenance record
  app.post("/api/equipment/:id/maintenance", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { userId, orgId } = getAuthContext(req);
      const { id: equipmentId } = req.params;
      const {
        maintenanceDate,
        maintenanceType,
        description,
        performedBy,
        cost,
        partsReplaced,
        downtimeHours,
        notes,
      } = req.body;

      // Verify equipment ownership
      const conditions = [eq(equipment.id, equipmentId), eq(equipment.userId, userId)];
      if (orgId) {
        conditions.push(eq(equipment.orgId, orgId));
      }

      const [eq_record] = await db
        .select()
        .from(equipment)
        .where(and(...conditions));

      if (!eq_record) {
        return res.status(404).json({ error: "Equipment not found" });
      }

      if (!maintenanceDate || !maintenanceType || !description) {
        return res.status(400).json({
          error: "Maintenance date, type, and description are required"
        });
      }

      // Validate maintenance type
      const validTypes = ['routine', 'repair', 'cleaning', 'firmware_update', 'replacement', 'inspection', 'other'];
      if (!validTypes.includes(maintenanceType)) {
        return res.status(400).json({
          error: `Invalid maintenance type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const [newMaintenance] = await db
        .insert(equipmentMaintenanceLog)
        .values({
          equipmentId,
          maintenanceDate: new Date(maintenanceDate),
          maintenanceType,
          description,
          performedBy: performedBy || null,
          cost: cost ? String(cost) : null,
          partsReplaced: partsReplaced || null,
          downtimeHours: downtimeHours ? String(downtimeHours) : null,
          notes: notes || null,
        })
        .returning();

      // Update equipment updated timestamp
      await db
        .update(equipment)
        .set({ updatedAt: new Date() })
        .where(eq(equipment.id, equipmentId));

      logger.info('Maintenance record added:', { equipmentId, maintenanceType, maintenanceDate });
      res.status(201).json(newMaintenance);
    } catch (error: any) {
      logger.error('Failed to add maintenance record:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // EQUIPMENT TYPES REFERENCE
  // =====================================================

  // GET /api/equipment/types - Get available equipment types
  app.get("/api/equipment-types", (req: Request, res: Response) => {
    const types = [
      { id: 'flaw_detector', name: 'Flaw Detector', description: 'Ultrasonic flaw detection equipment' },
      { id: 'transducer', name: 'Transducer', description: 'Ultrasonic probes and transducers' },
      { id: 'cable', name: 'Cable', description: 'Probe cables and connectors' },
      { id: 'wedge', name: 'Wedge', description: 'Angle beam wedges' },
      { id: 'calibration_block', name: 'Calibration Block', description: 'Reference standards and calibration blocks' },
      { id: 'couplant_system', name: 'Couplant System', description: 'Couplant dispensing and circulation systems' },
      { id: 'scanner', name: 'Scanner', description: 'Mechanical scanners and manipulators' },
      { id: 'other', name: 'Other', description: 'Other UT equipment' },
    ];

    res.json(types);
  });
}
