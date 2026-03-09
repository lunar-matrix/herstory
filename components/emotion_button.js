export const EmotionButton = {
  init(element, post, onAction) {
    let clickTimer = null;

    const showMenu = (e) => {
      // 根据板块动态判定弹出的情绪按钮
      const isHistoryOrShame = ["史书记载", "耻辱柱"].includes(post.category);
      const options = isHistoryOrShame
        ? [
            { id: "remember", label: "铭记", icon: "bookmark" },
            { id: "sword", label: "拔剑", icon: "swords" },
          ]
        : [
            { id: "pen", label: "递笔", icon: "pen-tool" },
            { id: "hug", label: "抱抱", icon: "heart" },
          ];

      const menu = document.createElement("div");
      // 高级悬浮菜单样式
      menu.className =
        "absolute z-[100] flex space-x-2 bg-white/95 backdrop-blur-xl border border-purple-100 p-2 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200 emotion-menu";

      // 定位在按钮正上方
      menu.style.bottom = `100%`;
      menu.style.left = `50%`;
      menu.style.transform = `translateX(-50%)`;
      menu.style.marginBottom = `10px`;

      menu.innerHTML = options
        .map(
          (opt) => `
                <button data-id="${opt.id}" class="flex flex-col items-center p-2 hover:bg-purple-50 rounded-xl transition-all active:scale-90 min-w-[48px]">
                    <i data-lucide="${opt.icon}" class="w-4 h-4 text-purple-600 mb-1"></i>
                    <span class="text-[10px] font-bold text-purple-900">${opt.label}</span>
                </button>
            `
        )
        .join("");

      // 清理可能存在的旧菜单
      document.querySelectorAll(".emotion-menu").forEach((m) => m.remove());

      element.style.position = "relative";
      element.appendChild(menu);
      if (window.lucide) window.lucide.createIcons();

      const closeMenu = (event) => {
        if (!menu.contains(event.target)) {
          menu.remove();
          document.removeEventListener("mousedown", closeMenu);
        }
      };

      // 绑定选项点击事件
      menu.querySelectorAll("button").forEach((btn) => {
        btn.onclick = (event) => {
          event.stopPropagation();
          onAction(btn.dataset.id);
          menu.remove();
        };
      });

      setTimeout(() => document.addEventListener("mousedown", closeMenu), 10);
    };

    // 绑定双击事件：弹出特殊互动
    element.ondblclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(clickTimer); // 取消单击判定
      showMenu(e);
    };

    // 绑定单击事件：普通点赞
    element.onclick = (e) => {
      e.preventDefault();
      // 如果点在菜单里面，不要触发单击
      if (e.target.closest(".emotion-menu")) return;

      if (e.detail === 1) {
        clickTimer = setTimeout(() => {
          onAction("like");
        }, 250); // 延迟250毫秒，用来等待区分是不是双击
      }
    };
  },
};
