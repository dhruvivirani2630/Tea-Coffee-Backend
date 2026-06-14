const safeUserFields = [
  "_id",
  "employeeId",
  "name",
  "email",
  "phone",
  "role",
  "status",
  "profileImage",
  "updatedBy",
  "createdAt",
  "updatedAt",
  "lastLogin",
];

const serializeUser = (user) => {
  if (!user) {
    return null;
  }

  const object = user.toObject ? user.toObject() : { ...user };

  return safeUserFields.reduce((result, key) => {
    if (object[key] !== undefined) {
      result[key] = object[key];
    }
    return result;
  }, {});
};

module.exports = {
  serializeUser,
  safeUserFields,
};
