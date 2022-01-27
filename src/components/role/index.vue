<template>
    <div style="display:inline-block;margin: 0 0 1px 20px;">
      <el-select
        :model-value="title"
        placeholder="请选择"
        size="small"
        @change="$emit('update:title', $event)"
      >
        <el-option
          v-for="(item,index) in formData.options"
          :key="index+'role'"
          :label="item"
          :value="item"
        >
        </el-option>
      </el-select>
    </div>
</template>

<script lang="ts">
import { getRoleName } from "/@/api/user";
import { ElMessage } from "element-plus";

export default {
  name: "roleSelect",
  props: {
    //接收数据属性
    title:{
      type:String,  
      default:'',
    }
  },
  emits: ['update:title'],
  setup(props) {
    const formData = {
      options: "",
    };
    getList();
    function getList() {
      getRoleName().then((res) => {
        if (res.success) {
          formData.options = res.data;
        } else {
          ElMessage.error(res.message);
        }
      });
    }
    return {
      formData,
    };
  },
};
</script>
<style scoped>
</style>