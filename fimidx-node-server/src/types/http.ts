export interface IHttpOutgoingSuccessResponse {
  type: 'success';
}

export interface IHttpOutgoingErrorResponse {
  type: 'error';
  message: string;
}
