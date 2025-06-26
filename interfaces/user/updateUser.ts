/**
 * @name 更新用户信息
 * @namespace user
 * @path /api/user/update
 * @method PUT
 * @update 2024-01-15
 */
export interface UpdateUserRequest {
  id: number;
  name?: string;
  email?: string;
}

export interface UpdateUserResponse {
  code: number;
  data: User;
  message: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createTime: string;
  updateTime: string;
}