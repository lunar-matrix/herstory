export const AuthModal = (supabase, onLoginSuccess) => {
  const root = document.getElementById("modal-root");

  const show = () => {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-6";
    modal.innerHTML = `
            <div class="absolute inset-0 bg-[#2c003e]/60 backdrop-blur-sm transition-opacity"></div>
            <div class="relative bg-white w-full max-w-md rounded-2xl p-10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-800"></div>
                
                <!-- 【新增】左上角隐藏的管理员钥匙 -->
                <button type="button" id="toggle-admin" class="absolute top-6 left-6 text-gray-300 hover:text-purple-600 transition-colors" title="特殊通道">
                    <i data-lucide="key" class="w-5 h-5"></i>
                </button>

                <button id="close-modal" class="absolute top-6 right-6 text-gray-400 hover:text-black">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>

                <h2 class="text-3xl font-serif font-bold text-center mb-2 mt-2">建立身份</h2>
                <p class="text-center text-xs text-gray-400 mb-8 italic tracking-widest">Establish your identity in HERSTORY</p>
                
                <form id="auth-form" class="space-y-6">
                    <div>
                        <label class="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">性别设定 GENDER CHOICE</label>
                        <div class="flex flex-col space-y-3">
                            <label class="relative flex items-center p-4 border-2 border-purple-500 bg-purple-50 rounded-xl cursor-pointer transition-all group">
                                <input type="radio" name="gender" value="女" class="hidden" checked>
                                <div class="w-4 h-4 rounded-full border-2 border-purple-500 mr-4 flex items-center justify-center">
                                    <div class="w-2 h-2 bg-purple-600 rounded-full scale-100 transition-transform"></div>
                                </div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-lg">女 WOMAN</span>
                                    <span class="text-[10px] text-purple-500">欢迎加入Women的Herstory</span>
                                </div>
                            </label>
                            <label class="relative flex items-center p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-all group opacity-60">
                                <input type="radio" name="gender" value="男" class="hidden">
                                <div class="w-4 h-4 rounded-full border border-gray-300 mr-4 flex items-center justify-center">
                                    <div class="w-2 h-2 bg-gray-400 rounded-full scale-0 transition-transform"></div>
                                </div>
                                <div class="flex flex-col">
                                    <span class="font-bold">男 MAN</span>
                                    <span class="text-[10px] text-gray-400">请根据生理性别选择</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="space-y-4 pt-4">
                        <input type="text" id="auth-username" required placeholder="昵称 Nickname" class="w-full border-b border-gray-200 py-2 focus:border-purple-500 outline-none transition-all text-sm">
                        <input type="email" id="auth-email" required placeholder="邮箱 Email" class="w-full border-b border-gray-200 py-2 focus:border-purple-500 outline-none transition-all text-sm">
                        <input type="password" id="auth-pwd" required placeholder="密码 Password" class="w-full border-b border-gray-200 py-2 focus:border-purple-500 outline-none transition-all text-sm">
                        
                        <!-- 【新增】默认隐藏的管理员密钥输入框 -->
                        <div id="admin-key-container" class="hidden overflow-hidden transition-all duration-300">
                            <input type="password" id="auth-admin-key" placeholder="管理员密钥 (普通用户无需填写)" class="w-full bg-purple-50 border border-purple-200 py-2 px-3 rounded text-purple-900 focus:border-purple-500 outline-none transition-all text-sm">
                        </div>
                    </div>

                    <button type="submit" id="submit-auth" class="w-full bg-[#2c003e] text-white py-4 rounded-xl font-bold tracking-widest hover:bg-purple-900 transition-all mt-4 flex justify-center items-center">
                        觉醒 AWAKEN / 登录 LOGIN
                    </button>
                    <p class="text-[10px] text-center text-gray-400 mt-2">首次使用将自动为您注册，已注册则直接登录。</p>
                </form>
            </div>
        `;
    root.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    const closeBtn = modal.querySelector("#close-modal");
    closeBtn.onclick = () => root.removeChild(modal);

    // 控制管理员密钥框的显示与隐藏
    const toggleAdminBtn = modal.querySelector("#toggle-admin");
    const adminKeyContainer = modal.querySelector("#admin-key-container");
    toggleAdminBtn.onclick = () => {
      adminKeyContainer.classList.toggle("hidden");
      if (!adminKeyContainer.classList.contains("hidden")) {
        modal.querySelector("#auth-admin-key").focus();
        toggleAdminBtn.classList.add("text-purple-600");
      } else {
        toggleAdminBtn.classList.remove("text-purple-600");
      }
    };

    const radios = modal.querySelectorAll('input[name="gender"]');
    radios.forEach((r) => {
      r.addEventListener("change", () => {
        modal.querySelectorAll("label").forEach((l) => {
          l.classList.remove("border-purple-500", "bg-purple-50", "border-2");
          l.classList.add("border-gray-100", "border");
        });
        if (r.checked) {
          const label = r.closest("label");
          label.classList.remove("border-gray-100", "border");
          label.classList.add("border-purple-500", "bg-purple-50", "border-2");

          const circle = r.nextElementSibling.querySelector("div");
          modal
            .querySelectorAll('input[name="gender"]')
            .forEach((i) =>
              i.nextElementSibling
                .querySelector("div")
                .classList.remove("scale-100")
            );
          modal
            .querySelectorAll('input[name="gender"]')
            .forEach((i) =>
              i.nextElementSibling.querySelector("div").classList.add("scale-0")
            );
          circle.classList.remove("scale-0");
          circle.classList.add("scale-100");
        }
      });
    });

    const form = modal.querySelector("#auth-form");
    const submitBtn = modal.querySelector("#submit-auth");

    form.onsubmit = async (e) => {
      e.preventDefault();
      submitBtn.innerHTML = "处理中 PROCESSING...";
      submitBtn.classList.add("opacity-70");

      const email = form.querySelector("#auth-email").value;
      const password = form.querySelector("#auth-pwd").value;
      const username = form.querySelector("#auth-username").value;
      const gender = form.querySelector('input[name="gender"]:checked').value;

      // 获取填写的暗号
      const adminKeyInput = form.querySelector("#auth-admin-key").value;
      // 判定暗号是否正确
      const isTryingAdmin = adminKeyInput === "WOMENUPINHERSTORY20260308";
      // 【新增】判定是否是超级管理员暗号
      const isSuperAdmin = adminKeyInput === "SHENHONGZHITUKUIXIN233";

      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 注册流程
      if (error && error.message.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({ email, password });

        if (signUpError) {
          alert("错误：" + signUpError.message);
          submitBtn.innerHTML = "觉醒 AWAKEN / 登录 LOGIN";
          submitBtn.classList.remove("opacity-70");
          return;
        }

        if (signUpData.user) {
          await supabase.from("users").insert([
            {
              id: signUpData.user.id,
              email: email,
              password: "hashed_in_auth",
              username: username,
              gender: gender,
              is_admin: isTryingAdmin || isSuperAdmin, // 普通管理或超管都算管理
              is_super_admin: isSuperAdmin, // 【新增】单独记录超管身份
            },
          ]);
        }
        data = signUpData;
      } else if (error) {
        alert("登录错误：" + error.message);
        submitBtn.innerHTML = "觉醒 AWAKEN / 登录 LOGIN";
        submitBtn.classList.remove("opacity-70");
        return;
      } else {
        // 登录成功流程：如果填了正确的密钥，给现有账号升级管理员权限
        if ((isTryingAdmin || isSuperAdmin) && data.user) {
          const updateData = { is_admin: true };
          if (isSuperAdmin) updateData.is_super_admin = true; // 【新增】加上超管标记

          await supabase
            .from("users")
            .update(updateData)
            .eq("id", data.user.id);
        }
      }

      root.removeChild(modal);
      if (onLoginSuccess) onLoginSuccess(true); // 传 true 表示经过了登录界面
    };
  };

  return { show };
};

