export const getInitials = (name = '') => {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'AA';
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};
