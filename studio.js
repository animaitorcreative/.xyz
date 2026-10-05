const KEY = "animaitor.studio.beta.v1";
const DEMO_ID = "jingle-jungle";
const demo = {
  id: DEMO_ID, name: "Jingle Jungle", format: "Preschool animated series",
  audience: "Families / preschool",
  premise: "A curious group of animal friends turn small discoveries into joyful adventures.",
  style: "Bright 3D animation, soft natural light, rich jungle greens, tactile fabrics, warm expressions",
  characters: [
    ["momo", "Momo", "Curious monkey", "Yellow safari hat, green overalls, quick to explore and quick to laugh."],
    ["ellie", "Ellie", "Thoughtful elephant", "Purple floral dress, gentle and observant."],
    ["leo", "Leo", "Brave lion", "Denim overalls, red sneakers, confident until a friend needs help."],
    ["gigi", "Gigi", "Inventive giraffe", "Rainbow scarf, sees patterns and possibilities."],
    ["chip", "Chip", "Energetic chick", "Red cap, small in size and outsized in enthusiasm."],
    ["cruz", "Cruz", "Creative crocodile", "Purple hoodie, makes unexpected things from what is nearby."],
    ["hazel", "Hazel", "Warm-hearted hippo", "Pink overalls, steady, practical, and ready to join in."],
    ["ziggy", "Ziggy", "Playful zebra", "Teal hoodie, rhythmic, curious, and happiest when the group moves together."],
  ].map(([id, name, role, notes]) => ({ id, name, role, notes })),
  scenes: [{
    id: "banana-dance", title: "Momo's Happy Banana Dance", setting: "A sunlit jungle clearing",
    action: "Momo discovers a ripe banana and celebrates with a joyful dance while friends gather to join in.",
    mood: "Joyful, high-energy", frame: "16:9 landscape", characterIds: ["momo"],
    prompt: "Bright 3D animation, soft natural light, rich jungle greens, tactile fabrics, warm expressions. Momo discovers a ripe banana and celebrates with a joyful dance while friends gather to join in. A sunlit jungle clearing. Joyful, high-energy. 16:9 landscape.",
    beats: [
      { label: "ESTABLISH", text: "A wide view of the sunlit clearing reveals a ripe banana beneath broad jungle leaves." },
      { label: "DISCOVERY", text: "Momo spots the banana, leans in with bright curiosity, and reaches for it." },
      { label: "CELEBRATE", text: "Momo dances with the banana as friends enter the clearing and join the rhythm." },
    ],
  }],
};
const makeId = (kind) => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const normalize = (p) => ({
  id: String(p.id || makeId("project")), name: String(p.name || "Untitled project"),
  format: String(p.format || "Creative project"), audience: String(p.audience || ""),
  premise: String(p.premise || ""), style: String(p.style || ""),
  characters: Array.isArray(p.characters) ? p.characters.map((c) => ({ id: String(c.id || makeId("character")), name: String(c.name || "Untitled character"), role: String(c.role || ""), notes: String(c.notes || "") })) : [],
  scenes: Array.isArray(p.scenes) ? p.scenes.map((s) => ({ ...s, id: String(s.id || makeId("scene")), title: String(s.title || "Untitled scene"), characterIds: Array.isArray(s.characterIds) ? s.characterIds : [], beats: Array.isArray(s.beats) ? s.beats : [] })) : [],
});
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.projects) && saved.projects.length) {
      const projects = saved.projects.map(normalize);
      return { projects, selectedProjectId: projects.some((p) => p.id === saved.selectedProjectId) ? saved.selectedProjectId : projects[0].id };
    }
  } catch (error) { console.warn("Could not read the saved workspace.", error); }
  return { projects: [JSON.parse(JSON.stringify(demo))], selectedProjectId: DEMO_ID };
}
const state = loadState();
const $ = (selector) => document.querySelector(selector);
const ui = Object.fromEntries("projectList breadcrumbProject projectHeading projectSubheading saveState projectForm projectName projectFormat projectAudience projectPremise projectStyle castCount sceneCount overviewCastCount overviewSceneCount recentScenes characterRoster characterEditorTitle characterForm characterName characterRole characterNotes deleteCharacterButton sceneCharacterPicks sceneForm sceneTitle sceneSetting sceneAction sceneMood sceneFrame sceneOutput sceneList sceneBoardCount projectDialog newProjectForm importFile toast".split(" ").map((key) => [key, $(`#${key}`)]));
let selectedCharacterId = null;
let selectedSceneId = state.projects.find((p) => p.id === state.selectedProjectId)?.scenes[0]?.id || null;
let toastTimer;
function current() { return state.projects.find((p) => p.id === state.selectedProjectId) || state.projects[0]; }
function esc(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); ui.saveState.textContent = "Saved in this browser"; }
  catch { ui.saveState.textContent = "Could not save locally"; toast("Browser storage is full. Export a backup."); }
}
function toast(message) {
  ui.toast.textContent = message; ui.toast.classList.add("visible"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("visible"), 2200);
}
function render() {
  const p = current();
  ui.projectList.innerHTML = state.projects.map((item) => `<button class="project-link ${item.id === p.id ? "active" : ""}" type="button" data-project-id="${esc(item.id)}" aria-current="${item.id === p.id ? "page" : "false"}"><span class="project-glyph" aria-hidden="true">${esc(item.name.slice(0, 1).toUpperCase())}</span><span class="project-link-name">${esc(item.name)}</span></button>`).join("");
  ui.breadcrumbProject.textContent = p.name; ui.projectHeading.textContent = p.name;
  ui.projectSubheading.innerHTML = `${esc(p.format || "Creative project")} <span aria-hidden="true">·</span> Project bible`;
  ui.projectName.value = p.name; ui.projectFormat.value = p.format; ui.projectAudience.value = p.audience;
  ui.projectPremise.value = p.premise; ui.projectStyle.value = p.style;
  ui.castCount.textContent = p.characters.length; ui.sceneCount.textContent = p.scenes.length;
  ui.overviewCastCount.textContent = p.characters.length; ui.overviewSceneCount.textContent = p.scenes.length;
  ui.sceneBoardCount.textContent = `${String(p.scenes.length).padStart(2, "0")} DRAFTS`;
  renderCharacters(p); renderRecent(p); renderPicks(p); renderSceneList(p);
  renderScene(p.scenes.find((s) => s.id === selectedSceneId));
}
function renderCharacters(p) {
  ui.characterRoster.innerHTML = p.characters.map((c) => `<button class="character-card ${c.id === selectedCharacterId ? "active" : ""}" type="button" data-character-id="${esc(c.id)}" aria-pressed="${c.id === selectedCharacterId}"><span class="character-avatar">${c.id === "momo" ? '<img src="assets/demo/momo.png" alt="">' : esc(c.name.slice(0, 1).toUpperCase())}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.role || "Character")}</small></span></button>`).join("") || '<div class="empty-row">No characters yet.</div>';
  const c = p.characters.find((item) => item.id === selectedCharacterId);
  ui.characterEditorTitle.textContent = c ? c.name : "New character profile";
  ui.characterName.value = c?.name || ""; ui.characterRole.value = c?.role || ""; ui.characterNotes.value = c?.notes || "";
  ui.deleteCharacterButton.hidden = !c;
}
function renderRecent(p) {
  const list = [...p.scenes].slice(-3).reverse();
  ui.recentScenes.innerHTML = list.length ? list.map((s, i) => `<div class="recent-item"><span class="recent-number">0${list.length - i}</span><div><strong>${esc(s.title)}</strong><span>${esc(s.setting || "Scene draft")}</span></div><button type="button" data-open-scene="${esc(s.id)}">Open ↗</button></div>`).join("") : '<div class="empty-row">Your first scene will appear here.</div>';
}
function renderPicks(p) {
  ui.sceneCharacterPicks.innerHTML = p.characters.map((c, i) => `<label class="pick-chip"><input type="checkbox" name="sceneCharacter" value="${esc(c.id)}" ${i === 0 ? "checked" : ""}><span>${esc(c.name)}</span></label>`).join("") || '<span class="empty-row">Add a character to include them.</span>';
}
function renderSceneList(p) {
  ui.sceneList.innerHTML = p.scenes.length ? [...p.scenes].reverse().map((s, i) => `<div class="scene-list-row"><span>${String(p.scenes.length - i).padStart(2, "0")}</span><div><strong>${esc(s.title)}</strong><small>${esc(s.setting || "Unplaced scene")} · ${esc(s.frame || "Unframed")}</small></div><button type="button" data-open-scene="${esc(s.id)}">Open</button></div>`).join("") : '<div class="empty-row">No scene drafts yet.</div>';
}
function renderScene(s) {
  if (!s) { ui.sceneOutput.innerHTML = '<div class="output-empty"><span class="empty-mark">A</span><div class="micro-label">SHOT PLAN</div><h3>Your next scene starts here.</h3><p>Write a scene brief to build a prompt and three shot beats.</p></div>'; return; }
  ui.sceneOutput.innerHTML = `<article class="scene-result"><div class="scene-result-top"><div><div class="micro-label">SCENE PROMPT</div><h3>${esc(s.title)}</h3></div><span>${esc(s.frame || "")}</span></div><div class="prompt-block"><div class="micro-label">PROMPT / ${esc(current().name)}</div><p>${esc(s.prompt || "")}</p></div><div class="beat-list">${s.beats.map((b, i) => `<div class="beat-row"><span>0${i + 1}</span><div><strong>${esc(b.label)}</strong><p>${esc(b.text)}</p></div></div>`).join("")}</div><div class="result-actions"><button class="button button-primary" type="button" data-copy-prompt="${esc(s.id)}">Copy prompt</button><button class="button button-dark" type="button" data-download-prompt="${esc(s.id)}">Download prompt</button><button class="text-button danger-button" type="button" data-delete-scene="${esc(s.id)}">Delete draft</button></div></article>`;
}
function setView(name) {
  document.querySelectorAll("[data-page]").forEach((page) => { page.hidden = page.dataset.page !== name; });
  document.querySelectorAll("[data-view]").forEach((tab) => { const active = tab.dataset.view === name; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
  document.body.classList.remove("sidebar-open"); $("#menuButton").setAttribute("aria-expanded", "false");
}
function slug(value) { return String(value).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "animaitor-project"; }
function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement("a");
  link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function buildScene(p, data) {
  const title = String(data.get("title") || "Untitled scene").trim();
  const setting = String(data.get("setting") || "Unspecified location").trim();
  const action = String(data.get("action") || "").trim();
  const mood = String(data.get("mood") || "Expressive and clear").trim();
  const frame = String(data.get("frame") || "16:9 landscape");
  const characterIds = [...ui.sceneCharacterPicks.querySelectorAll('input[name="sceneCharacter"]:checked')].map((input) => input.value);
  const cast = p.characters.filter((c) => characterIds.includes(c.id));
  const castText = cast.map((c) => `${c.name} (${c.notes || c.role})`).join("; ");
  const prompt = [p.style || "Expressive cinematic visual storytelling", castText, action, setting, mood, frame, "clear composition, readable silhouettes, expressive faces"].filter(Boolean).join(". ") + ".";
  const first = action.charAt(0).toLowerCase() + action.slice(1);
  return { id: makeId("scene"), title, setting, action, mood, frame, characterIds, prompt, beats: [
    { label: "ESTABLISH", text: `Wide shot: establish ${setting} and the mood of ${mood.toLowerCase()}.` },
    { label: "ACTION", text: `Medium shot: ${action}` },
    { label: "REACTION", text: "Close shot: hold on the character reaction and emotional turn of the moment." },
  ], createdAt: new Date().toISOString() };
}

document.addEventListener("click", async (event) => {
  if (event.target.closest("#sidebarBackdrop")) {
    document.body.classList.remove("sidebar-open");
    $("#menuButton").setAttribute("aria-expanded", "false");
  }
  const projectButton = event.target.closest("[data-project-id]");
  if (projectButton) { state.selectedProjectId = projectButton.dataset.projectId; selectedCharacterId = null; selectedSceneId = current().scenes[0]?.id || null; save(); render(); }
  const viewButton = event.target.closest("[data-view], [data-open-view]");
  if (viewButton) setView(viewButton.dataset.view || viewButton.dataset.openView);
  const sceneButton = event.target.closest("[data-open-scene]");
  if (sceneButton) { selectedSceneId = sceneButton.dataset.openScene; setView("scenes"); render(); }
  const characterButton = event.target.closest("[data-character-id]");
  if (characterButton) { selectedCharacterId = characterButton.dataset.characterId; renderCharacters(current()); }
  if (event.target.closest("#newProjectButton")) ui.projectDialog.showModal();
  if (event.target.closest("[data-close-dialog]") || event.target === ui.projectDialog) ui.projectDialog.close();
  if (event.target.closest("#addCharacterButton")) { selectedCharacterId = null; renderCharacters(current()); ui.characterName.focus(); }
  if (event.target.closest("#newSceneButton")) { setView("scenes"); ui.sceneForm.reset(); renderPicks(current()); ui.sceneTitle.focus(); }
  if (event.target.closest("#exportButton")) { const p = current(); download(`${slug(p.name)}-animaitor.json`, JSON.stringify({ version: 1, project: p }, null, 2), "application/json"); toast("Project backup downloaded."); }
  if (event.target.closest("#importButton")) ui.importFile.click();
  if (event.target.closest("#deleteCharacterButton")) {
    const p = current(); p.characters = p.characters.filter((c) => c.id !== selectedCharacterId);
    p.scenes.forEach((s) => { s.characterIds = s.characterIds.filter((cid) => cid !== selectedCharacterId); });
    selectedCharacterId = null; save(); render(); toast("Character removed from this project.");
  }
  const copyButton = event.target.closest("[data-copy-prompt]");
  if (copyButton) { const scene = current().scenes.find((s) => s.id === copyButton.dataset.copyPrompt); try { await navigator.clipboard.writeText(scene.prompt); toast("Prompt copied."); } catch { toast("Clipboard access is unavailable in this browser."); } }
  const promptButton = event.target.closest("[data-download-prompt]");
  if (promptButton) {
    const scene = current().scenes.find((s) => s.id === promptButton.dataset.downloadPrompt);
    const beats = scene.beats.map((b, i) => `${i + 1}. ${b.label}: ${b.text}`).join("\n");
    download(`${slug(scene.title)}-prompt.txt`, `${scene.prompt}\n\nSHOT BEATS\n${beats}`, "text/plain"); toast("Prompt and shot beats downloaded.");
  }
  const deleteScene = event.target.closest("[data-delete-scene]");
  if (deleteScene) { const p = current(); p.scenes = p.scenes.filter((s) => s.id !== deleteScene.dataset.deleteScene); selectedSceneId = p.scenes[0]?.id || null; save(); render(); toast("Scene draft deleted."); }
  if (event.target.closest("#menuButton")) { document.body.classList.toggle("sidebar-open"); $("#menuButton").setAttribute("aria-expanded", String(document.body.classList.contains("sidebar-open"))); }
});

ui.projectForm.addEventListener("submit", (event) => {
  event.preventDefault(); const p = current();
  p.name = ui.projectName.value.trim() || "Untitled project"; p.format = ui.projectFormat.value.trim() || "Creative project";
  p.audience = ui.projectAudience.value.trim(); p.premise = ui.projectPremise.value.trim(); p.style = ui.projectStyle.value.trim();
  save(); render(); toast("Project direction saved.");
});
ui.newProjectForm.addEventListener("submit", (event) => {
  event.preventDefault(); const data = new FormData(ui.newProjectForm);
  const p = normalize({ id: makeId("project"), name: data.get("name"), format: data.get("format"), premise: data.get("premise"), characters: [], scenes: [] });
  state.projects.push(p); state.selectedProjectId = p.id; selectedCharacterId = null; selectedSceneId = null;
  ui.projectDialog.close(); ui.newProjectForm.reset(); save(); render(); setView("overview"); toast("Project created.");
});
ui.characterForm.addEventListener("submit", (event) => {
  event.preventDefault(); const p = current();
  const values = { name: ui.characterName.value.trim(), role: ui.characterRole.value.trim(), notes: ui.characterNotes.value.trim() };
  if (!values.name) return;
  let character = p.characters.find((c) => c.id === selectedCharacterId);
  if (character) Object.assign(character, values);
  else { character = { id: makeId("character"), ...values }; p.characters.push(character); selectedCharacterId = character.id; }
  save(); render(); setView("characters"); toast("Character saved to this project.");
});
ui.sceneForm.addEventListener("submit", (event) => {
  event.preventDefault(); const p = current(); const scene = buildScene(p, new FormData(ui.sceneForm));
  p.scenes.push(scene); selectedSceneId = scene.id; save(); render(); ui.sceneForm.reset(); renderPicks(p); toast("Scene and shot plan saved.");
});
ui.importFile.addEventListener("change", async () => {
  const [file] = ui.importFile.files || []; if (!file) return;
  try {
    const payload = JSON.parse(await file.text()); const p = normalize(payload.project || payload);
    if (!p.name || !Array.isArray(p.characters) || !Array.isArray(p.scenes)) throw new Error("This file does not contain an Animaitor project.");
    if (state.projects.some((item) => item.id === p.id)) p.id = makeId("project");
    state.projects.push(p); state.selectedProjectId = p.id; selectedCharacterId = null; selectedSceneId = p.scenes[0]?.id || null;
    save(); render(); setView("overview"); toast("Project backup imported.");
  } catch (error) { toast(error.message || "Could not import this file."); }
  finally { ui.importFile.value = ""; }
});
const requestedProject = new URLSearchParams(window.location.search).get("project");
if (requestedProject && state.projects.some((p) => p.id === requestedProject)) state.selectedProjectId = requestedProject;
render();
save();
