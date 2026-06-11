export interface UserLoginSuccessResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
