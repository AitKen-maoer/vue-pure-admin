import { http } from "../utils/http";

export const getList = (params?: object): any => {
  return http.request("get", "/asyncRoutes/getList", params);
};

export const AddRoutes = (data?: object): any => {
  return http.request("post", "/asyncRoutes/AddRoutes", data);
};

export const editRoutes = (data?: object): any => {
  return http.request("post", "/asyncRoutes/editRoutes", data);
};

export const getRoterWhereRole = (params?: object): any => {
  return http.request("get", "asyncRoutes/getAsyncRoutes", params);
};
