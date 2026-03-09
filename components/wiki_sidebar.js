export const WikiSidebar = {
  open(post, currentUser, onAction) {
    const modalRoot = document.getElementById("modal-root");
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-[110] bg-purple-950/20 backdrop-blur-sm flex justify-end";

    const isAuthor = post.author.id === currentUser.id;
    const currentVotes = post.votes || {
      original: 0,
      modification: 0,
      participants: [],
    };

    overlay.innerHTML = `
            <div class="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div class="p-8 border-b border-purple-50 flex items-center justify-between">
                    <h3 class="font-bold text-xl text-purple-900">冲突裁定 Conflict</h3>
                    <button id="close-sidebar" class="text-gray-400 hover:text-purple-600"><i data-lucide="x"></i></button>
                </div>

                <div class="flex-grow overflow-y-auto p-8">
                    <div class="mb-8">
                        <label class="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-4 block">社区投票保留版本</label>
                        <div class="space-y-4">
                            <!-- Option 1 -->
                            <div class="vote-option group cursor-pointer border-2 border-purple-50 rounded-2xl p-4 hover:border-purple-200 transition-all" data-target="original">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-bold text-gray-800">保留初始版本 (由 ${
                                      post.author.name
                                    } 发布)</span>
                                    <span class="text-xs text-purple-600">${
                                      currentVotes.original
                                    } 票</span>
                                </div>
                                <div class="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div class="h-full bg-purple-600 transition-all duration-1000" style="width: ${this.getPercent(
                                      currentVotes.original,
                                      currentVotes.modification
                                    )}%"></div>
                                </div>
                            </div>
                            
                            <!-- Option 2 -->
                            <div class="vote-option group cursor-pointer border-2 border-purple-50 rounded-2xl p-4 hover:border-purple-200 transition-all" data-target="modification">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-bold text-gray-800">保留当前修改版 (Wiki 共创)</span>
                                    <span class="text-xs text-purple-600">${
                                      currentVotes.modification
                                    } 票</span>
                                </div>
                                <div class="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div class="h-full bg-purple-400 transition-all duration-1000" style="width: ${this.getPercent(
                                      currentVotes.modification,
                                      currentVotes.original
                                    )}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="p-6 bg-purple-50 rounded-3xl">
                        <p class="text-[11px] leading-relaxed text-purple-800">
                            <strong>规则：</strong> 原作者拥有“驳回权”触发投票。信用分达标的社区成员可参与投票。票数领先者将成为最终正本。
                        </p>
                    </div>
                </div>

                ${
                  isAuthor
                    ? `
                <div class="p-8 border-t border-purple-50">
                    <button id="resolve-vote" class="w-full bg-purple-900 text-white py-4 rounded-full font-bold text-sm tracking-widest disabled:opacity-50">
                        采纳投票结果并关闭争议
                    </button>
                </div>
                `
                    : ""
                }
            </div>
        `;

    modalRoot.appendChild(overlay);
    lucide.createIcons();

    document.getElementById("close-sidebar").onclick = () => overlay.remove();
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    overlay.querySelectorAll(".vote-option").forEach((opt) => {
      opt.onclick = () => {
        const target = opt.dataset.target;
        currentVotes[target]++;
        onAction("vote", currentVotes);
        overlay.remove();
      };
    });

    if (isAuthor) {
      document.getElementById("resolve-vote").onclick = () => {
        const finalContent =
          currentVotes.original >= currentVotes.modification
            ? post.edits[0]?.original || post.excerpt
            : post.excerpt;
        onAction("resolve", { content: finalContent });
        overlay.remove();
      };
    }
  },

  getPercent(val, other) {
    const total = val + other;
    if (total === 0) return 0;
    return (val / total) * 100;
  },
};
