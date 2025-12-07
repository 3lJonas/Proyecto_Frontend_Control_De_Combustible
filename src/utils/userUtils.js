const USER_ID_FIELDS = [
  "id",
  "Id",
  "idUsuario",
  "IdUsuario",
  "usuarioId",
  "UsuarioId",
  "userId",
  "UserId",
  "choferId",
  "ChoferId",
];

const sanitizeValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
};

const buildIdentifierSets = (values) => {
  const stringIds = new Set();
  const numberIds = new Set();

  values.forEach((value) => {
    const sanitized = sanitizeValue(value);
    if (sanitized === null) return;
    stringIds.add(sanitized.toString());
    const numeric = Number(sanitized);
    if (!Number.isNaN(numeric)) {
      numberIds.add(numeric);
    }
  });

  return { stringIds, numberIds };
};

export const collectUserIdentifierValues = (user) => {
  if (!user) return [];
  const values = USER_ID_FIELDS.map((field) => user[field]).filter(
    (value) => value !== undefined
  );

  // Incluir propiedades anidadas comunes (usuario?.id)
  if (user.usuario && typeof user.usuario === "object") {
    values.push(user.usuario.id, user.usuario.Id);
  }

  if (user.chofer && typeof user.chofer === "object") {
    values.push(
      user.chofer.id,
      user.chofer.Id,
      user.chofer.usuarioId,
      user.chofer.IdUsuario
    );
  }

  return values.filter((value) => value !== undefined);
};

export const buildUserIdMatcher = (user) => {
  const values = collectUserIdentifierValues(user);
  const { stringIds, numberIds } = buildIdentifierSets(values);

  if (!values.length) {
    return () => false;
  }

  return (candidate) => {
    if (candidate === undefined || candidate === null) return false;
    const candidateString = candidate.toString();
    if (stringIds.has(candidateString)) return true;
    const candidateNumber = Number(candidate);
    return !Number.isNaN(candidateNumber) && numberIds.has(candidateNumber);
  };
};
