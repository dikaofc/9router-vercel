import { v4 as uuidv4 } from "uuid";
import { getAdapter } from "../driver.js";
import { parseJson, stringifyJson } from "../helpers/jsonCol.js";
import { flushCurrentAdapter } from "../requestFlush.js";

function rowToCombo(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    models: parseJson(row.models, []),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getCombos() {
  const db = await getAdapter();
  const rows = db.all(`SELECT * FROM combos ORDER BY createdAt ASC`);
  return rows.map(rowToCombo);
}

export async function getComboById(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM combos WHERE id = ?`, [id]);
  return rowToCombo(row);
}

export async function getComboByName(name) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM combos WHERE name = ?`, [name]);
  return rowToCombo(row);
}

export async function createCombo(data) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  const combo = {
    id: uuidv4(),
    name: data.name,
    kind: data.kind || null,
    models: data.models || [],
    createdAt: now,
    updatedAt: now,
  };
  db.run(
    `INSERT INTO combos(id, name, kind, models, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?)`,
    [combo.id, combo.name, combo.kind, stringifyJson(combo.models), combo.createdAt, combo.updatedAt]
  );
  await flushCurrentAdapter();
  return combo;
}

export async function updateCombo(id, data) {
  const db = await getAdapter();
  let result = null;
  db.transaction(() => {
    const row = db.get(`SELECT * FROM combos WHERE id = ?`, [id]);
    if (!row) return;
    const merged = { ...rowToCombo(row), ...data, updatedAt: new Date().toISOString() };
    db.run(
      `UPDATE combos SET name = ?, kind = ?, models = ?, updatedAt = ? WHERE id = ?`,
      [merged.name, merged.kind, stringifyJson(merged.models || []), merged.updatedAt, id]
    );
    result = merged;
  });
  await flushCurrentAdapter();
  return result;
}

export async function deleteCombo(id) {
  const db = await getAdapter();
  const res = db.run(`DELETE FROM combos WHERE id = ?`, [id]);
  await flushCurrentAdapter();
  return (res?.changes ?? 0) > 0;
}

/**
 * Auto-combo: any provider a user connects becomes a ready-to-use combo named by
 * the provider's alias (e.g. adding `gemini` yields a `gemini` combo containing
 * `gemini/<modelId>` for every registry model). Fail-open: passthrough providers
 * with no registry models (e.g. `oc`) return null and are skipped — they're
 * already covered by the managed `free-first` combo. Never clobbers a user-owned
 * combo sharing the alias name (only writes when kind === "auto").
 */
export async function ensureAutoComboForProvider(providerId) {
  try {
    const { PROVIDER_MODELS } = await import("open-sse/config/providerModels.js");
    const REGISTRY = (await import("open-sse/providers/registry/index.js")).default;
    const entry = REGISTRY.find((e) => e && e.id === providerId);
    const alias = entry?.alias || providerId;
    const models = PROVIDER_MODELS[alias] || [];
    if (!models.length) return null;

    const entries = models.map((m) => `${alias}/${m.id}`);
    const existing = await getComboByName(alias);
    if (existing) {
      if (existing.kind === "auto") {
        return await updateCombo(existing.id, { models: entries, kind: "auto" });
      }
      return null; // user-owned combo with same name — don't overwrite
    }
    return await createCombo({ name: alias, kind: "auto", models: entries });
  } catch (e) {
    console.warn(`[combos] auto-combo for ${providerId} skipped: ${e.message}`);
    return null;
  }
}

/**
 * Remove the auto-combo for a provider once its last connection is gone, so we
 * don't leave an orphan combo. Only deletes combos we created (kind === "auto").
 */
export async function removeAutoComboForProvider(providerId) {
  try {
    const REGISTRY = (await import("open-sse/providers/registry/index.js")).default;
    const entry = REGISTRY.find((e) => e && e.id === providerId);
    const alias = entry?.alias || providerId;
    const existing = await getComboByName(alias);
    if (existing && existing.kind === "auto") {
      return await deleteCombo(existing.id);
    }
  } catch (e) {
    console.warn(`[combos] auto-combo removal for ${providerId} skipped: ${e.message}`);
  }
  return false;
}
