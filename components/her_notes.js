export const HerNotes = {
  open(post, currentUser, onSave) {
    const modalRoot = document.getElementById("modal-root");
    const canEdit = currentUser.credit > post.author.credit;

    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-[110] bg-white/95 backdrop-blur-xl flex items-center justify-center p-8";

    const content = `
            <div class="max-w-4xl w-full h-[80vh] flex flex-col">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h2 class="text-3xl font-bold text-purple-900 mb-2">${
                          post.title
                        }</h2>
                        <p class="text-xs text-purple-400 tracking-widest uppercase">Her-Notes Wiki 共创模式</p>
                    </div>
                    <button id="close-wiki" class="p-2 hover:bg-purple-50 rounded-full transition-colors">
                        <i data-lucide="x" class="w-6 h-6 text-purple-900"></i>
                    </button>
                </div>

                <div class="flex-grow overflow-y-auto mb-8 bg-white border border-purple-100 rounded-3xl p-8 shadow-sm">
                    ${
                      canEdit
                        ? `
                        <textarea id="wiki-editor" class="w-full h-full prose-content focus:outline-none resize-none text-lg leading-relaxed text-gray-700 bg-transparent">
                            ${this.renderWithHighlights(post)}
                        </textarea>
                    `
                        : `
                        <div class="prose-content text-lg leading-relaxed text-gray-700">
                            ${this.renderWithHighlights(post, true)}
                        </div>
                        <div class="mt-4 p-4 bg-purple-50 rounded-xl text-xs text-purple-600 flex items-center">
                            <i data-lucide="shield-alert" class="w-4 h-4 mr-2"></i>
                            信用分不足（当前: ${currentUser.credit} / 需要 > ${
                            post.author.credit
                          }），暂无修改权限。
                        </div>
                    `
                    }
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex -space-x-2">
                        ${post.edits
                          .map(
                            (edit) => `
                            <div class="w-10 h-10 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700" title="贡献者: ${
                              edit.userName
                            }">
                                ${edit.userName.slice(0, 1)}
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                    ${
                      canEdit
                        ? `
                        <button id="save-wiki" class="bg-purple-900 text-white px-10 py-4 rounded-full font-bold hover:bg-purple-800 transition-all transform hover:scale-105 shadow-xl">
                            保存修改 SAVE CHANGES
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `;

    overlay.innerHTML = content;
    modalRoot.appendChild(overlay);
    lucide.createIcons();

    document.getElementById("close-wiki").onclick = () => overlay.remove();

    const editor = document.getElementById("wiki-editor");
    if (editor) {
      document.getElementById("save-wiki").onclick = () => {
        const newText = editor.value.trim();
        const updatedPost = {
          ...post,
          excerpt: newText,
          edits: [
            ...post.edits,
            {
              id: Date.now(),
              userId: currentUser.id,
              userName: currentUser.name,
              timestamp: new Date().toISOString(),
              original: post.excerpt,
            },
          ],
        };
        onSave(updatedPost);
        overlay.remove();
      };
    }

    overlay.addEventListener("click", (e) => {
      const highlight = e.target.closest(".wiki-highlight");
      if (highlight) {
        this.showTrace(highlight.dataset.original, highlight.dataset.author, e);
      }
    });
  },

  renderWithHighlights(post, clickable = false) {
    if (post.edits.length === 0) return post.excerpt;

    const lastEdit = post.edits[post.edits.length - 1];
    return `<span class="wiki-highlight cursor-help" 
                      data-original="${lastEdit.original}" 
                      data-author="${lastEdit.userName}">
                 ${post.excerpt}
                </span>`;
  },

  showTrace(originalText, authorName, event) {
    const popup = document.createElement("div");
    popup.className =
      "fixed z-[120] bg-white shadow-2xl border border-purple-100 p-4 rounded-2xl max-w-xs animate-in fade-in zoom-in duration-200";
    popup.style.left = `${event.clientX}px`;
    popup.style.top = `${event.clientY + 20}px`;

    popup.innerHTML = `
            <div class="flex items-center space-x-2 mb-3">
                <div class="w-6 h-6 rounded-full bg-purple-900 flex items-center justify-center text-[8px] text-white">${
                  authorName[0]
                }</div>
                <span class="text-[10px] font-bold text-purple-900">${authorName} 修改了此处</span>
            </div>
            <div class="text-[11px] text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-purple-200 italic">
                “${originalText.slice(0, 100)}...”
            </div>
            <div class="mt-3 flex justify-end">
                <button class="text-[9px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded downvote-edit">
                    踩 (扣除该用户10分)
                </button>
            </div>
        `;

    document.body.appendChild(popup);

    const close = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener("mousedown", close);
      }
    };
    document.addEventListener("mousedown", close);

    popup.querySelector(".downvote-edit").onclick = () => {
      alert(`已反馈恶意修改。修改者 ${authorName} 信用分 -10`);
      popup.remove();
    };
  },
};
