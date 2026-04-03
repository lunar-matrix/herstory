export const PostCard = (post, currentUser = {}) => {
  const score = post.likes || 0;
  let status = "Spark";
  if (score > 500) status = "Galaxy";
  else if (score > 100) status = "Torch";

  const statusClass = `tag-${status.toLowerCase()}`;
  const isWikiSection = ["史书记载", "辟谣专区", "转载图文"].includes(
    post.category
  );

  // 【需求5】格式化发布时间
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return d.toLocaleDateString("zh-CN");
  };
  const timeText = formatTime(post.created_at);

  // 处理头像里的文字：如果是男用户，固定显示“男”，否则按等级显示汉字
  const levelMap = ["女", "妇", "媛", "娇", "嫖", "妒", "汝", "好"];
  const authorTitle =
    post.author.gender === "男"
      ? "男"
      : levelMap[Math.min(post.author.level - 1, 7)];

  let burnLabel = "";
  if (post.burn_after_hours) burnLabel = `${post.burn_after_hours}h 后焚毁`;
  else if (post.burn_after_views)
    burnLabel = `${post.burn_after_views} 次浏览后焚毁`;

  return `
      <article class="bg-white border border-purple-50 rounded-2xl p-6 hover:shadow-[0_20px_60px_rgba(44,0,62,0.06)] transition-all group flex flex-col h-full relative overflow-hidden cursor-pointer" data-post-id="${
        post.id
      }">
          <div class="flex items-center justify-between mb-4 relative z-10">
              <div class="flex items-center space-x-2">
                  <span class="status-tag ${statusClass}">${status}</span>
                  ${
                    burnLabel
                      ? `<span class="burn-tag flex items-center px-2 py-0.5 bg-purple-900 text-purple-100 text-[9px] font-bold rounded uppercase"><i data-lucide="flame" class="w-2 h-2 mr-1"></i>${burnLabel}</span>`
                      : ""
                  }
              </div>
              
              <!-- 【新增】右上角的审核状态标签 与 帖子 ID -->
              <div class="flex items-center space-x-2">
                  ${
                    post.audit_status === "pending"
                      ? '<span class="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded">待审核</span>'
                      : ""
                  }
                  ${
                    post.audit_status === "approved"
                      ? '<span class="text-[9px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded">已审核</span>'
                      : ""
                  }
                  ${
                    post.audit_status === "rejected"
                      ? '<span class="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded">未通过，请修改</span>'
                      : ""
                  }
                  <span class="text-[10px] text-gray-300 font-mono tracking-widest uppercase">ID.${post.id.slice(
                    0,
                    8
                  )}</span>
              </div>
          </div>
          
          <h3 class="text-xl font-bold mb-3 group-hover:text-purple-700 transition-colors line-clamp-2 leading-relaxed tracking-tight">
              ${post.title}
          </h3>
          
          <!-- 如果有出处，就显示紫色的出处文本 -->
          ${
            post.source
              ? `<div class="text-[12px] text-purple-600 mb-2 font-medium">出处：${post.source}</div>`
              : ""
          }
          
          <div class="text-sm text-gray-500 prose-content line-clamp-4 flex-grow mb-6 font-light overflow-hidden relative">
              ${post.excerpt.replace(
                /<img[^>]*>/g,
                '<span class="text-purple-400 text-xs">[图片]</span> '
              )}
          </div>
          
          <div class="flex items-center justify-between pt-6 border-t border-purple-50 mt-auto">
              <div class="flex items-center space-x-3">
                  <div class="relative">
                      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center text-[11px] font-black text-purple-800 border border-purple-200">
                          ${authorTitle}
                      </div>
                  </div>
                  <div class="flex flex-col">
                      <span class="text-xs font-bold text-gray-900 tracking-wide">${
                        post.author.name
                      }</span>
                      <span class="text-[10px] text-purple-300 font-medium italic">Level ${
                        post.author.level
                      } Architect</span>
                      ${timeText ? `<span class="text-[9px] text-gray-400 ml-1">${timeText}</span>` : ""}
                  </div>
              </div>
              
              <div class="flex items-center space-x-3 text-gray-400">
                  <div class="emotion-trigger flex items-center space-x-1.5 hover:text-purple-600 transition-colors select-none" id="emotion-${
                    post.id
                  }" data-id="${post.id}">
                      <i data-lucide="heart" class="w-4 h-4"></i>
                      <span class="text-[10px] font-black">${post.likes}</span>
                  </div>
                  
                  <div class="dislike-trigger flex items-center space-x-1.5 hover:text-gray-800 transition-colors select-none" id="dislike-${
                    post.id
                  }" data-id="${post.id}">
                      <i data-lucide="thumbs-down" class="w-4 h-4"></i>
                      <span class="text-[10px] font-black">${
                        post.dislikes || 0
                      }</span>
                  </div>
  
                  <div class="flex items-center space-x-1.5">
                      <i data-lucide="message-square" class="w-4 h-4"></i>
                      <span class="text-[10px] font-black">${
                        post.comments || 0
                      }</span>
                  </div>
              </div>
          </div>
      </article>
      `;
};
