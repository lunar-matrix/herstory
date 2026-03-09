export const MuyuButton = (post, onUpdate) => {
  let count = post.muyu_clicks || 0;
  const target = 308;

  const createUI = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
            <div class="flex flex-col items-center space-y-4 p-8 bg-white/40 backdrop-blur-sm rounded-3xl border border-purple-100 shadow-inner">
                <div class="text-center mb-2">
                    <h4 class="text-sm font-bold text-purple-900 mb-1">共鸣木鱼 Resonance</h4>
                    <p class="text-[10px] text-purple-400 italic">每一声清响，都是对受难者的回应</p>
                </div>
                
                <button id="muyu-hit" class="relative w-40 h-40 rounded-full bg-[#1a0025] flex items-center justify-center shadow-2xl active:scale-95 transition-transform overflow-visible group border-4 border-purple-900/30">
                    <div class="absolute inset-0 bg-purple-600/10 rounded-full animate-ping opacity-20"></div>
                    <span class="text-6xl filter drop-shadow-md select-none">🪘</span>
                    <div id="muyu-pop-container" class="absolute inset-0 pointer-events-none"></div>
                </button>

                <div class="text-center">
                    <div id="muyu-count" class="text-4xl font-serif font-black italic text-purple-900 tabular-nums">${count} / ${target}</div>
                    <div class="w-full bg-purple-100 h-1 mt-2 rounded-full overflow-hidden">
                        <div id="muyu-progress" class="bg-purple-600 h-full transition-all duration-300" style="width: ${
                          (count / target) * 100
                        }%"></div>
                    </div>
                </div>

                <div id="muyu-status" class="text-[10px] font-bold tracking-widest uppercase ${
                  count >= 100
                    ? "text-red-500 animate-pulse"
                    : "text-purple-300"
                }">
                    ${count >= 100 ? "URGENT PRIORITIZED" : "SEEKING RESONANCE"}
                </div>
            </div>
        `;

    const btn = container.querySelector("#muyu-hit");
    const countDisplay = container.querySelector("#muyu-count");
    const progress = container.querySelector("#muyu-progress");
    const popContainer = container.querySelector("#muyu-pop-container");

    const playSound = () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    };

    const createPop = () => {
      const pop = document.createElement("span");
      pop.className =
        "absolute text-purple-600 font-bold text-xs pointer-events-none select-none";
      pop.innerText = "+1 功德";
      pop.style.left = `${Math.random() * 60 + 20}%`;
      pop.style.top = `20%`;
      popContainer.appendChild(pop);

      gsap.to(pop, {
        y: -60,
        opacity: 0,
        duration: 0.6,
        onComplete: () => pop.remove(),
      });
    };

    btn.onclick = () => {
      if (count >= target) return;

      count++;
      countDisplay.innerText = `${count} / ${target}`;
      progress.style.width = `${(count / target) * 100}%`;

      playSound();
      createPop();

      gsap.fromTo(
        btn,
        { scale: 0.95 },
        { scale: 1, duration: 0.1, ease: "back.out(2)" }
      );

      if (count === target) {
        btn.classList.add("opacity-50", "cursor-not-allowed");
        gsap.to(container, { y: -10, duration: 0.2, yoyo: true, repeat: 3 });
      }

      onUpdate && onUpdate(count);
    };
  };

  return { createUI };
};
