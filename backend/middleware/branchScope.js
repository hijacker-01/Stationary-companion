// Merges branch-tenant scoping into a Sequelize `where` clause. Cross-branch
// users (admins, or anyone with the "*" permission) see all branches; everyone
// else is restricted to their own branchId.
exports.branchWhere = (req, extra = {}) => {
  if (req.user?.isCrossBranch) return { ...extra };
  return { ...extra, branchId: req.user.branchId };
};
