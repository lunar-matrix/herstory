export const Navigation = (containerId) => {
  const sections = [
    { name: "原创", en: "Original" },
    { name: "转载", en: "Curated" },
    { name: "史书", en: "Her-History" },
    { name: "耻辱柱", en: "Shame" },
    { name: "辟谣", en: "Fact-Check" },
    { name: "树洞", en: "Sanctuary" },
  ];

  const html = sections
    .map(
      (s) => `
        <a href="#" class="group flex flex-col items-start">
            <span class="text-xs text-purple-300 group-hover:text-purple-600 transition-colors">${s.en}</span>
            <span class="text-sm font-bold tracking-wide">${s.name}</span>
        </a>
    `
    )
    .join("");

  const container = document.getElementById(containerId);
  if (container) container.innerHTML = html;
};
