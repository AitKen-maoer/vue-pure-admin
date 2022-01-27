<template>
  <div class="login">
    <info
      :ruleForm="contextInfo"
      @on-behavior="onLogin"
      @refreshVerify="refreshVerify"
    />
  </div>
</template>

<script lang="ts">
import { reactive, onBeforeMount, computed } from "vue";
import info, { ContextProps } from "../components/info/index.vue";
import { getVerify, getLogin } from "/@/api/user";
import { useRouter } from "vue-router";
import { storageSession } from "/@/utils/storage";
import { warnMessage, successMessage, errorMessage } from "/@/utils/message";
import { useUserStore } from "/@/store/modules/user";

interface setInter {
  token: any;
  user: String;
}

export default {
  name: "login",
  components: {
    info,
  },
  setup() {
    const router = useRouter();
    const pureUser = useUserStore();
    // 刷新验证码
    const refreshGetVerify = async () => {
      let { svg } = await getVerify();
      contextInfo.svg = svg;
    };

    const contextInfo: ContextProps = reactive({
      userName: "admin",
      passWord: "123456",
      verify: null,
      svg: null,
    });

    const toPage = (info: Object): void => {
      storageSession.setItem("token", info);
      router.push("/");
    };

    const set: setInter = reactive({
      token: computed(() => {
        return pureUser.token;
      }),
      user: computed(() => {
        return pureUser.user;
      }),
    });


    // 登录
    const onLogin = async () => {
      let { userName, passWord, verify } = contextInfo;
      await getLogin({
        username: userName,
        password: passWord,
        verify: verify,
      }).then((res) => {
        if(res.success){
          successMessage("登陆成功！");
          pureUser.setTokenAndUser({ token:res.data.token,user: userName });
          toPage({username: userName,token: res.data.token})
        }else{
          errorMessage(res.message)
        }
      })
      // code === 0
      //   ? successMessage(info) &&
      //     toPage({
      //       username: userName,
      //       accessToken,
      //     })
      //   : warnMessage(info);
    };

    const refreshVerify = (): void => {
      refreshGetVerify();
    };

    onBeforeMount(() => {
      // refreshGetVerify();
    });

    return {
      contextInfo,
      set,
      onLogin,
      router,
      toPage,
      refreshVerify,
    };
  },
};
</script>
