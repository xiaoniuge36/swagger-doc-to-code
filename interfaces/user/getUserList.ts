/**
 * @name 获取用户列表
 * @namespace user
 * @path /api/user/list
 * @method GET
 * @update 2024-01-15
 */
export interface GetUserListRequest {
  page: number;
  size: number;
  keyword?: string;
}

export interface GetUserListResponse {
  code: number;
  data: {
    list: User[];
    total: number;
  };
  message: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createTime: string;
}