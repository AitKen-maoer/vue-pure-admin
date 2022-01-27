.<template>
  <div class="dict-container">
    <!-- 工具栏 -->

    <vxe-toolbar>
      <template #buttons>
        <vxe-input
          v-model="filterName"
          :placeholder="$t('message.hssearch')"
          @keyup="searchEvent"
        ></vxe-input>
        <roleSelect  v-model:title="roleName" @update:title="roleSelectChangeFun"></roleSelect>
      </template>
      <template #tools>
        <vxe-button
          icon="el-icon-circle-plus-outline"
          status="primary"
          @click="onAdd"
        >{{$t('message.hsadd')}}</vxe-button>
        <vxe-button
          icon="el-icon-folder-opened"
          status="primary"
          @click="$refs.xTree.setAllTreeExpand(true)"
        >{{$t('message.hsexpendAll')}}</vxe-button>
        <vxe-button
          icon="el-icon-folder"
          status="primary"
          @click="$refs.xTree.clearTreeExpand()"
        >{{$t('message.hscollapseAll')}}</vxe-button>
      </template>
    </vxe-toolbar>

    <!-- 列表 -->
    <vxe-table
      ref="xTree"
      border
      resizable
      :tree-config="{children: 'children', iconOpen: 'fa fa-minus-square-o', iconClose: 'fa fa-plus-square-o'}"
      :data="tableData"
      @cell-dblclick="cellDBLClickEvent"
    >
      <vxe-table-column
        tree-node
        field="modelName"
        title="模块名称"
      ></vxe-table-column>
      <vxe-table-column title="name">
        <template #default="{ row }">
          <el-tooltip
            effect="dark"
            :content="'双击复制：'+row.model"
            placement="right"
          >
            <span class="text-model">{{ row.routerName }}</span>
          </el-tooltip>
        </template>
      </vxe-table-column>
      <vxe-table-column
        tree-node
        field="routerName"
        title="路由Name"
      ></vxe-table-column>
      <vxe-table-column
        tree-node
        field="role"
        title="权限"
      ></vxe-table-column>
      <vxe-table-column
        title="操作"
        width="330"
        fixed="right"
      >
        <template #default="{ row }">
          <vxe-button
            type="text"
            icon="el-icon-edit"
            @click="onEdit(row)"
          >编辑</vxe-button>
          <vxe-button
            type="text"
            icon="el-icon-circle-plus-outline"
            @click="onAddChild(row)"
          >新增子类型</vxe-button>
          <vxe-button
            v-show="row.model"
            type="text"
            icon="el-icon-setting"
            @click="onDeploy(row)"
          >字典配置</vxe-button>
          <vxe-button
            type="text"
            icon="el-icon-delete"
            @click="confirmEvent"
          >删除</vxe-button>
        </template>
      </vxe-table-column>
    </vxe-table>

    <!-- 修改、添加弹框 -->
    <vxe-modal
      resize
      width="600"
      v-model="showEdit"
      :title="selectRow ? '编辑' : '新增'"
      :loading="submitLoading"
      @hide="$refs.xForm.reset();"
    >
      <template #default>
        <vxe-form
          ref="xForm"
          :data="formData"
          :items="formItems"
          title-align="right"
          title-width="100"
          @submit="submitEvent"
        >
        </vxe-form>
      </template>
    </vxe-modal>

    <Config
      :drawer="drawer"
      drawTitle="字典列表"
      @handleClose="handleClose"
    />
  </div>
</template>
<script  lang="ts">
import { reactive, ref, unref, nextTick, toRefs,computed } from "vue";
import XEUtils from "xe-utils";
import { cloneDeep } from "lodash-es";
import { templateRef } from "@vueuse/core";
import { useCopyToClipboard } from "/@/utils/useCopyToClipboard";
import { AddRoutes, editRoutes, getList, getRoterWhereRole } from "/@/api/router-management";
import roleSelect from "/@/components/role/index.vue";
import { useUserStore } from "/@/store/modules/user";
import { storageLocal } from "../../utils/storage";

interface setInter {
  user: String;
}

import {
  VXETable,
  VxeTableInstance,
  VxeTableEvents,
  VxeTablePropTypes,
  VxeFormPropTypes,
} from "vxe-table";
import Config from "./config.vue";
import { ElMessage } from "element-plus";

export default {
  name: "dict",
  components: {
    Config,
    roleSelect,
  },
  setup() {
    const pureUser = useUserStore();
    const roleName = ref('');
    const dictData = reactive({
      submitLoading: false,
      showEdit: false,
      isEdit: null,
      selectRow: null,
      filterName: "",
      tableData: [],
      formData: {
        id:"",
        role:"",
        name: "",
        model: "",
        parentId: "0",
        parentName: "",
        modelName: "",
        routerName: "",
        jsonStr: "",
      },
      formItems: [
        {
          field: "parentName",
          title: "父级模块:",
          span: 24,
          itemRender: {
            name: "text",
            props: {
              placeholder: "请输入name",
              disabled: true,
            },
          },
        },
        {
          field: "modelName",
          title: "模块名称:",
          span: 24,
          itemRender: {
            name: "$input",
            props: { placeholder: "请输入模块名称" },
          },
        },
        {
          field: "routerName",
          title: "路由name:",
          span: 24,
          itemRender: {
            name: "$input",
            props: {
              placeholder: "请输入name",
            },
          },
        },
        {
          field: "jsonStr",
          title: "json:",
          span: 24,
          itemRender: {
            name: "$textarea",
            props: {
              placeholder: "请输入name",
            },
          },
        },
        {
          align: "right",
          span: 24,
          itemRender: {
            name: "$buttons",
            children: [
              { props: { type: "submit", content: "提交", status: "primary" } },
              { props: { type: "reset", content: "重置" } },
            ],
          },
        },
      ] as VxeFormPropTypes.Items,
    });
    const set: setInter = reactive({
      user: computed(() => {
        return pureUser.user;
      }),
    });

    let originData = cloneDeep(dictData.tableData);

    const xTree = templateRef<HTMLElement | any>("xTree", null);

    const formatDate = (value: any) => {
      return XEUtils.toDateString(value, "yyyy-MM-dd HH:mm:ss.S");
    };

    const handleSearch = () => {
      const filterName = XEUtils.toValueString(dictData.filterName).trim();

      if (filterName) {
        const options = { children: "children" };
        const searchProps = ["name"];

        dictData.tableData = XEUtils.searchTree(
          originData,
          (item) =>
            searchProps.some(
              (key) => XEUtils.toValueString(item[key]).indexOf(filterName) > -1
            ),
          options
        );

        // 搜索之后默认展开所有子节点
        nextTick(() => {
          const $table = xTree.value;
          $table.setAllTreeExpand(true);
        });
      } else {
        dictData.tableData = originData;
      }
    };

    // 创建一个防防抖函数，调用频率间隔 100 毫秒
    const searchEvent = XEUtils.debounce(
      function () {
        handleSearch();
      },
      100,
      { leading: false, trailing: true }
    );

    const confirmEvent = async () => {
      const type = await VXETable.modal.confirm("您确定要删除吗？");
      (await type) === "confirm" &&
        VXETable.modal.message({
          content: "测试数据，不可删除",
          status: "error",
        });
    };
    
    function commonFn(value: any, type: Number) {
      dictData.selectRow = value;
      dictData.showEdit = true;
      dictData.isEdit = type;
      if (type === 3) {
        dictData.formData = value;
        dictData.formData.parentName = value.parentId ? value.modelName : "无";
        return;
      } else if (type === 2) {
        dictData.formData.role = value.role
        dictData.formData.parentId = String(value.id);
        dictData.formData.parentName = value.modelName;
        return;
      }
      dictData.formData.parentName = "无";
    }

    // 新增
    function onAdd() {
      commonFn(null, 1);
    }

    // 新增子类型
    function onAddChild(row: any) {
      // console.log(
      //   "%crow===>>>: ",
      //   "color: MidnightBlue; background: Aquamarine; font-size: 20px;",
      //   row
      // );
      commonFn(row, 2);
    }

    // 编辑
    function onEdit(row: any) {
      // dictData.formData = {
      //   name: row.name,
      //   model: row.model ? row.model : "暂无字典类型",
      // };
      commonFn(row, 3);
      // VXETable.modal.message({
      //   content: "测试数据，不可编辑",
      //   status: "error"
      // });
    }

    // 拷贝当前列表项的数据（字典类型）
    const { clipboardRef } = useCopyToClipboard();
    const cellDBLClickEvent: VxeTableEvents.CellDblclick = ({ row }) => {
      clipboardRef.value = unref(row).model;
    };

    const xTable = ref({} as VxeTableInstance);

    const submitEvent = () => {
      dictData.submitLoading = true;
      setTimeout(() => {
        // 编辑
        if (dictData.isEdit == 3) {
          editRoutes(dictData.formData).then((res) => {
            if (res.success) {
              ElMessage.success("编辑成功");
              roleSelectChangeFun(pureUser.user);
            } else {
              ElMessage.error(res.message);
            }
          });
          // 新增
        } else {
          delete dictData.formData.id
          AddRoutes(dictData.formData).then((res) => {
            if (res.success) {
              ElMessage.success("新增成功");
              roleSelectChangeFun(pureUser.user);
            } else {
              ElMessage.error(res.message);
            }
          });
        }
        dictData.submitLoading = false;
        dictData.showEdit = false;
      }, 500);
    };

    let drawer = ref(false);

    function onDeploy(row: any) {
      drawer.value = true;
    }

    function handleClose() {
      drawer.value = false;
    }

    //role change 查询
    function roleSelectChangeFun(data){
      getRoterWhereRole({role: data}).then(res=>{
        if(res.success){
          dictData.tableData = res.data
        }else{
          ElMessage.error(res.message);
        }
      })
    }

    return {
      ...toRefs(dictData),
      ...toRefs(set),
      formatDate,
      searchEvent,
      confirmEvent,
      cellDBLClickEvent,
      submitEvent,
      onEdit,
      onAddChild,
      onAdd,
      onDeploy,
      drawer,
      handleClose,
      roleName,
      roleSelectChangeFun,
    };
  },
};
</script>
<style lang="scss" scoped>
.dict-container {
  margin: 10px;
}
.vxe-input + .vxe-button,
.vxe-input + .vxe-button--dropdown,
.vxe-button + .vxe-button,
.vxe-button + .vxe-button--dropdown {
  margin-left: 0;
}
.vxe-button.type--button:not(.is--round) {
  border-radius: 0;
}
.vxe-button.size--medium.type--button {
  margin-right: 0.07em;
}
.text-model {
  &:hover {
    cursor: pointer;
  }
}
</style>