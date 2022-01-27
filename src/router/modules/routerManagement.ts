import Layout from "/@/layout/index.vue";

const managementRouter = {
  path: "/managementRouter",
  component: Layout,
  redirect: "/managementRouter/index",
  name: "managementRouter",
  meta: {
    title: "动态路由配置",
    icon: "el-icon-lollipop",
    showLink: true,
    savedPosition: false,
    rank: 8,
  },
  children: [
    {
      path: "/managementRouter/index",
      component: () => import("/@/views/router-management/index.vue"),
      name: "managementRouterIndex",
      meta: {
        title: "动态路由列表",
        showLink: true,
        savedPosition: false,
      },
    },
  ],
};

export default managementRouter;
