// ============================================
// prisma.js - Instance PrismaClient partagée
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;