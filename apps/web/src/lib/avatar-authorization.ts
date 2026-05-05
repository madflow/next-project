type AvatarDeletionAuthorizationParams = {
  sessionUserId: string;
  targetUserId: string;
  isAdmin: boolean;
};

export function canDeleteAvatarForUser({ sessionUserId, targetUserId, isAdmin }: AvatarDeletionAuthorizationParams) {
  return isAdmin || sessionUserId === targetUserId;
}
