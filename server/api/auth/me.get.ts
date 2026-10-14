import { defineApiHandler } from '../../utils/handler'
import { getUserContext } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineApiHandler(async (event) => {
  const context = await getUserContext(event)

  const user = await prisma.user.findUnique({
    where: { id: context.id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      roleId: true,
      branchId: true,
      role: {
        select: {
          id: true,
          name: true,
          description: true,
          permissions: {
            select: {
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
              module: {
                select: { code: true, name: true, category: true }
              }
            }
          }
        }
      },
      branch: {
        select: { id: true, code: true, name: true }
      }
    }
  })

  return {
    user: {
      id: user?.id,
      username: user?.username,
      name: user?.name,
      email: user?.email,
      roleId: user?.roleId,
      roleName: user?.role?.name,
      branchId: user?.branchId,
      branchName: user?.branch?.name,
      permissions: user?.role?.permissions.map((p) => ({
        moduleCode: p.module.code,
        canCreate: p.canCreate,
        canRead: p.canRead,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete
      })) || []
    }
  }
})
