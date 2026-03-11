import { Logo } from "./components/logo.js";
import { Navigation } from "./components/navigation.js";
import { AuthModal } from "./components/auth_modal.js";
import { PostCard } from "./components/post_card.js";
import { EmotionButton } from "./components/emotion_button.js";

const SUPABASE_URL = "https://dekhrohejftutuhbqyrz.supabase.co";
const SUPABASE_KEY = "sb_publishable_v7kda-y0IQnC1PL21qd-Zw_pMFgX5o_";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const SECTION_MAP = {
  LATEST: "最新",
  HOTTEST: "最热",
  ORIGINAL: "原创文章",
  CURATED: "转载图文",
  "HER-HISTORY": "史书记载",
  "FACT-CHECK": "辟谣专区",
  SANCTUARY: "树洞与求助",
};

class App {
  constructor() {
    this.posts = [];
    this.currentUser = null;
    this.currentFilter = "latest";
    this.searchQuery = "";
    this.init();
  }

  async init() {
    Logo("logo-container");
    Logo("logo-container");
    Navigation("main-nav");
    if (window.lucide) window.lucide.createIcons();

    // 【新增】树洞安全区防截图与隐私保护机制
    const style = document.createElement("style");
    style.innerHTML = `
        .sanctuary-mode #post-feed { user-select: none; -webkit-user-select: none; }
        .blur-protection #post-feed { filter: blur(20px); pointer-events: none; transition: filter 0.3s; }
    `;
    document.head.appendChild(style);

    // 监听截图按键 (PrintScreen)
    document.addEventListener("keyup", (e) => {
      if (
        (e.key === "PrintScreen" || e.key === "Snapshot") &&
        this.currentFilter === "树洞与求助"
      ) {
        navigator.clipboard.writeText("【保护隐私】树洞专区禁止截图外传。");
        alert(
          "⚠️ 树洞为女性专属隐私安全区，禁止截图分享！\n您的剪贴板已被自动清空。"
        );
      }
    });

    // 监听切屏/后台运行 (防录屏/窗口截图工具)
    window.addEventListener("blur", () => {
      if (this.currentFilter === "树洞与求助") {
        document.body.classList.add("blur-protection");
      }
    });
    window.addEventListener("focus", () => {
      document.body.classList.remove("blur-protection");
    });

    Navigation("main-nav");
    if (window.lucide) window.lucide.createIcons();

    await this.checkUser();

    const navLinks = document.querySelectorAll("#main-nav a");
    navLinks.forEach((link) => {
      link.onclick = (e) => {
        e.preventDefault();

        const activeEnSpan = link.querySelector("span:first-child");
        const sectionEnName = activeEnSpan.textContent.trim().toUpperCase();
        const targetSection = SECTION_MAP[sectionEnName];

        // 【新增】拦截男用户进入树洞板块
        if (
          targetSection === "树洞与求助" &&
          this.currentUser &&
          this.currentUser.gender === "男"
        ) {
          alert("抱歉，树洞为女性专属安全区，男性用户无法进入及查看。");
          return; // 直接返回，不执行后面的样式切换和渲染
        }

        // 样式切换逻辑
        navLinks.forEach((l) => {
          const enSpan = l.querySelector("span:first-child");
          const zhSpan = l.querySelector("span:last-child");
          enSpan.classList.remove("text-purple-700", "font-bold");
          enSpan.classList.add("text-purple-300");
          zhSpan.classList.remove("text-purple-900");
          zhSpan.classList.add("text-gray-500");
        });

        const activeZhSpan = link.querySelector("span:last-child");
        activeEnSpan.classList.remove("text-purple-300");
        activeEnSpan.classList.add("text-purple-700", "font-bold");
        activeZhSpan.classList.remove("text-gray-500");
        activeZhSpan.classList.add("text-purple-900");

        this.currentFilter = targetSection;
        this.searchQuery = "";
        if (document.getElementById("global-search"))
          document.getElementById("global-search").value = "";
        this.renderFeed("latest");
      };
    });

    // 【新增】增强主页搜索框功能（支持搜昵称）
    const searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderFeed("latest"); // 实时渲染搜索结果
      };
    }

    document.querySelectorAll(".nav-sort").forEach((btn) => {
      btn.onclick = (e) => {
        document
          .querySelectorAll(".nav-sort")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.renderFeed(e.target.dataset.sort);
      };
    });

    document.addEventListener("contextmenu", (e) => e.preventDefault());
    await this.loadPosts();
    this.renderFeed("latest");
  }

  async checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const actionsContainer = document.getElementById("user-actions");

    if (user) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (dbUser) {
        this.currentUser = {
          id: dbUser.id,
          name: dbUser.username,
          credit: dbUser.credit_score,
          level: parseInt(dbUser.level.replace(/[^0-9]/g, "")) || 1,
          gender: dbUser.gender,
          is_admin: dbUser.is_admin,
          // 新增：初始化禁言截止时间字段（从数据库读取）
          banned_until: dbUser.banned_until,
        };
      }

      actionsContainer.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="relative hidden lg:block">
                        <input type="text" id="global-search" placeholder="搜标题/正文/ID..." class="bg-purple-50 text-xs px-4 py-2 rounded-full outline-none focus:ring-1 focus:ring-purple-300 w-48 transition-all">
                        <i data-lucide="search" class="absolute right-3 top-2 w-4 h-4 text-purple-300"></i>
                    </div>
                    <button id="btn-profile" class="text-xs text-purple-800 font-bold tracking-widest hover:text-purple-500 transition cursor-pointer flex items-center">
                        Lv${this.currentUser.level} ${this.currentUser.name}
                        ${
                          this.currentUser.is_admin
                            ? '<span id="btn-admin-panel" class="ml-1 text-[9px] bg-purple-900 text-white px-2 py-0.5 rounded-full cursor-pointer hover:bg-purple-700 shadow-md">管理后台</span>'
                            : ""
                        }
  
                    </button>
                    <button id="btn-post" class="text-xs bg-purple-900 text-white px-5 py-2 rounded-full hover:bg-purple-800 font-bold tracking-widest shadow-md transition-all">+ 发声 POST</button>
                    <button id="btn-logout" class="text-xs text-gray-400 hover:text-purple-600 transition-colors">退出</button>
                </div>
            `;

      document.getElementById("btn-profile").onclick = () =>
        this.showUserProfile();
      document.getElementById("btn-logout").onclick = async () => {
        await supabase.auth.signOut();
        window.location.reload();
      };
      document.getElementById("btn-post").onclick = () => this.showPostModal();

      // --------------------------
      // 👇 新增的代码（精准插入位置）👇
      // --------------------------
      // 记录禁言状态
      this.currentUser.banned_until = dbUser.banned_until;
      // 绑定管理后台点击
      if (this.currentUser.is_admin) {
        document.getElementById("btn-admin-panel").onclick = (e) => {
          e.stopPropagation();
          this.showAdminPanel();
        };
      }
      // --------------------------
      // 👆 新增代码结束 👆
      // --------------------------

      const searchInput = document.getElementById("global-search");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          this.renderFeed(
            document.querySelector(".nav-sort.active")?.dataset.sort || "latest"
          );
        });
      }
    } else {
      actionsContainer.innerHTML = `<button id="btn-register" class="text-xs border border-purple-300 px-6 py-2 rounded-full hover:bg-purple-50 text-purple-900 font-bold tracking-widest transition-all">加入 Women</button>`;
      document.getElementById("btn-register").onclick = () => {
        // 先显示法律弹窗，用户同意后再显示登录/注册框
        this.showLegalModal(() => {
          AuthModal(supabase, () => window.location.reload()).show();
        });
      };
    }
  }

  async loadPosts() {
    try {
      // 核心修复：去掉了 users 后面的 !inner，改为默认的 Left Join。
      // 这样即使用户注销了账号，他曾经发的帖子依然会被拉取下来供管理员查看和审核。
      const { data, error } = await supabase
        .from("contents")
        .select("*, author:users(id, username, level, credit_score, gender)")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      this.posts = data.map((p) => {
        const isAnon = p.title && p.title.startsWith("[匿名] ");
        // 【新增】兼容逻辑：如果作者账号已被注销，p.author 会变成 null，用空对象兜底防崩溃
        const authorInfo = p.author || {};

        return {
          id: p.id,
          title: isAnon ? p.title.replace("[匿名] ", "") : p.title,
          excerpt: p.content,
          category: p.section,
          likes: p.like_count || 0,
          dislikes: p.dislike_count || 0,
          muyu_clicks: 0,
          comments: p.view_count || 0,
          audit_status: p.audit_status,
          user_id: p.user_id,
          author: {
            id: authorInfo.id || p.user_id,
            // 如果账号被注销，作者名显示为“已注销账号”
            name: isAnon ? "Woman" : authorInfo.username || "已注销账号",
            level: isAnon
              ? 1
              : parseInt((authorInfo.level || "1").replace(/[^0-9]/g, "")) || 1,
            credit: authorInfo.credit_score || 0,
            gender: authorInfo.gender || "女",
          },
          burn_after_hours: p.burn_after_hours,
          burn_after_views: p.burn_after_views,
        };
      });
    } catch (err) {
      console.error("加载数据失败", err);
    }
  }

  getInteractionWeights() {
    if (!this.currentUser) return { like: 1, dislike: 1 };
    let score = 308 + this.currentUser.credit;
    if (score >= 3080) return { like: 20, dislike: 5 };
    if (score >= 2500) return { like: 14, dislike: 4 };
    if (score >= 2000) return { like: 12, dislike: 3 };
    if (score >= 1200) return { like: 10, dislike: 2 };
    if (score >= 800) return { like: 8, dislike: 1 };
    if (score >= 600) return { like: 6, dislike: 1 };
    if (score >= 400) return { like: 2, dislike: 1 };
    return { like: 1, dislike: 1 };
  }
  isBanned() {
    if (!this.currentUser || !this.currentUser.banned_until) return false;
    const banEnd = new Date(this.currentUser.banned_until);
    if (banEnd > new Date()) {
      alert(
        `您当前处于禁言状态，无法发声或共鸣。\n解禁时间：${banEnd.toLocaleString()}`
      );
      return true;
    }
    return false;
  }

  // 【新增 3：管理员暗网面板】显示所有用户并执行禁言
  async showAdminPanel() {
    if (!this.currentUser || !this.currentUser.is_admin) return;
    const root = document.getElementById("modal-root");
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 z-[120] flex items-center justify-center p-6";
    modal.innerHTML = `<div class="absolute inset-0 bg-[#2c003e]/90 backdrop-blur-md close-admin"></div>
            <div class="relative bg-white w-full max-w-4xl max-h-[80vh] rounded-3xl p-8 shadow-2xl flex flex-col animate-in zoom-in duration-200">
                <div class="flex justify-between items-center mb-6 border-b border-purple-100 pb-4">
                    <h2 class="text-2xl font-bold text-purple-900 tracking-widest">核心控制台 ADMIN PANEL</h2>
                    <div class="flex items-center space-x-4">
                        <!-- 【新增】搜索框 -->
                        <input type="text" id="admin-search" placeholder="搜索用户昵称..." class="border border-purple-200 rounded-full px-4 py-1.5 text-sm outline-none focus:border-purple-600 w-48 text-purple-900 bg-purple-50">
                        <button class="close-admin text-gray-400 hover:text-purple-600"><i data-lucide="x" class="w-6 h-6"></i></button>
                    </div>
                </div>
                <div class="overflow-y-auto flex-grow custom-scrollbar pr-2" id="admin-user-list">
                    <div class="text-center text-purple-600 py-10">加载全网矩阵数据中...</div>
                </div>
            </div>`;
    root.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    modal
      .querySelectorAll(".close-admin")
      .forEach((btn) => (btn.onclick = () => root.removeChild(modal)));

    // 拉取所有用户
    const { data: users } = await supabase
      .from("users")
      .select("*")
      .order("credit_score", { ascending: false });

    const listDiv = modal.querySelector("#admin-user-list");

    // 【新增】将渲染列表封装成函数，方便搜索时动态刷新
    const renderUsers = (userList) => {
      listDiv.innerHTML = `
            <table class="w-full text-left border-collapse">
                <thead><tr class="text-xs text-purple-400 border-b border-purple-100"><th class="py-3">用户矩阵 ID</th><th class="py-3">等级与净值</th><th class="py-3">当前状态</th><th class="py-3">制裁操作</th></tr></thead>
                <tbody>
                    ${userList
                      .map((u) => {
                        let status = `<span class="text-green-500 font-bold text-xs">活跃</span>`;
                        if (
                          u.banned_until &&
                          new Date(u.banned_until) > new Date()
                        ) {
                          status = `<span class="text-red-500 font-bold text-[10px]">禁言至 ${new Date(
                            u.banned_until
                          ).toLocaleString()}</span>`;
                        }

                        // 【新增】管理员徽章显示
                        const adminBadge = u.is_admin
                          ? `<span class="bg-purple-900 text-white text-[9px] px-1.5 py-0.5 rounded ml-2 align-middle font-normal tracking-wider">[管理]</span>`
                          : "";

                        return `
                        <tr class="border-b border-gray-50 hover:bg-purple-50/50 transition-colors">
                            <td class="py-4">
                                <div class="font-bold text-purple-900 flex items-center">
                                  ${u.username} ${adminBadge}
                                </div>
                                <div class="text-[10px] text-gray-400 font-mono">${
                                  u.id
                                }</div>
                            </td>
                            <td class="py-4 text-sm text-gray-700">${
                              u.level ? u.level.replace(/Lv[0-9]/, "") : ""
                            } Lv${
                          u.level
                            ? parseInt(u.level.replace(/[^0-9]/g, "")) || 1
                            : 1
                        }<br/><span class="text-xs text-purple-500 font-bold">${
                          308 + (u.credit_score || 0)
                        } 分</span></td>
                            <td class="py-4" id="status-${u.id}">${status}</td>
                            <td class="py-4 flex items-center space-x-2">
                                <select class="text-xs border border-purple-200 rounded p-2 bg-white ban-select outline-none focus:border-purple-500" data-uid="${
                                  u.id
                                }">
                                    <option value="">选择制裁...</option>
                                    <option value="10">禁言 10 分钟</option>
                                    <option value="60">禁言 1 小时</option>
                                    <option value="180">禁言 3 小时</option>
                                    <option value="1440">禁言 24 小时</option>
                                    <option value="52560000">永久封禁</option>
                                    <option value="0">解除禁言</option>
                                </select>
                                <button class="bg-red-50 text-red-600 border border-red-200 text-[10px] px-3 py-2 rounded font-bold hover:bg-red-600 hover:text-white transition-colors apply-ban" data-uid="${
                                  u.id
                                }">执行</button>
                            </td>
                        </tr>`;
                      })
                      .join("")}
                </tbody>
            </table>
        `;

      // 绑定执行按钮事件
      listDiv.querySelectorAll(".apply-ban").forEach((btn) => {
        btn.onclick = async () => {
          const uid = btn.dataset.uid;

          // 【修改】管理员制裁阶级逻辑：比较信用分
          const targetUser = userList.find((user) => user.id === uid);
          if (targetUser.id === this.currentUser.id) {
            return alert("无效操作：您不能对自己执行制裁！");
          }
          if (targetUser.is_admin) {
            const myCredit = this.currentUser.credit || 0;
            const targetCredit = targetUser.credit_score || 0;
            if (myCredit <= targetCredit) {
              return alert(
                "越权操作：同为核心管理，您只能制裁信用分低于您的管理员！"
              );
            }
          }

          const select = listDiv.querySelector(
            `.ban-select[data-uid="${uid}"]`
          );
          const minutes = parseInt(select.value);
          if (isNaN(minutes)) return alert("请先选择制裁时间");

          let bannedUntil = null;
          if (minutes > 0)
            bannedUntil = new Date(
              new Date().getTime() + minutes * 60000
            ).toISOString();

          btn.innerText = "处理中";
          const { error } = await supabase
            .from("users")
            .update({ banned_until: bannedUntil })
            .eq("id", uid);

          if (!error) {
            btn.innerText = "已生效";
            const statusTd = listDiv.querySelector(`#status-${uid}`);
            if (minutes === 0)
              statusTd.innerHTML = `<span class="text-green-500 font-bold text-xs">活跃</span>`;
            else
              statusTd.innerHTML = `<span class="text-red-500 font-bold text-[10px]">禁言至 ${new Date(
                bannedUntil
              ).toLocaleString()}</span>`;
            setTimeout(() => {
              btn.innerText = "执行";
              select.value = "";
            }, 2000);
          } else {
            alert("操作失败: " + error.message);
            btn.innerText = "执行";
          }
        };
      });
    };

    // 首次渲染全部数据
    renderUsers(users || []);

    // 【新增】搜索框的实时过滤逻辑
    const searchInput = modal.querySelector("#admin-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        if (!keyword) {
          renderUsers(users || []);
        } else {
          // 根据昵称进行筛选
          const filtered = (users || []).filter(
            (u) => u.username && u.username.toLowerCase().includes(keyword)
          );
          renderUsers(filtered);
        }
      });
    }
  }

  async showUserProfile() {
    if (!this.currentUser) return;
    const root = document.getElementById("modal-root");
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 z-[110] flex items-center justify-center p-6";
    modal.innerHTML = `<div class="absolute inset-0 bg-[#2c003e]/60 backdrop-blur-sm"></div><div class="relative bg-white p-8 rounded-3xl text-center"><span class="text-purple-600 font-bold">正在计算信用轨迹...</span></div>`;
    root.appendChild(modal);

    const { data: myPosts } = await supabase
      .from("contents")
      .select("id")
      .eq("user_id", this.currentUser.id);
    const postIds = myPosts ? myPosts.map((p) => p.id) : [];

    let likesCount = 0;
    let dislikesCount = 0;
    if (postIds.length > 0) {
      const { count: lCount } = await supabase
        .from("interactions")
        .select("*", { count: "exact", head: true })
        .in("content_id", postIds)
        .neq("interaction_type", "踩");
      const { count: dCount } = await supabase
        .from("interactions")
        .select("*", { count: "exact", head: true })
        .in("content_id", postIds)
        .eq("interaction_type", "踩");
      likesCount = lCount || 0;
      dislikesCount = dCount || 0;
    }

    // 算分与升级逻辑
    let score = 308 + likesCount - dislikesCount * 10;
    let newLevel = 1;
    let nextScore = 400;
    let privilegeText = "无权限";

    if (score >= 3080) {
      newLevel = 8;
      nextScore = null;
      privilegeText = "点赞1记20，点踩1记5";
    } else if (score >= 2500) {
      newLevel = 7;
      nextScore = 3080;
      privilegeText = "点赞1记14，点踩1记4";
    } else if (score >= 2000) {
      newLevel = 6;
      nextScore = 2500;
      privilegeText = "点赞1记12，点踩1记3";
    } else if (score >= 1200) {
      newLevel = 5;
      nextScore = 2000;
      privilegeText = "点赞1记10，点踩1记2";
    } else if (score >= 800) {
      newLevel = 4;
      nextScore = 1200;
      privilegeText = "点赞1记8";
    } else if (score >= 600) {
      newLevel = 3;
      nextScore = 800;
      privilegeText = "点赞1记6";
    } else if (score >= 400) {
      newLevel = 2;
      nextScore = 600;
      privilegeText = "点赞1记2";
    }

    const diffText = nextScore
      ? `距离下一等级还差 ${nextScore - score} 分`
      : "您已觉醒最高管理权限。";

    const levelMap = ["女", "妇", "媛", "娇", "嫖", "妒", "汝", "好"];

    // 【修改】如果性别是男，中间大字固定显示“男”；否则按等级显示专属汉字
    const title =
      this.currentUser.gender === "男" ? "男" : levelMap[newLevel - 1];

    let isAdmin = this.currentUser.is_admin;

    if (newLevel === 8 && !isAdmin) {
      await supabase
        .from("users")
        .update({ is_admin: true, level: `Lv8${title}` })
        .eq("id", this.currentUser.id);
      isAdmin = true;
      this.currentUser.is_admin = true;
    }

    modal.innerHTML = `
            <div class="absolute inset-0 bg-[#2c003e]/60 backdrop-blur-sm profile-overlay"></div>
            <div class="relative bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-in zoom-in duration-300 border border-purple-100">
                <button id="close-profile" class="absolute top-4 right-4 text-gray-400 hover:text-purple-600"><i data-lucide="x" class="w-5 h-5"></i></button>
                
                <!-- 【新增】左下角注销按钮 -->
                <button id="btn-delete-account" class="absolute bottom-6 left-6 text-[10px] text-gray-300 hover:text-red-500 transition-colors">注销</button>

                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-3xl font-black text-purple-900 border-4 border-white shadow-lg mb-4">
                    ${title}
                </div>
                <div class="text-xl font-bold text-gray-900 flex items-center mb-1">
                    ${this.currentUser.name}
                    ${
                      isAdmin
                        ? '<span class="ml-2 text-[9px] bg-purple-900 text-white px-2 py-0.5 rounded-full">核心管理</span>'
                        : ""
                    }
                </div>
                <div class="text-xs text-purple-400 font-mono tracking-widest mb-1">Lv ${newLevel} Architect</div>
                
                <div class="text-[10px] text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full mb-6">
                    特权：${privilegeText}
                </div>
                
                <div class="w-full bg-purple-50 rounded-2xl p-4 mb-6 relative overflow-hidden">
                    <div class="text-xs text-purple-800 font-bold mb-3 flex items-center"><i data-lucide="activity" class="w-4 h-4 mr-2"></i>信用与共鸣统计</div>
                    <div class="grid grid-cols-3 gap-2 text-center relative z-10">
                        <div class="flex flex-col"><span class="text-xl font-black text-purple-900">${score}</span><span class="text-[9px] text-purple-400 tracking-widest">信用分</span></div>
                        <div class="flex flex-col border-l border-r border-purple-200/50"><span class="text-xl font-black text-purple-600">${likesCount}</span><span class="text-[9px] text-purple-400 tracking-widest">获赞</span></div>
                        <div class="flex flex-col"><span class="text-xl font-black text-gray-500">${dislikesCount}</span><span class="text-[9px] text-purple-400 tracking-widest">被踩</span></div>
                    </div>
                </div>
                
                <p class="text-[10px] text-gray-400 text-center leading-relaxed">
                    初始信用分为 308 分。<br/>
                    获取 1 赞记 1 分，被踩 1 次扣 10 分。<br/>
                    <span class="text-purple-600 font-bold mt-1 inline-block">${diffText}</span>
                </p>
            </div>
        `;
    if (window.lucide) window.lucide.createIcons();

    // 关闭按钮绑定
    modal.querySelector("#close-profile").onclick = () =>
      root.removeChild(modal);
    modal.querySelector(".profile-overlay").onclick = () =>
      root.removeChild(modal);

    // 【新增】注销按钮绑定逻辑
    const btnDeleteAcc = modal.querySelector("#btn-delete-account");
    if (btnDeleteAcc) {
      btnDeleteAcc.onclick = async () => {
        const confirmDelete = window.confirm(
          "确定要注销您的账号吗？\n注销后您发布的内容将依然保留，但您的个人主页和身份将被永久清除。该操作不可逆！"
        );
        if (confirmDelete) {
          try {
            // 1. 从公开的 users 表里删除用户信息，让昵称邮箱得以重新注册
            await supabase.from("users").delete().eq("id", this.currentUser.id);
            // 2. 退出登录会话
            await supabase.auth.signOut();
            // 3. 刷新页面回到初始状态
            window.location.reload();
          } catch (error) {
            alert("注销失败：" + error.message);
          }
        }
      };
    }
  }

  async showPostDetail(post) {
    const root = document.getElementById("modal-root");
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6";

    // 【修正】男性用户头像强制显示为男
    const levelMap = ["女", "妇", "媛", "娇", "嫖", "妒", "汝", "好"];
    const authorTitle =
      post.author.gender === "男"
        ? "男"
        : levelMap[Math.min((post.author.level || 1) - 1, 7)];

    const isAuthor = this.currentUser && this.currentUser.id === post.author.id;
    const isAdmin = this.currentUser && this.currentUser.is_admin;
    const canDelete = isAuthor || isAdmin;
    const isPublicWiki = ["转载图文", "史书记载", "辟谣专区"].includes(
      post.category
    );
    const canEdit = isAuthor || (isAdmin && isPublicWiki);

    // 获取评论
    const { data: comments } = await supabase
      .from("comments")
      .select("*, author:users(username, level)")
      .eq("content_id", post.id)
      .order("created_at", { ascending: true });

    const commentsHtml =
      comments && comments.length > 0
        ? comments
            .map((c) => {
              // 核心判断：当前登录用户是不是这条评论的作者？或者是管理员？
              const canDeleteComment =
                this.currentUser &&
                (this.currentUser.id === c.user_id ||
                  this.currentUser.is_admin);

              // 如果有权限，就渲染删除按钮；否则为空
              const deleteBtnHtml = canDeleteComment
                ? `<button class="text-[10px] text-red-400 hover:text-red-600 ml-auto transition-colors delete-comment-btn" data-cid="${c.id}">删除评论</button>`
                : "";

              return `
                <div class="border-b border-purple-50 py-4 group">
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="text-xs font-bold text-purple-900">${
                          c.author.username
                        }</span>
                        <span class="text-[9px] text-purple-400 border border-purple-200 px-1 rounded">Lv${
                          parseInt(
                            (c.author.level || "").replace(/[^0-9]/g, "")
                          ) || 1
                        }</span>
                        <span class="text-[10px] text-gray-400">${new Date(
                          c.created_at
                        ).toLocaleDateString()}</span>
                        ${deleteBtnHtml}
                    </div>
                    <p class="text-sm text-gray-700">${c.content}</p>
                </div>
              `;
            })
            .join("")
        : '<div class="text-xs text-gray-400 italic py-4">暂无评论，来留下第一句话吧。</div>';

    // 审核状态标签
    let statusBadgeHtml = "";
    if (post.audit_status === "pending" || !post.audit_status) {
      statusBadgeHtml =
        '<span class="px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded">待审核</span>';
    } else if (post.audit_status === "approved") {
      statusBadgeHtml =
        '<span class="px-2 py-1 bg-purple-100 text-purple-600 text-[10px] font-bold rounded">已审核</span>';
    } else if (post.audit_status === "rejected") {
      statusBadgeHtml =
        '<span class="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded">未通过，请修改</span>';
    }

    const deleteText = isAdmin && !isAuthor ? "管理员强制删除" : "删除此发声";
    const editBtnHtml = canEdit
      ? `<button id="edit-post-btn" class="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-full text-xs font-bold transition-colors"><i data-lucide="edit-3" class="w-4 h-4"></i><span>编辑发声</span></button>`
      : "";
    const deleteBtnHtml = canDelete
      ? `<button id="delete-post-btn" class="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-full text-xs font-bold transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i><span>${deleteText}</span></button>`
      : "";

    // 只有管理员能看到底部巨大的审核操作面板
    // 【修改】只有当是管理员，且不是该帖子的作者时，才显示审核面板
    const adminAuditHtml =
      isAdmin && !isAuthor
        ? `
        <div class="mt-8 pt-6 border-t-2 border-purple-100 flex justify-center space-x-6 pb-2">

            <button id="audit-approve-btn" class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-md transition-colors flex items-center">
                <i data-lucide="check-circle" class="w-5 h-5 mr-2"></i> 审核通过
            </button>
            <button id="audit-reject-btn" class="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-md transition-colors flex items-center">
                <i data-lucide="x-circle" class="w-5 h-5 mr-2"></i> 拒绝/打回
            </button>
        </div>
        `
        : "";

    modal.innerHTML = `
            <div class="absolute inset-0 bg-[#2c003e]/60 backdrop-blur-sm detail-overlay"></div>
            <div class="relative bg-white w-full max-w-3xl h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
                <div class="p-8 sm:p-10 flex-grow overflow-y-auto custom-scrollbar">
                    <button id="close-detail" class="absolute top-6 right-6 text-gray-400 hover:text-purple-600 transition-colors z-10"><i data-lucide="x" class="w-6 h-6"></i></button>
                    
                    <div class="flex items-center space-x-2 mb-6 mt-4">
                        <span class="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">${
                          post.category
                        }</span>
                        ${statusBadgeHtml}
                        <span class="text-xs text-gray-400 font-mono tracking-widest uppercase ml-auto">ID.${post.id.slice(
                          0,
                          8
                        )}</span>
                    </div>
                    
                    <h1 class="text-3xl font-bold text-purple-900 mb-6 leading-normal tracking-wide">${
                      post.title
                    }</h1>
                    
                    <div class="flex items-center space-x-3 mb-8 pb-6 border-b border-purple-50">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center text-sm font-black text-purple-800 border border-purple-200">${authorTitle}</div>
                        <div>
                            <div class="text-sm font-bold text-gray-900">${
                              post.author.name
                            }</div>
                            <div class="text-[10px] text-purple-400 italic">Level ${
                              post.author.level || 1
                            } Architect</div>
                        </div>
                    </div>
                    
                    <div id="post-content-display" class="prose-content text-lg leading-loose text-gray-700 whitespace-pre-wrap font-light mb-8">${
                      post.excerpt
                    }</div>

                    <div class="flex justify-between items-center mb-8 border-t border-purple-50 pt-4">
                    <!-- 左侧：举报按钮 -->
                    <button id="report-post-btn" class="text-xs text-red-400 hover:text-red-600 flex items-center transition-colors group">
                      <i data-lucide="flag" class="w-4 h-4 mr-1 group-hover:animate-pulse"></i> 举报违规内容
                    </button>
                    
                    <!-- 右侧：原有的编辑和删除按钮 -->
                    <div class="flex space-x-3">
                      ${editBtnHtml}
                      ${deleteBtnHtml}
                    </div>
                  </div>
                  

                    <div class="mt-4 pt-8 border-t-2 border-dashed border-purple-100">
                        <h3 class="text-lg font-bold text-purple-900 mb-4 flex items-center"><i data-lucide="message-square" class="w-5 h-5 mr-2"></i>回声墙 (${
                          comments ? comments.length : 0
                        })</h3>
                        <div class="mb-6 flex space-x-3">
                            <input type="text" id="comment-input" placeholder="写下你的共鸣..." class="flex-grow bg-purple-50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-300">
                            <button id="submit-comment" class="bg-purple-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-purple-800 transition-colors">发送</button>
                        </div>
                        <div id="comments-list">${commentsHtml}</div>
                    </div>
                    
                    ${adminAuditHtml}
                </div>
            </div>
        `;
    root.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    modal.querySelector("#close-detail").onclick = () =>
      root.removeChild(modal);
    modal.querySelector(".detail-overlay").onclick = () =>
      root.removeChild(modal);
    // === 绑定删除评论的点击事件 ===
    modal.querySelectorAll(".delete-comment-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        if (!confirm("确定要永久删除这条回声吗？")) return;
        const cid = e.target.getAttribute("data-cid");
        e.target.innerText = "删除中...";

        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", cid);
        if (!error) {
          root.removeChild(modal); // 关闭当前详情弹窗
          this.showPostDetail(post); // 重新打开（实现无缝刷新评论区）
        } else {
          alert("删除评论失败：" + error.message);
          e.target.innerText = "删除评论";
        }
      };
    });
    // === 删除评论事件结束 ===

    // 绑定审核按钮事件
    if (isAdmin) {
      const approveBtn = modal.querySelector("#audit-approve-btn");
      const rejectBtn = modal.querySelector("#audit-reject-btn");

      if (approveBtn) {
        approveBtn.onclick = async () => {
          approveBtn.innerHTML = "处理中...";
          const { error } = await supabase
            .from("contents")
            .update({ audit_status: "approved" })
            .eq("id", post.id);
          if (!error) {
            alert("已通过审核，现在所有用户可见！");
            root.removeChild(modal);
            await this.loadPosts();
            this.renderFeed(
              document.querySelector(".nav-sort.active")?.dataset.sort ||
                "latest"
            );
          } else {
            alert("操作失败：" + error.message);
            approveBtn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 mr-2"></i> 审核通过`;
          }
        };
      }

      if (rejectBtn) {
        rejectBtn.onclick = async () => {
          rejectBtn.innerHTML = "处理中...";
          const { error } = await supabase
            .from("contents")
            .update({ audit_status: "rejected" })
            .eq("id", post.id);
          if (!error) {
            alert("已拒绝通过，该帖子将被打回让作者修改。");
            root.removeChild(modal);
            await this.loadPosts();
            this.renderFeed(
              document.querySelector(".nav-sort.active")?.dataset.sort ||
                "latest"
            );
          } else {
            alert("操作失败：" + error.message);
            rejectBtn.innerHTML = `<i data-lucide="x-circle" class="w-5 h-5 mr-2"></i> 拒绝/打回`;
          }
        };
      }
    }

    if (canDelete) {
      const deleteBtn = modal.querySelector("#delete-post-btn");
      if (deleteBtn) {
        deleteBtn.onclick = async () => {
          if (confirm("确定要永久删除这篇声音吗？")) {
            deleteBtn.innerText = "删除中...";
            const { error } = await supabase
              .from("contents")
              .update({ is_deleted: true })
              .eq("id", post.id);
            if (!error) {
              root.removeChild(modal);
              await this.loadPosts();
              this.renderFeed(
                document.querySelector(".nav-sort.active")?.dataset.sort ||
                  "latest"
              );
            } else {
              alert("删除失败: " + error.message);
              deleteBtn.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i><span>删除发声</span>`;
            }
          }
        };
      }
    }

    if (canEdit) {
      const editBtn = modal.querySelector("#edit-post-btn");
      const contentDisplay = modal.querySelector("#post-content-display");
      if (editBtn && contentDisplay) {
        editBtn.onclick = async () => {
          if (editBtn.innerText.includes("保存")) {
            editBtn.innerText = "保存中...";
            const textarea = modal.querySelector("#edit-textarea");
            const newContent = textarea.value;
            // 重新编辑后自动变为待审核
            const { error } = await supabase
              .from("contents")
              .update({ content: newContent, audit_status: "pending" })
              .eq("id", post.id);
            if (!error) {
              post.excerpt = newContent;
              alert("修改成功！已重新提交审核。");
              root.removeChild(modal);
              await this.loadPosts();
              this.renderFeed(
                document.querySelector(".nav-sort.active")?.dataset.sort ||
                  "latest"
              );
            } else {
              alert("修改失败：" + error.message);
              editBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>保存修改</span>`;
            }
          } else {
            contentDisplay.innerHTML = `<textarea id="edit-textarea" class="w-full h-64 bg-purple-50 border border-purple-200 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none">${post.excerpt}</textarea>`;
            editBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>保存修改</span>`;
            editBtn.classList.replace("text-purple-600", "text-white");
            editBtn.classList.replace("bg-purple-50", "bg-purple-600");
          }
        };
      }
    }

    const submitBtn = modal.querySelector("#submit-comment");
    if (submitBtn) {
      submitBtn.onclick = async () => {
        if (!this.currentUser) return alert("请先建立身份后再评论。");
        const input = modal.querySelector("#comment-input");
        if (!input.value.trim()) return;
        submitBtn.innerText = "发送中...";
        const { error } = await supabase.from("comments").insert([
          {
            content_id: post.id,
            user_id: this.currentUser.id,
            content: input.value.trim(),
          },
        ]);
        if (!error) {
          root.removeChild(modal);
          this.showPostDetail(post);
        } else {
          alert("评论失败：" + error.message);
          submitBtn.innerText = "发送";
        }
      };
    }
    // === 举报逻辑开始 ===
    const reportBtn = modal.querySelector("#report-post-btn");
    if (reportBtn) {
      reportBtn.onclick = async () => {
        if (!this.currentUser) return alert("请先建立身份后再进行举报。");

        if (confirm("确定要举报这篇内容违规吗？\n恶意举报将被限制访问权限。")) {
          reportBtn.innerText = "提交中...";
          reportBtn.disabled = true;

          try {
            // 1. 获取当前举报数
            const { data: currentPost } = await supabase
              .from("contents")
              .select("report_count")
              .eq("id", post.id)
              .single();

            const newReportCount = (currentPost?.report_count || 0) + 1;
            let updateData = { report_count: newReportCount };

            // 2. 举报阶梯逻辑
            if (newReportCount >= 10) {
              updateData.is_deleted = true; // 10次直接下架
            } else {
              updateData.audit_status = "pending"; // 1次及以上进入待审核
            }

            // 3. 更新数据库
            const { error: updateErr } = await supabase
              .from("contents")
              .update(updateData)
              .eq("id", post.id);

            if (updateErr) throw updateErr;

            alert(
              newReportCount >= 10
                ? "该内容已被群众力量下架。"
                : "已提交审核，管理员将尽快处理。"
            );
            root.removeChild(modal); // 关闭弹窗
            await this.loadPosts(); // 重新加载数据
            this.renderFeed(
              document.querySelector(".nav-sort.active")?.dataset.sort ||
                "latest"
            );
          } catch (err) {
            alert("操作失败：" + err.message);
            reportBtn.innerText = "举报违规";
            reportBtn.disabled = false;
          }
        }
      };
    }
    // === 举报逻辑结束 ===
  }

  async showPostModal() {
    const root = document.getElementById("modal-root");
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-6";
    modal.innerHTML = `
            <div class="absolute inset-0 bg-[#2c003e]/60 backdrop-blur-sm"></div>
            <div class="relative bg-white w-full max-w-2xl rounded-3xl p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <h2 class="text-2xl font-serif font-bold text-purple-900 mb-6">发布新的声音</h2>
                <form id="post-form" class="space-y-6">
                    <div>
                        <select id="post-section" class="w-full bg-purple-50 border-none p-4 rounded-xl text-purple-900 font-bold outline-none">
                            <option value="原创文章">Original 原创文章</option>
                            <option value="转载图文">Curated 转载图文</option>
                            <option value="史书记载">Her-History 史书记载</option>
                            <option value="辟谣专区">Fact-Check 辟谣专区</option>
                            <option value="树洞与求助">Sanctuary 树洞与求助</option>
                        </select>
                    </div>
                    <div>
                        <input type="text" id="post-title" required placeholder="输入标题 Title..." class="w-full border-b border-gray-200 py-3 text-xl font-bold outline-none">
                    </div>
                    
                    <!-- 【新增】出处输入框，默认隐藏 -->
                    <div id="source-container" class="hidden">
                        <input type="text" id="post-source" placeholder="出处：没有或不知道可忽略不填" class="w-full border-b border-gray-100 py-2 text-sm text-gray-500 placeholder-gray-300 outline-none">
                    </div>
                    
                    <div class="relative">
                        <input type="file" id="image-upload-input" accept="image/*" class="hidden">
                        <button type="button" id="btn-upload-image" class="absolute right-3 top-3 text-purple-400 hover:text-purple-700 transition-colors bg-white p-1 rounded shadow-sm border border-purple-50 flex items-center space-x-1 z-10" title="插入图片">
                            <i data-lucide="image" class="w-4 h-4"></i>
                            <span class="text-[10px] font-bold">插图</span>
                        </button>
                        <textarea id="post-content" required rows="8" placeholder="写下你想说的话... (光标停在哪里，图片就会插在哪里)" class="w-full bg-gray-50 rounded-xl p-4 pt-10 resize-none outline-none"></textarea>
                    </div>
                    
                    <div class="p-4 bg-purple-50/50 rounded-xl space-y-4 border border-purple-100">
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" id="post-anonymous" class="rounded text-purple-600 focus:ring-purple-500">
                            <span class="text-sm font-bold text-purple-900">匿名发布</span>
                            <span class="text-[10px] text-gray-500">（作者将显示为“Woman”）</span>
                        </label>
                        
                        <div id="burn-settings" class="hidden flex-col space-y-2 pt-2 border-t border-purple-100">
                            <span class="text-xs font-bold text-red-500">树洞专属：阅后即焚设置</span>
                            <div class="flex space-x-4">
                                <label class="flex items-center text-sm"><input type="radio" name="burn" value="none" checked class="mr-1"> 不焚毁</label>
                                <label class="flex items-center text-sm"><input type="radio" name="burn" value="hours" class="mr-1"> 24h后焚毁</label>
                                <label class="flex items-center text-sm"><input type="radio" name="burn" value="views" class="mr-1"> 308次浏览后焚毁</label>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-4">
                        <button type="button" id="close-post" class="px-6 py-3 rounded-full text-gray-400 font-bold hover:bg-gray-50">取消</button>
                        <button type="submit" id="submit-post" class="bg-purple-900 text-white px-8 py-3 rounded-full font-bold">发布 PUBLISH</button>
                    </div>
                </form>
            </div>
        `;
    root.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    const sectionSelect = modal.querySelector("#post-section");
    const burnSettings = modal.querySelector("#burn-settings");
    const sourceContainer = modal.querySelector("#source-container"); // 【新增】获取出处容器
    const sourceSections = ["转载图文", "史书记载", "辟谣专区"]; // 【新增】需要显示出处的板块

    const validSections = [
      "原创文章",
      "转载图文",
      "史书记载",
      "辟谣专区",
      "树洞与求助",
    ];

    // 初始化时判断是否需要显示出处或树洞设置
    if (validSections.includes(this.currentFilter)) {
      // 【新增】如果当前在树洞板块，但用户是男性，发帖时强制切回原创（虽然按理说他进不来，双重保险）
      if (
        this.currentFilter === "树洞与求助" &&
        this.currentUser.gender === "男"
      ) {
        sectionSelect.value = "原创文章";
      } else {
        sectionSelect.value = this.currentFilter;
      }

      if (sectionSelect.value === "树洞与求助") {
        burnSettings.classList.remove("hidden");
        burnSettings.classList.add("flex");
      }
      if (sourceSections.includes(sectionSelect.value)) {
        sourceContainer.classList.remove("hidden");
      }
    }

    // 切换板块时触发的逻辑
    sectionSelect.onchange = (e) => {
      const selectedValue = e.target.value;

      // 【新增】拦截男用户在下拉菜单里选择树洞
      if (selectedValue === "树洞与求助" && this.currentUser.gender === "男") {
        alert("抱歉，树洞为女性专属安全区，男性用户无法进入及发布。");
        sectionSelect.value = "原创文章"; // 强制切回原创
        burnSettings.classList.add("hidden");
        burnSettings.classList.remove("flex");
        sourceContainer.classList.add("hidden");
        modal.querySelector("#post-source").value = "";
        return;
      }

      // 处理树洞显示
      if (selectedValue === "树洞与求助") {
        burnSettings.classList.remove("hidden");
        burnSettings.classList.add("flex");
      } else {
        burnSettings.classList.add("hidden");
        burnSettings.classList.remove("flex");
      }

      // 【新增】处理出处输入框显示
      if (sourceSections.includes(selectedValue)) {
        sourceContainer.classList.remove("hidden");
      } else {
        sourceContainer.classList.add("hidden");
        modal.querySelector("#post-source").value = ""; // 切换到别的区时清空出处
      }
    };

    const uploadBtn = modal.querySelector("#btn-upload-image");
    const fileInput = modal.querySelector("#image-upload-input");
    const contentArea = modal.querySelector("#post-content");

    if (uploadBtn && fileInput && contentArea) {
      uploadBtn.onclick = () => fileInput.click();
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const originalHtml = uploadBtn.innerHTML;
        uploadBtn.innerHTML = `<span class="text-[10px] font-bold text-purple-600">上传中...</span>`;
        uploadBtn.disabled = true;
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;
          const { error } = await supabase.storage
            .from("images")
            .upload(fileName, file);
          if (error) throw error;
          const {
            data: { publicUrl },
          } = supabase.storage.from("images").getPublicUrl(fileName);
          const cursorPosition = contentArea.selectionStart;
          const textBefore = contentArea.value.substring(0, cursorPosition);
          const textAfter = contentArea.value.substring(cursorPosition);
          contentArea.value =
            textBefore +
            `\n<img src="${publicUrl}" style="max-width: 100%; border-radius: 8px; margin: 12px 0; border: 1px solid #f3e5f5;" />\n` +
            textAfter;
        } catch (err) {
          alert("上传失败：" + err.message);
        } finally {
          uploadBtn.innerHTML = originalHtml;
          uploadBtn.disabled = false;
          fileInput.value = "";
        }
      };
    }

    modal.querySelector("#close-post").onclick = () => root.removeChild(modal);

    modal.querySelector("#post-form").onsubmit = async (e) => {
      if (this.isBanned()) return;
      e.preventDefault();
      const section = sectionSelect.value;

      if (section === "树洞与求助" && this.currentUser.gender !== "女") {
        return alert("抱歉，树洞专区仅限女性用户发布。");
      }

      const btn = modal.querySelector("#submit-post");
      btn.innerText = "发布中...";
      btn.disabled = true;

      const isAnonymous = modal.querySelector("#post-anonymous").checked;
      const burnChoice = modal.querySelector(
        'input[name="burn"]:checked'
      ).value;

      let burnHours = null;
      let burnViews = null;
      if (section === "树洞与求助") {
        if (burnChoice === "hours") burnHours = 24;
        if (burnChoice === "views") burnViews = 308;
      }

      let finalTitle = modal.querySelector("#post-title").value;
      if (isAnonymous) finalTitle = `[匿名] ` + finalTitle;

      // 【新增】获取填写的出处
      const sourceValue = modal.querySelector("#post-source").value.trim();

      const { error } = await supabase.from("contents").insert([
        {
          user_id: this.currentUser.id,
          section: section,
          title: finalTitle,
          content: contentArea.value,
          burn_after_hours: burnHours,
          burn_after_views: burnViews,
          source: sourceValue, // 【新增】将出处存入数据库
        },
      ]);

      if (error) {
        alert("发布失败: " + error.message);
        btn.innerText = "发布 PUBLISH";
        btn.disabled = false;
      } else {
        root.removeChild(modal);
        await this.loadPosts();
        this.renderFeed(
          document.querySelector(".nav-sort.active")?.dataset.sort || "latest"
        );
      }
    };
  }

  renderFeed(sortBy) {
    const feed = document.getElementById("post-feed");
    if (!feed) return;

    // 【新增】如果是树洞，禁止文字选中和防截图样式生效
    if (this.currentFilter === "树洞与求助") {
      document.body.classList.add("sanctuary-mode");
    } else {
      document.body.classList.remove("sanctuary-mode");
    }

    if (!this.currentUser) {
      const QUOTES = [
        "女人要有一间属于自己的小屋，一笔属于自己的薪金，才能真正拥有创作的自由。——伍尔夫",
        "玫瑰不必长成松柏，女性生来就是千面模样。",
        "不必匆忙，不必火花四溅，不必成为别人，只需做自己。——伍尔夫",
        "你的价值不取决于别人的看法。",
        "我值得一个美好的春天，我不亏欠任何人。——伍尔夫",
        "每次一个女性为自己站出来，她就是在为所有女性发声。",
        "独立而自由的灵魂，才是幸福之源。",
        "她没在等骑士，她在寻一把利剑。",
        "女性主义教会我重要的两件事：首先，要接受自己很多问题不是自己的错，而是很多人共同面临的困境。其次，不要加盟对手去进一步伤害自己。——戴锦华",
        "祝你强壮，祝你自由，祝你铮铮，祝你昂扬，祝你扎根大地，挺直脊梁。",
        "你可以用言语射杀我，你可以用目光切割我，你可以用仇恨扼杀我，但我仍将如空气，升腾而起。——玛雅·安吉洛《我仍将奋起》",
        "我生来就是高山而非溪流，我欲于群峰之巅俯视平庸的沟壑。我生来就是人杰而非草芥，我站在伟人之肩藐视卑微的懦夫。——张桂梅",
        "一个能够升起月亮的身体，必然驮住了无数次日落。——余秀华《荒漠》",
      ];

      const mainQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      const shuffled = [...QUOTES].sort(() => 0.5 - Math.random());
      const bgQuotes = shuffled.slice(0, 4);

      feed.className =
        "flex flex-col items-center justify-center min-h-[75vh] relative w-full col-span-full mt-4";
      feed.innerHTML = `
            <div class="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
                <div class="absolute top-10 left-5 text-lg md:text-xl text-purple-300/30 font-serif transform -rotate-12 whitespace-nowrap">${bgQuotes[0]}</div>
                <div class="absolute top-1/4 right-0 text-xl md:text-2xl text-purple-300/30 font-serif transform rotate-6 whitespace-nowrap">${bgQuotes[1]}</div>
                <div class="absolute bottom-20 left-10 text-xl md:text-2xl text-purple-300/40 font-serif transform -rotate-6 whitespace-nowrap">${bgQuotes[2]}</div>
                <div class="absolute top-2/3 right-1/4 text-lg md:text-xl text-purple-300/30 font-serif transform rotate-12 whitespace-nowrap">${bgQuotes[3]}</div>
            </div>
            <div class="relative z-10 flex flex-col items-center animate-in zoom-in duration-1000 mt-4 w-full px-4">
                <div class="mb-10 text-xl md:text-2xl text-purple-900 font-bold text-center tracking-widest max-w-4xl leading-loose drop-shadow-sm font-serif">
                    “${mainQuote}”
                </div>
                <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-2xl">
                  <defs>
                    <path id="topCurveBig" d="M 30,100 A 70,70 0 0,1 170,100" fill="transparent" />
                    <path id="bottomCurveBig" d="M 30,100 A 70,70 0 0,0 170,100" fill="transparent" />
                  </defs>
                  <circle cx="100" cy="100" r="90" fill="#fcfaff" stroke="#8e44ad" stroke-width="4"/>
                  <path d="M100 45 L120 85 L100 115 L80 85 Z" fill="none" stroke="#8e44ad" stroke-width="5" stroke-linejoin="round"/>
                  <line x1="100" y1="75" x2="100" y2="115" stroke="#8e44ad" stroke-width="4"/>
                  <line x1="100" y1="115" x2="100" y2="150" stroke="#8e44ad" stroke-width="5" stroke-linecap="round"/>
                  <line x1="85" y1="135" x2="115" y2="135" stroke="#8e44ad" stroke-width="5" stroke-linecap="round"/>
                  <text font-family="'Noto Serif SC', serif" font-size="16" fill="#c0a0d0" letter-spacing="3">
                    <textPath href="#topCurveBig" startOffset="50%" text-anchor="middle">她在寻一把利剑</textPath>
                  </text>
                  <text font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#2c003e" letter-spacing="5">
                    <textPath href="#bottomCurveBig" startOffset="50%" text-anchor="middle">HERSTORY</textPath>
                  </text>
                </svg>
                <h2 class="mt-8 text-3xl font-bold text-purple-900 tracking-widest text-center">欢迎来到 HERSTORY</h2>
                <p class="mt-4 text-purple-500 tracking-widest text-sm text-center">在阅读姐妹们的声音前，请先建立您的专属身份。</p>
                <button id="hero-join" class="mt-10 bg-purple-900 text-white px-12 py-4 rounded-full font-bold tracking-widest shadow-[0_10px_30px_rgba(142,68,173,0.3)] hover:bg-purple-800 transition-all hover:scale-105 active:scale-95">Join Herstory</button>
            </div>
        `;
      setTimeout(() => {
        const heroBtn = document.getElementById("hero-join");
        if (heroBtn) {
          heroBtn.onclick = () => {
            this.showLegalModal(() => {
              AuthModal(supabase, () => window.location.reload()).show();
            });
          };
        }
      }, 0);
      return;
    }

    feed.className =
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20";

    // 【修复】：无论什么情况下，最新/最热只是排序方式。
    // 如果你在某个分类下（比如原创），就只显示该分类的帖子。
    // 如果你没有点任何分类（即主页默认），就显示所有帖子。
    let filteredPosts = this.posts;

    // 如果当前选中的不是默认值，就按分类过滤
    if (
      this.currentFilter &&
      this.currentFilter !== "latest" &&
      this.currentFilter !== "hottest"
    ) {
      filteredPosts = this.posts.filter(
        (p) => p.category === this.currentFilter
      );
    }

    // 【新增】先审后发：审核状态过滤逻辑
    filteredPosts = filteredPosts.filter((p) => {
      const isAuthor = this.currentUser && this.currentUser.id === p.author.id;
      const isAdmin = this.currentUser && this.currentUser.is_admin;
      const isApproved = p.audit_status === "approved" || !p.audit_status;
      return isApproved || isAuthor || isAdmin;
    });

    // 【修改】增强的搜索功能
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter((p) => {
        const isAnonymous = p.title && p.title.startsWith("[匿名]");
        return (
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          (p.id && p.id.toLowerCase().includes(q)) ||
          (!isAnonymous &&
            p.author &&
            p.author.name &&
            p.author.name.toLowerCase().includes(q))
        );
      });
    }

    let sortedPosts = [...filteredPosts];

    // 【修复】处理排序逻辑（去掉重复多余的判断）
    if (sortBy === "hottest") {
      sortedPosts.sort((a, b) => b.likes - a.likes);
    }

    if (sortedPosts.length === 0) {
      feed.innerHTML = `<div class="col-span-full py-20 text-center text-gray-400 italic tracking-widest">该板块暂无内容或处于待审核状态。</div>`;
      return;
    }

    feed.innerHTML = sortedPosts
      .map((post) => PostCard(post, this.currentUser || {}))
      .join("");
    if (window.lucide) window.lucide.createIcons();

    const ACTION_MAP = {
      pen: "递笔",
      hug: "抱抱",
      remember: "铭记",
      sword: "拔剑",
    };

    sortedPosts.forEach((post) => {
      const card = document.querySelector(`article[data-post-id="${post.id}"]`);
      if (card) {
        card.onclick = (e) => {
          if (
            e.target.closest("button") ||
            e.target.closest(".emotion-trigger") ||
            e.target.closest(".dislike-trigger")
          )
            return;
          this.showPostDetail(post);
        };
      }

      const el = document.getElementById(`emotion-${post.id}`);
      if (el) {
        EmotionButton.init(el, post, async (action) => {
          if (this.isBanned()) return;
          if (!this.currentUser) return alert("请先登录才能共鸣。");
          const dbAction = ACTION_MAP[action] || "点赞";
          const weights = this.getInteractionWeights();

          const { data: existing } = await supabase
            .from("interactions")
            .select("*")
            .eq("user_id", this.currentUser.id)
            .eq("content_id", post.id)
            .eq("interaction_type", dbAction)
            .single();

          if (existing) {
            await supabase.from("interactions").delete().eq("id", existing.id);
            post.likes = Math.max(0, post.likes - (existing.weight || 1));
            el.querySelector("span").innerText = post.likes;
            await supabase
              .from("contents")
              .update({ like_count: post.likes })
              .eq("id", post.id);
            el.classList.remove("text-purple-600");
          } else {
            await supabase.from("interactions").insert([
              {
                user_id: this.currentUser.id,
                content_id: post.id,
                interaction_type: dbAction,
                weight: weights.like,
              },
            ]);
            post.likes += weights.like;
            el.querySelector("span").innerText = post.likes;
            await supabase
              .from("contents")
              .update({ like_count: post.likes })
              .eq("id", post.id);
            el.classList.add("text-purple-600");
          }
        });
      }

      const dislikeEl = document.getElementById(`dislike-${post.id}`);
      if (dislikeEl) {
        dislikeEl.onclick = async (e) => {
          e.stopPropagation();
          if (this.isBanned()) return;
          if (!this.currentUser) return alert("请先登录才能踩。");
          const weights = this.getInteractionWeights();

          const { data: existing } = await supabase
            .from("interactions")
            .select("*")
            .eq("user_id", this.currentUser.id)
            .eq("content_id", post.id)
            .eq("interaction_type", "踩")
            .single();

          if (existing) {
            await supabase.from("interactions").delete().eq("id", existing.id);
            post.dislikes = Math.max(
              0,
              (post.dislikes || 0) - (existing.weight || 1)
            );
            dislikeEl.querySelector("span").innerText = post.dislikes;
            await supabase
              .from("contents")
              .update({ dislike_count: post.dislikes })
              .eq("id", post.id);
            dislikeEl.classList.remove("text-red-500");
          } else {
            await supabase.from("interactions").insert([
              {
                user_id: this.currentUser.id,
                content_id: post.id,
                interaction_type: "踩",
                weight: weights.dislike,
              },
            ]);
            post.dislikes = (post.dislikes || 0) + weights.dislike;
            dislikeEl.querySelector("span").innerText = post.dislikes;
            await supabase
              .from("contents")
              .update({ dislike_count: post.dislikes })
              .eq("id", post.id);
            dislikeEl.classList.add("text-red-500");
          }
        };
      }
    });

    // 【修复】完整的 gsap 动画闭合并结束 renderFeed 方法
    if (window.gsap) {
      gsap.fromTo(
        "#post-feed article",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: "expo.out",
          clearProps: "all",
        }
      );
    }
  } // <-- 【关键】：结束 renderFeed 方法的括号

  // 【新增】法律与隐私政策弹窗
  showLegalModal(onAgreeCallback) {
    const root = document.getElementById("modal-root");
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6";

    modal.innerHTML = `
    <div class="absolute inset-0 bg-[#2c003e]/80 backdrop-blur-md"></div>
    <div class="relative bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in duration-300">
        <button id="close-legal" class="absolute top-6 right-6 text-gray-400 hover:text-purple-600 transition-colors">
            <i data-lucide="x" class="w-6 h-6"></i>
        </button>
        <h3 class="text-2xl font-bold text-purple-900 mb-6 text-center tracking-widest font-serif">用户协议与隐私政策</h3>
        
        <div class="overflow-y-auto custom-scrollbar pr-4 space-y-6 text-sm text-gray-700 leading-relaxed mb-6">
            <!-- 1. 用户协议 -->
            <section>
                <h4 class="text-purple-900 font-bold border-b border-purple-50 pb-1 mb-2">一、用户行为规范与协议</h4>
                <p>1. 本《用户协议》是你与 HERSTORY之间关于使用平台服务所订立的契约。你通过注册、登录、发布内容、使用平台功能等方式使用本平台服务，即视为你已阅读、理解并同意本协议所有条款；</p>
                <p>2. 不得利用本站从事任何违法犯罪活动（包括但不限于涉及仇恨对立言论、歧视性内容；泄露他人隐私、个人信息；含有暴力、色情、恐怖主义等违背公序良俗的活动）；</p>
                <p>3. 【违规处置】帖子被举报将进入待审核状态，被10个及以上用户举报将直接删除。管理员有权对违规内容进行修改、删除。</p>
            </section>

            <!-- 2. 隐私政策 -->
            <section>
                <h4 class="text-purple-900 font-bold border-b border-purple-100 pb-1 mb-2">二、隐私政策与数据安全</h4>
                <p>本网站通过 <strong>Supabase</strong> 数据库收集注册的必要信息，未接入任何第三方统计工具。</p>
                <ul class="list-disc ml-5 space-y-1">
                    <li>收集范围：用户邮箱、性别信息、发布内容及举报记录；</li>
                    <li>用途：仅用于网站基本功能实现与内容合规审核，不用于商业推广或第三方共享；</li>
                    <li>存储安全：数据存储于 Supabase 境外服务器，已开启传输加密与存储加密，严格限制访问权限。</li>
                </ul>
            </section>

            <!-- 3. 知识产权 -->
            <section>
                <h4 class="text-purple-900 font-bold border-b border-purple-100 pb-1 mb-2">三、知识产权声明</h4>
                <p>1. <strong>原创内容：</strong>用户保留完整著作权，并授予平台非独家、免费、全球范围内的展示与存储权，平台不用于商业盈利；</p>
                <p>2. <strong>转载内容：</strong>用户发布转载内容时需获得原作者授权。若发生侵权，平台不承担侵权责任并保留删除权力，侵权责任由发布用户自行承担。</p>
            </section>

            <!-- 4. 境外服务声明 -->
            <section class="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p class="text-[12px] text-purple-800">
                    <i data-lucide="shield-alert" class="inline-block w-3 h-3 mr-1"></i>
                    <strong>特别提醒：</strong>本网站当前部署于境外 Netlify ，仅面向境外用户提供服务。中国境内用户请谨慎访问并严格遵守当地法律法规。
                </p>
            </section>
        </div>
        
        <div class="flex justify-between items-center border-t border-purple-100 pt-6">
            <button id="legal-decline" class="text-gray-400 font-bold hover:text-gray-600 text-sm transition-colors">拒绝并离开</button>
            <div class="flex space-x-3">
                <button id="legal-agree" class="bg-purple-900 text-white px-10 py-3 rounded-full font-bold tracking-widest hover:bg-purple-800 transition-all shadow-lg hover:shadow-purple-900/30">
                    同意并继续 AGREE
                </button>
            </div>
        </div>
    </div>
  `;

    root.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    const cleanup = () => root.removeChild(modal);

    // 逻辑处理
    modal.querySelector("#close-legal").onclick = cleanup;
    modal.querySelector("#legal-decline").onclick = () => {
      cleanup();
      window.location.href = "https://www.google.com"; // 拒绝后跳转到中立页面
    };

    modal.querySelector("#legal-agree").onclick = () => {
      cleanup();
      if (onAgreeCallback) onAgreeCallback();
    };
  }
} // <-- 【极其关键】：这是整个 App 类的结束括号！

// 【极其关键】：程序的启动入口，没有这句网站就是一片空白
window.addEventListener("DOMContentLoaded", () => new App());
