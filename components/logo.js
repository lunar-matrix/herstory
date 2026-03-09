export const Logo = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <svg width="56" height="56" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
      <defs>
        <!-- 上半圆路径 -->
        <path id="topCurve" d="M 30,100 A 70,70 0 0,1 170,100" fill="transparent" />
        <!-- 下半圆路径 (从左往右画，保证文字正向) -->
        <path id="bottomCurve" d="M 30,100 A 70,70 0 0,0 170,100" fill="transparent" />
      </defs>
      <!-- 背景与外圈 -->
      <circle cx="100" cy="100" r="90" fill="#fcfaff" stroke="#8e44ad" stroke-width="4"/>
      <!-- 维纳斯利剑/钢笔 -->
      <path d="M100 45 L120 85 L100 115 L80 85 Z" fill="none" stroke="#8e44ad" stroke-width="5" stroke-linejoin="round"/>
      <line x1="100" y1="75" x2="100" y2="115" stroke="#8e44ad" stroke-width="4"/>
      <line x1="100" y1="115" x2="100" y2="150" stroke="#8e44ad" stroke-width="5" stroke-linecap="round"/>
      <line x1="85" y1="135" x2="115" y2="135" stroke="#8e44ad" stroke-width="5" stroke-linecap="round"/>
      <!-- 环绕文字 -->
      <text font-family="'Noto Serif SC', serif" font-size="16" fill="#c0a0d0" letter-spacing="3">
        <textPath href="#topCurve" startOffset="50%" text-anchor="middle">她在寻一把利剑</textPath>
      </text>
      <text font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#2c003e" letter-spacing="5">
        <textPath href="#bottomCurve" startOffset="50%" text-anchor="middle">HERSTORY</textPath>
      </text>
    </svg>
    <div class="ml-3 flex flex-col justify-center hidden sm:flex">
        <span class="font-bold text-xl tracking-widest text-[#2c003e]">HERSTORY</span>
        <span class="text-[10px] text-purple-400 tracking-widest">她的故事，由她书写</span>
    </div>
    `;
  container.classList.add("flex", "items-center", "select-none");
};
