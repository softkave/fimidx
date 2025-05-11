export interface IUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  isAdmin: boolean;
}

export type IGetUserEndpointResponse = IUser;
